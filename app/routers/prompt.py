from fastapi import APIRouter, Header, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.dependencies import get_chat_model, logger

router = APIRouter()

class PromptRunPayload(BaseModel):
    provider: str
    model: str
    temperature: float
    template1: str  # e.g., "Write a character name for a {genre} story."
    template2: str  # e.g., "Write a short 1-paragraph summary of a story starring {character_name}."
    variables: Dict[str, str]  # e.g., {"genre": "Sci-Fi"}

@router.post("/run")
async def prompt_run_endpoint(
    payload: PromptRunPayload,
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
        
        # 1. Chain 1: Format Prompt 1, invoke, extract string output
        p_template1 = PromptTemplate.from_template(payload.template1)
        prompt1_text = p_template1.format(**payload.variables)
        
        chain1 = p_template1 | model | StrOutputParser()
        result1 = await chain1.ainvoke(payload.variables)
        
        # 2. Chain 2: Use the output of Prompt 1 to populate Prompt 2
        # Clean character name output slightly
        character_name = result1.strip().strip('"').strip("'")
        
        p_template2 = PromptTemplate.from_template(payload.template2)
        prompt2_variables = {"character_name": character_name}
        prompt2_text = p_template2.format(**prompt2_variables)
        
        chain2 = p_template2 | model | StrOutputParser()
        result2 = await chain2.ainvoke(prompt2_variables)
        
        return {
            "chain1": {
                "prompt_rendered": prompt1_text,
                "output": result1
            },
            "chain2": {
                "prompt_rendered": prompt2_text,
                "output": result2
            }
        }
    except Exception as e:
        logger.error(f"Prompt chain error: {e}", exc_info=True)
        from app.dependencies import format_api_error
        raise HTTPException(status_code=400, detail=format_api_error(e))
