from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Routers
from app.routers import chat, rag, agent, prompt, memory, extraction

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

from fastapi import Request

@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.endswith(".html") or path.endswith(".js") or path.endswith(".css") or path == "/":
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(prompt.router, prefix="/api/prompt", tags=["prompt"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(extraction.router, prefix="/api/extraction", tags=["extraction"])

from pydantic import BaseModel
class DebugErrorPayload(BaseModel):
    message: str
    source: str
    lineno: int
    colno: int
    error: str

@app.post("/api/debug/error")
async def debug_error_endpoint(payload: DebugErrorPayload):
    print("\n=======================================================")
    print("!!! BROWSER JAVASCRIPT EXCEPTION DETECTED !!!")
    print(f"Message: {payload.message}")
    print(f"Source: {payload.source}:{payload.lineno}:{payload.colno}")
    print(f"Stack Trace:\n{payload.error}")
    print("=======================================================\n")
    return {"status": "ok"}
