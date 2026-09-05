"""
AuditLog ORM Model
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Audit Event Metadata
    action = Column(String(100), nullable=False, index=True)  # BATCH_CREATED, MATCH_APPROVED, EXCEPTION_RESOLVED, etc.
    target_entity = Column(String(50), nullable=False, index=True)  # BATCH, TRANSACTION, EXCEPTION, SETTING
    target_id = Column(String(36), nullable=False, index=True)
    
    # State Diffs
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    request_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_target", "target_entity", "target_id"),
        Index("idx_audit_created", "created_at"),
    )
