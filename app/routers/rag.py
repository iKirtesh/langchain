import os
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from typing import Optional
from pydantic import BaseModel
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage
from app.dependencies import get_vector_store, get_chat_model, loaded_documents, logger

router = APIRouter()

@router.post("/upload")
async def rag_upload_endpoint(
    file: UploadFile = File(...),
    chunk_size: int = Form(500),
    chunk_overlap: int = Form(50),
    x_openai_key: Optional[str] = Header(None),
    x_google_key: Optional[str] = Header(None)
):
    try:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, 
            chunk_overlap=chunk_overlap
        )
        chunks = text_splitter.split_text(text)
        
        # Build metadata list
        metadatas = [{"source": file.filename, "chunk_index": i} for i in range(len(chunks))]
        
        # Get active vector store and save
        vs = get_vector_store(x_openai_key, x_google_key)
        vs.add_texts(texts=chunks, metadatas=metadatas)
        
        # Update UI state tracking
        doc_info = {
            "filename": file.filename,
            "size_bytes": len(content),
            "chunks_count": len(chunks),
            "store_type": "Google/OpenAI Embeddings" if (x_openai_key or x_google_key or os.getenv("OPENAI_API_KEY") or os.getenv("GOOGLE_API_KEY")) else "Local Hash Cosine Similarity"
        }
        loaded_documents.append(doc_info)
        
        return {
            "status": "success",
            "message": f"Successfully indexed '{file.filename}' into vector store.",
            "details": doc_info
        }
    except Exception as e:
        logger.error(f"RAG upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def get_rag_documents():
    return loaded_documents

class RAGQueryPayload(BaseModel):
    query: str
    provider: str
    model: str
    temperature: float

@router.post("/query")
async def rag_query_endpoint(
    payload: RAGQueryPayload,
    x_openai_key: Optional[str] = Header(None),
    x_google_key: Optional[str] = Header(None),
    x_groq_key: Optional[str] = Header(None)
):
    try:
        # 1. Retrieve relevant chunks from active vector store
        vs = get_vector_store(x_openai_key, x_google_key)
        
        # Check if vector store contains documents
        if not loaded_documents:
            return {
                "answer": "No documents have been indexed yet. Please upload a document in the dashboard first.",
                "sources": []
            }
            
        docs = vs.similarity_search(payload.query, k=3)
        
        # 2. Build context
        context_blocks = []
        sources = []
        for idx, doc in enumerate(docs):
            src_name = doc.metadata.get("source", "Unknown")
            context_blocks.append(f"--- Document: {src_name} (Chunk {doc.metadata.get('chunk_index', idx)}) ---\n{doc.page_content}")
            sources.append({
                "source": src_name,
                "chunk": doc.metadata.get('chunk_index', idx),
                "content": doc.page_content
            })
            
        context_str = "\n\n".join(context_blocks)
        
        # 3. Create RAG System prompt and query model
        rag_prompt = (
            "You are an expert Q&A assistant. Answer the user's question using ONLY the provided context blocks below.\n"
            "If the context does not contain the answer, say 'I cannot find the answer in the provided documents.'\n"
            "Support your answer with concise references to the source documents.\n\n"
            f"=== CONTEXT BLOCKS ===\n{context_str}\n\n"
            f"User Question: {payload.query}"
        )
        
        model = get_chat_model(
            provider=payload.provider,
            model_name=payload.model,
            temperature=payload.temperature,
            openai_key=x_openai_key,
            google_key=x_google_key,
            groq_key=x_groq_key
        )
        
        response = await model.ainvoke([HumanMessage(content=rag_prompt)])
        
        return {
            "answer": response.content,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"RAG query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
