from fastapi import APIRouter, Header, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.dependencies import get_chat_model, logger

router = APIRouter()

# ---------------------------------------------------------------------------
# 1. Pydantic Extraction Schemas
# ---------------------------------------------------------------------------
class ReceiptItem(BaseModel):
    item_name: str = Field(description="Name of the purchased item or service")
    price: float = Field(description="Unit price of the item")
    quantity: int = Field(description="Quantity purchased")

class ReceiptSchema(BaseModel):
    merchant: str = Field(description="Name of the store or merchant")
    date: str = Field(description="Date of purchase or transaction")
    items: List[ReceiptItem] = Field(description="List of purchased items")
    total_amount: float = Field(description="Total amount listed on receipt")

class ContactSchema(BaseModel):
    full_name: str = Field(description="Full name of the contact person")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    company: Optional[str] = Field(None, description="Company or Organization")
    job_title: Optional[str] = Field(None, description="Job Title or Position")

class CalendarEvent(BaseModel):
    title: str = Field(description="Title or topic of the meeting/event")
    date: str = Field(description="Date of the event")
    start_time: str = Field(description="Start time (e.g. 10:00 AM or 14:00)")
    end_time: str = Field(description="End time (e.g. 11:00 AM or 15:00)")
    location: Optional[str] = Field(None, description="Physical location or conference link")
    description: Optional[str] = Field(None, description="Summary or agenda points")

class CalendarSchema(BaseModel):
    events: List[CalendarEvent] = Field(description="List of extracted schedule events")

# ---------------------------------------------------------------------------
# 2. Endpoint Controller
# ---------------------------------------------------------------------------
class ExtractionPayload(BaseModel):
    text: str
    schema_type: str  # "receipt", "contact", "calendar"
    provider: str
    model: str
    temperature: float

@router.post("/run")
async def extraction_run_endpoint(
    payload: ExtractionPayload,
    x_openai_key: Optional[str] = Header(None),
    x_google_key: Optional[str] = Header(None),
    x_groq_key: Optional[str] = Header(None)
):
    try:
        # Load chat model
        llm = get_chat_model(
            provider=payload.provider,
            model_name=payload.model,
            temperature=payload.temperature,
            openai_key=x_openai_key,
            google_key=x_google_key,
            groq_key=x_groq_key
        )
        
        # Bind correct schema
        if payload.schema_type == "receipt":
            structured_llm = llm.with_structured_output(ReceiptSchema)
            instruction = "Extract transaction details, merchant name, date, total, and all line items from the receipt text."
        elif payload.schema_type == "contact":
            structured_llm = llm.with_structured_output(ContactSchema)
            instruction = "Extract contact information, including full name, email, phone number, company, and job title from the text."
        elif payload.schema_type == "calendar":
            structured_llm = llm.with_structured_output(CalendarSchema)
            instruction = "Extract all calendar events, including title, date, start time, end time, location, and description agenda."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported schema type: {payload.schema_type}")
            
        prompt = f"{instruction}\n\n=== RAW INPUT TEXT ===\n{payload.text}"
        
        # Invoke structured model
        result = await structured_llm.ainvoke(prompt)
        
        # Convert Pydantic object to dict/JSON serializable
        if hasattr(result, "dict"):
            result_dict = result.dict()
        elif hasattr(result, "model_dump"):
            result_dict = result.model_dump()
        else:
            result_dict = result
            
        return {"data": result_dict}
    except Exception as e:
        logger.error(f"Extraction error: {e}", exc_info=True)
        from app.dependencies import format_api_error
        raise HTTPException(status_code=400, detail=format_api_error(e))
