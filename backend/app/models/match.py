"""
Reconciliation Match ORM Model
"""
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Numeric, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class MatchStrategy(str, enum.Enum):
    EXACT_ID = "EXACT_ID"
    STRICT_COMPOSITE = "STRICT_COMPOSITE"
    FUZZY_PROXIMITY = "FUZZY_PROXIMITY"
    SETTLEMENT_FEE_AWARE = "SETTLEMENT_FEE_AWARE"
    MANUAL_USER_MATCH = "MANUAL_USER_MATCH"


class MatchStatus(str, enum.Enum):
    MATCHED = "MATCHED"
    LIKELY_MATCH = "LIKELY_MATCH"
    PARTIAL_MATCH = "PARTIAL_MATCH"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"


class ReconciliationMatch(Base):
    __tablename__ = "reconciliation_matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("reconciliation_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Matched Pair References
    primary_txn_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    matched_txn_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Match Details
    strategy = Column(String(50), nullable=False)  # MatchStrategy enum value
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    status = Column(String(50), default=MatchStatus.MATCHED.value, nullable=False)
    
    # Mathematical Differences
    amount_difference = Column(Numeric(14, 2), default=0.0, nullable=False)
    date_difference_days = Column(Integer, default=0, nullable=False)
    calculated_fee = Column(Numeric(14, 2), default=0.0, nullable=False)
    calculated_tax = Column(Numeric(14, 2), default=0.0, nullable=False)
    
    # Grounded Proof
    evidence_summary = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    batch = relationship("ReconciliationBatch", back_populates="matches")
    primary_txn = relationship("Transaction", foreign_keys=[primary_txn_id])
    matched_txn = relationship("Transaction", foreign_keys=[matched_txn_id])

    __table_args__ = (
        Index("idx_match_batch_strat", "batch_id", "strategy"),
    )
