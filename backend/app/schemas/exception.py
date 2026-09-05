"""
Exception Pydantic Schemas
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.transaction import TransactionOut


class ExceptionActionRequest(BaseModel):
    action_type: str = Field(..., description="APPROVE_MATCH, REJECT_MATCH, RESOLVE, ASSIGN, ADD_NOTE, AI_REANALYZE")
    notes: Optional[str] = None
    target_user_id: Optional[str] = None
    matched_transaction_id: Optional[str] = None


class ExceptionActionOut(BaseModel):
    id: str
    action_type: str
    previous_status: Optional[str]
    new_status: Optional[str]
    notes: Optional[str]
    user_id: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ExceptionOut(BaseModel):
    id: str
    batch_id: str
    transaction_id: str
    exception_type: str
    severity: str
    status: str
    expected_amount: float
    actual_amount: float
    difference_amount: float
    evidence_json: Dict[str, Any]
    ai_explanation: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_recommended_action: Optional[str] = None
    ai_evidence: Optional[List[Any]] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    transaction: Optional[TransactionOut] = None
    model_config = ConfigDict(from_attributes=True)


class ExceptionDetailOut(ExceptionOut):
    actions: List[ExceptionActionOut] = []
    comparative_ledger: Optional[Dict[str, Any]] = None
