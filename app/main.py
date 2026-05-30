from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Routers
from app.routers import chat, rag, agent, prompt, memory

# Initialize dotenv
load_dotenv()

app = FastAPI(title="LangChain Complete Showcase API")

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(prompt.router, prefix="/api/prompt", tags=["prompt"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
