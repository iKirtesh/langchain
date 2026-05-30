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
        try:
            response = await model.ainvoke(langchain_messages)
            return {"content": response.content}
        except Exception as e:
            err_str = str(e)
            if payload.provider == "google" and ("RESOURCE_EXHAUSTED" in err_str or "429" in err_str):
                import os
                groq_key = x_groq_key or os.getenv("GROQ_API_KEY")
                if groq_key:
                    logger.info("Google Gemini rate-limited. Automatically failing over to Groq...")
                    try:
                        failover_model = get_chat_model(
                            provider="groq",
                            model_name="llama-3.3-70b-versatile",
                            temperature=payload.temperature,
                            groq_key=groq_key
                        )
                        response = await failover_model.ainvoke(langchain_messages)
                        failover_note = (
                            f"{response.content}\n\n"
                            "*(Note: Google Gemini API was rate-limited, so the system automatically failed over to Groq Llama-3.3-70B in real-time to complete your request.)*"
                        )
                        return {"content": failover_note}
                    except Exception as failover_err:
                        logger.error(f"Failover to Groq failed: {failover_err}")
            
            logger.error(f"Chat error: {e}", exc_info=True)
            from app.dependencies import format_api_error
            raise HTTPException(status_code=400, detail=format_api_error(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat setup error: {e}", exc_info=True)
        from app.dependencies import format_api_error
        raise HTTPException(status_code=400, detail=format_api_error(e))
