"""
ReconciliationBatch and Upload ORM Models
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Numeric, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class BatchStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ReconciliationBatch(Base):
    __tablename__ = "reconciliation_batches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default=BatchStatus.PENDING.value, nullable=False, index=True)
    
    # Quantitative Metrics
    total_records = Column(Integer, default=0, nullable=False)
    matched_records = Column(Integer, default=0, nullable=False)
    likely_matched_records = Column(Integer, default=0, nullable=False)
    partial_matched_records = Column(Integer, default=0, nullable=False)
    unmatched_records = Column(Integer, default=0, nullable=False)
    exception_records = Column(Integer, default=0, nullable=False)
    resolved_exceptions = Column(Integer, default=0, nullable=False)
    
    # Financial KPI Totals
    match_rate = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    exception_rate = Column(Float, default=0.0, nullable=False)
    resolution_rate = Column(Float, default=0.0, nullable=False)
    total_volume = Column(Numeric(14, 2), default=0.0, nullable=False)
    matched_volume = Column(Numeric(14, 2), default=0.0, nullable=False)
    discrepancy_amount = Column(Numeric(14, 2), default=0.0, nullable=False)
    total_fee_amount = Column(Numeric(14, 2), default=0.0, nullable=False)
    total_tax_amount = Column(Numeric(14, 2), default=0.0, nullable=False)
    
    # Performance & Throughput
    processing_time_ms = Column(Integer, default=0, nullable=False)
    throughput_rps = Column(Float, default=0.0, nullable=False)
    
    # Metadata & Progress
    processed_count = Column(Integer, default=0, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="batches")
    creator = relationship("User", back_populates="created_batches", foreign_keys=[created_by])
    transactions = relationship("Transaction", back_populates="batch", cascade="all, delete-orphan")
    matches = relationship("ReconciliationMatch", back_populates="batch", cascade="all, delete-orphan")
    exceptions = relationship("ExceptionRecord", back_populates="batch", cascade="all, delete-orphan")
    uploads = relationship("Upload", back_populates="batch")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("reconciliation_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # CSV, XLSX, JSON
    source_type = Column(String(50), nullable=False)  # PAYMENT, SETTLEMENT, BANK_STATEMENT, INVOICE
    row_count = Column(Integer, default=0, nullable=False)
    raw_file_path = Column(String(500), nullable=True)
    detected_columns = Column(JSON, default=list, nullable=False)
    mapping_applied = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    batch = relationship("ReconciliationBatch", back_populates="uploads")
