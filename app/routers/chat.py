from fastapi import APIRouter, Header, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.dependencies import get_chat_model, logger

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatPayload(BaseModel):
    provider: str
    model: str
    temperature: float
    system_prompt: Optional[str] = ""
    messages: List[ChatMessage]

@router.post("/chat")
async def chat_endpoint(
    payload: ChatPayload,
    x_openai_key: Optional[str] = Header(None),
    x_google_key: Optional[str] = Header(None),
    x_groq_key: Optional[str] = Header(None)
):
    try:
        model = get_chat_model(
            provider=payload.provider,
            model_name=payload.model,
            temperature=payload.temperature,
            openai_key=x_openai_key,
            google_key=x_google_key,
            groq_key=x_groq_key
        )
        
        # Assemble message list
        langchain_messages = []
        if payload.system_prompt:
            langchain_messages.append(SystemMessage(content=payload.system_prompt))
            
        for msg in payload.messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.role == "system":
                langchain_messages.append(SystemMessage(content=msg.content))
                
        # Invoke model
        response = await model.ainvoke(langchain_messages)
        return {"content": response.content}
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
