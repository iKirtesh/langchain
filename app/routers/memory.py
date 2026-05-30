from fastapi import APIRouter, Header, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from app.dependencies import get_chat_model, logger

router = APIRouter()

class MemoryPayload(BaseModel):
    provider: str
    model: str
    temperature: float
    turns: List[Dict[str, str]]  # e.g., [{"user": "Hi, my name is Arthur."}, {"user": "I am a space traveler."}]

@router.post("/run")
async def memory_run_endpoint(
    payload: MemoryPayload,
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
        
        # We will simulate memory side-by-side:
        # 1. Full Buffer Memory Prompt Context
        # 2. Summarized Memory Prompt Context
        
        buffer_messages = []
        summary_text = ""
        logs = []
        
        for idx, turn in enumerate(payload.turns):
            user_input = turn.get("user", "")
            
            # --- Buffer Memory Turn ---
            buffer_prompt = buffer_messages.copy()
            buffer_prompt.append(HumanMessage(content=user_input))
            
            # Run model for answer (simulated conversation flow)
            resp = await model.ainvoke(buffer_prompt)
            assistant_output = resp.content
            
            # Update history buffer
            buffer_messages.append(HumanMessage(content=user_input))
            buffer_messages.append(AIMessage(content=assistant_output))
            
            # --- Summary Memory Turn ---
            # If not the first turn, we summarize the previous history using a summarization prompt
            if idx > 0:
                summary_prompt = (
                    "Progressively summarize the conversation history between a human and an AI.\n"
                    f"Current Summary: {summary_text}\n"
                    f"New human message: {payload.turns[idx-1].get('user', '')}\n"
                    f"New AI response: {logs[-1]['assistant_output']}\n"
                    "Provide a new concise, consolidated summary of the conversation."
                )
                sum_resp = await model.ainvoke([HumanMessage(content=summary_prompt)])
                summary_text = sum_resp.content
            else:
                summary_text = "No previous history."
                
            logs.append({
                "turn_index": idx + 1,
                "user_input": user_input,
                "assistant_output": assistant_output,
                "buffer_memory_context": [
                    {"role": "user" if isinstance(m, HumanMessage) else "assistant", "content": m.content} 
                    for m in buffer_prompt
                ],
                "summary_memory_context": f"System Summary: {summary_text}\nHuman: {user_input}"
            })
            
        return {"turns": logs}
    except Exception as e:
        logger.error(f"Memory test error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
