"""
Transaction Pydantic Schemas
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TransactionBase(BaseModel):
    source_type: str
    source_name: str = "Upload"
    external_id: Optional[str] = None
    reference_id: Optional[str] = None
    order_id: Optional[str] = None
    amount: float
    fee: float = 0.0
    tax: float = 0.0
    net_amount: float
    currency: str = "INR"
    transaction_date: datetime
    counterparty: Optional[str] = None
    description: Optional[str] = None


class CanonicalRecordSchema(TransactionBase):
    raw_data: Optional[Dict[str, Any]] = None


class TransactionOut(TransactionBase):
    id: str
    batch_id: str
    upload_id: Optional[str] = None
    status: str
    raw_data: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


TransactionResponse = TransactionOut
