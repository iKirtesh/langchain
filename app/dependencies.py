import os
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

# LangChain Imports
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import InMemoryVectorStore

# Models
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("langchain-backend")

# ---------------------------------------------------------------------------
# Robust Custom Embedding Fallback
# ---------------------------------------------------------------------------
class SimpleLocalEmbeddings(Embeddings):
    """
    A robust local fallback embedding model using simple token/character counting 
    and cosine normalization. Ensures RAG functionality works without API keys.
    """
    def __init__(self, dimension: int = 128):
        self.dimension = dimension

    def _embed(self, text: str) -> List[float]:
        import numpy as np
        vec = np.zeros(self.dimension)
        words = text.lower().split()
        if not words:
            return vec.tolist()
        
        # Simple hashing vectorizer
        for idx, word in enumerate(words):
            h = hash(word) % self.dimension
            # Apply weights based on position or basic TF-IDF style counts
            vec[h] += 1.0 + (1.0 / (idx + 1.0))
            
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed(text)

# ---------------------------------------------------------------------------
# Global App State (In-Memory stores)
# ---------------------------------------------------------------------------
# Store vector stores and loaded documents by embedding type
embedding_cache: Dict[str, Embeddings] = {
    "local": SimpleLocalEmbeddings()
}
vector_store_cache: Dict[str, InMemoryVectorStore] = {
    "local": InMemoryVectorStore(embedding_cache["local"])
}
loaded_documents: List[Dict[str, Any]] = []

def get_embeddings(openai_key: Optional[str] = None, google_key: Optional[str] = None) -> tuple[str, Embeddings]:
    """Retrieve or create correct Embeddings instance based on available keys."""
    # Check for active Google key
    g_key = google_key or os.getenv("GOOGLE_API_KEY")
    if g_key:
        cache_key = f"google_{hash(g_key)}"
        if cache_key not in embedding_cache:
            embedding_cache[cache_key] = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001", 
                google_api_key=g_key
            )
        return cache_key, embedding_cache[cache_key]
        
    # Check for active OpenAI key
    o_key = openai_key or os.getenv("OPENAI_API_KEY")
    if o_key:
        cache_key = f"openai_{hash(o_key)}"
        if cache_key not in embedding_cache:
            embedding_cache[cache_key] = OpenAIEmbeddings(
                model="text-embedding-3-small", 
                api_key=o_key
            )
        return cache_key, embedding_cache[cache_key]
        
    # Fallback
    return "local", embedding_cache["local"]

def get_vector_store(openai_key: Optional[str] = None, google_key: Optional[str] = None) -> InMemoryVectorStore:
    cache_key, embeddings = get_embeddings(openai_key, google_key)
    if cache_key not in vector_store_cache:
        vector_store_cache[cache_key] = InMemoryVectorStore(embeddings)
    return vector_store_cache[cache_key]

# ---------------------------------------------------------------------------
# Helper: Get Chat Model Dynamically
# ---------------------------------------------------------------------------
def get_chat_model(
    provider: str, 
    model_name: str, 
    temperature: float, 
    openai_key: Optional[str] = None, 
    google_key: Optional[str] = None, 
    groq_key: Optional[str] = None
):
    # Verify API key is available
    if provider == "google":
        key = google_key or os.getenv("GOOGLE_API_KEY")
        if not key:
            raise HTTPException(status_code=400, detail="Google API Key missing. Please provide it in settings panel.")
        return ChatGoogleGenerativeAI(model=model_name, temperature=temperature, google_api_key=key, max_retries=0)
        
    elif provider == "openai":
        key = openai_key or os.getenv("OPENAI_API_KEY")
        if not key:
            raise HTTPException(status_code=400, detail="OpenAI API Key missing. Please provide it in settings panel.")
        return ChatOpenAI(model=model_name, temperature=temperature, api_key=key, max_retries=0)
        
    elif provider == "groq":
        key = groq_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise HTTPException(status_code=400, detail="Groq API Key missing. Please provide it in settings panel.")
        return ChatGroq(model=model_name, temperature=temperature, groq_api_key=key, max_retries=0)
        
    elif provider == "ollama":
        from langchain_community.chat_models import ChatOllama
        return ChatOllama(model=model_name, temperature=temperature)
        
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported LLM provider: {provider}")

def format_api_error(e: Exception) -> str:
    err_str = str(e)
    if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
        return (
            "⚠️ Google Gemini API Quota Exceeded (Free tier limit: 20 requests per minute).\n\n"
            "Please wait 30 seconds for your rate limit to reset, or switch to Groq or local Ollama in the sidebar config!"
        )
    if "API_KEY_INVALID" in err_str or "invalid api key" in err_str.lower() or "authentication" in err_str.lower():
        return "🔑 Invalid API Key. Please verify the API key provided in your settings panel or .env configuration."
    return err_str
