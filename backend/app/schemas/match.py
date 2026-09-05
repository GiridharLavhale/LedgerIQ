"""
Reconciliation Match Pydantic Schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.transaction import TransactionOut


class MatchOut(BaseModel):
    id: str
    batch_id: str
    primary_txn_id: str
    matched_txn_id: str
    strategy: str
    confidence: float
    status: str
    amount_difference: float
    date_difference_days: int
    calculated_fee: float
    calculated_tax: float
    evidence_summary: str
    created_at: datetime
    primary_txn: Optional[TransactionOut] = None
    matched_txn: Optional[TransactionOut] = None
    model_config = ConfigDict(from_attributes=True)


class ManualMatchRequest(BaseModel):
    primary_txn_id: str
    matched_txn_id: str
    notes: Optional[str] = None
