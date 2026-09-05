"""
Finance Copilot Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str


class CopilotQuery(BaseModel):
    message: str
    session_id: Optional[str] = None
    batch_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class CitationOut(BaseModel):
    entity_type: str  # TRANSACTION, EXCEPTION, BATCH, SETTLEMENT
    entity_id: str
    reference_code: str
    amount: Optional[float] = None
    status: Optional[str] = None
    details: Optional[str] = None


class ToolCallOut(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result_summary: str


class CopilotResponse(BaseModel):
    reply: str
    session_id: str
    citations: List[CitationOut] = []
    tool_calls: List[ToolCallOut] = []
    confidence: float = 1.0
    suggested_followups: List[str] = []
