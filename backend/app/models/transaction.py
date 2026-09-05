"""
Canonical Financial Transaction ORM Model
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, JSON, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class SourceType(str, enum.Enum):
    PAYMENT = "PAYMENT"
    SETTLEMENT = "SETTLEMENT"
    BANK_STATEMENT = "BANK_STATEMENT"
    INVOICE = "INVOICE"
    FEE = "FEE"
    TAX = "TAX"
    REFUND = "REFUND"


class TransactionStatus(str, enum.Enum):
    UNRECONCILED = "UNRECONCILED"
    MATCHED = "MATCHED"
    LIKELY_MATCH = "LIKELY_MATCH"
    PARTIAL_MATCH = "PARTIAL_MATCH"
    EXCEPTION = "EXCEPTION"
    MANUAL_RESOLVED = "MANUAL_RESOLVED"
    DUPLICATE = "DUPLICATE"
    INVALID = "INVALID"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(String(36), ForeignKey("reconciliation_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    upload_id = Column(String(36), ForeignKey("uploads.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Financial Classification
    source_type = Column(String(50), nullable=False, index=True)
    source_name = Column(String(100), default="Manual Upload", nullable=False)
    
    # Identifiers
    external_id = Column(String(255), nullable=True, index=True)  # e.g., pay_98yX1, UTR192841
    reference_id = Column(String(255), nullable=True, index=True)  # Order Ref / Merchant Ref
    order_id = Column(String(255), nullable=True, index=True)
    
    # Monetary Values
    amount = Column(Numeric(14, 2), nullable=False)  # Gross Amount
    fee = Column(Numeric(14, 2), default=0.0, nullable=False)
    tax = Column(Numeric(14, 2), default=0.0, nullable=False)
    net_amount = Column(Numeric(14, 2), nullable=False)  # Expected or Actual Net
    currency = Column(String(10), default="INR", nullable=False)
    
    # Timestamps & Status
    transaction_date = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(50), default=TransactionStatus.UNRECONCILED.value, nullable=False, index=True)
    
    # Metadata & Counterparties
    counterparty = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    raw_data = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    batch = relationship("ReconciliationBatch", back_populates="transactions")
    exceptions = relationship("ExceptionRecord", back_populates="transaction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_txn_batch_source", "batch_id", "source_type"),
        Index("idx_txn_ref_amt", "reference_id", "amount"),
    )
