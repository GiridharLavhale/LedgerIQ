"""
Reporting and Export Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class ReportExportRequest(BaseModel):
    batch_id: Optional[str] = None
    report_type: str = "RECONCILIATION"  # RECONCILIATION, EXCEPTION, SETTLEMENT, EVALUATION, AUDIT
    format: str = "CSV"  # CSV, XLSX, PDF, JSON


class FinancialReportSummary(BaseModel):
    title: str
    generated_at: datetime
    total_volume_inr: float
    matched_volume_inr: float
    unreconciled_volume_inr: float
    total_fees_inr: float
    total_taxes_inr: float
    match_rate_pct: float
    exception_rate_pct: float
    executive_summary: str
    top_exceptions: List[Dict[str, Any]]
