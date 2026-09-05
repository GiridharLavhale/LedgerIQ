"""
Batch and Upload Pydantic Schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class ReconciliationOptions(BaseModel):
    date_tolerance_days: int = Field(3, ge=0, le=30)
    fee_rate: float = Field(0.02, ge=0.0, le=0.20)
    gst_rate: float = Field(0.18, ge=0.0, le=0.50)
    amount_tolerance: float = Field(0.05, ge=0.0, le=10.0)


class BatchCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    upload_ids: List[str] = Field(default_factory=list)
    options: Optional[ReconciliationOptions] = Field(default_factory=ReconciliationOptions)
    notes: Optional[str] = None


class BatchProgress(BaseModel):
    batch_id: str
    status: str
    processed_count: int
    total_records: int
    percent: float
    matched_records: int
    exception_records: int
    match_rate: float


class BatchSummaryOut(BaseModel):
    id: str
    name: str
    status: str
    total_records: int
    matched_records: int
    likely_matched_records: int
    partial_matched_records: int
    unmatched_records: int
    exception_records: int
    resolved_exceptions: int
    match_rate: float
    exception_rate: float
    resolution_rate: float
    total_volume: float
    matched_volume: float
    discrepancy_amount: float
    total_fee_amount: float
    total_tax_amount: float
    processing_time_ms: int
    throughput_rps: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class BatchDetailOut(BatchSummaryOut):
    metadata_json: Dict[str, Any]
    notes: Optional[str]
    created_by: Optional[str]


class UploadOut(BaseModel):
    id: str
    filename: str
    file_type: str
    source_type: str
    row_count: int
    detected_columns: List[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
