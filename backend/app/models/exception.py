"""
ExceptionRecord and ExceptionAction ORM Models
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Numeric, DateTime, JSON, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class ExceptionType(str, enum.Enum):
    AMOUNT_MISMATCH = "AMOUNT_MISMATCH"
    MISSING_SETTLEMENT = "MISSING_SETTLEMENT"
    MISSING_PAYMENT = "MISSING_PAYMENT"
    DUPLICATE_TRANSACTION = "DUPLICATE_TRANSACTION"
    DATE_MISMATCH = "DATE_MISMATCH"
    REFERENCE_MISMATCH = "REFERENCE_MISMATCH"
    FEE_DISCREPANCY = "FEE_DISCREPANCY"
    TAX_DISCREPANCY = "TAX_DISCREPANCY"
    PARTIAL_SETTLEMENT = "PARTIAL_SETTLEMENT"
    UNKNOWN = "UNKNOWN"


class ExceptionSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ExceptionStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    APPROVED_MATCH = "APPROVED_MATCH"
    REJECTED_MATCH = "REJECTED_MATCH"
    RESOLVED = "RESOLVED"
    IGNORED = "IGNORED"


class ActionType(str, enum.Enum):
    APPROVE_MATCH = "APPROVE_MATCH"
    REJECT_MATCH = "REJECT_MATCH"
    RESOLVE = "RESOLVE"
    ASSIGN = "ASSIGN"
    ADD_NOTE = "ADD_NOTE"
    AI_REANALYZE = "AI_REANALYZE"


class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("reconciliation_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Classification
    exception_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default=ExceptionSeverity.MEDIUM.value, nullable=False, index=True)
    status = Column(String(50), default=ExceptionStatus.OPEN.value, nullable=False, index=True)
    
    # Financial Discrepancies
    expected_amount = Column(Numeric(14, 2), nullable=False)
    actual_amount = Column(Numeric(14, 2), nullable=False)
    difference_amount = Column(Numeric(14, 2), nullable=False)
    
    # Deterministic Evidence
    evidence_json = Column(JSON, default=dict, nullable=False)
    
    # AI Root-Cause Reasoning
    ai_explanation = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_recommended_action = Column(String(100), nullable=True)
    ai_evidence = Column(JSON, default=list, nullable=True)
    
    # Human Assignment & Timestamps
    assigned_to = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    resolved_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    batch = relationship("ReconciliationBatch", back_populates="exceptions")
    transaction = relationship("Transaction", back_populates="exceptions")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_exceptions")
    resolver = relationship("User", foreign_keys=[resolved_by])
    actions = relationship("ExceptionAction", back_populates="exception_record", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_exc_batch_status", "batch_id", "status"),
        Index("idx_exc_type_sev", "exception_type", "severity"),
    )


class ExceptionAction(Base):
    __tablename__ = "exception_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exception_id = Column(String(36), ForeignKey("exceptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(50), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    payload_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    exception_record = relationship("ExceptionRecord", back_populates="actions")
    user = relationship("User")
