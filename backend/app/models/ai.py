"""
AI Decision and Agent Run Tracking ORM Models
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class AiDecision(Base):
    __tablename__ = "ai_decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(36), ForeignKey("reconciliation_batches.id", ondelete="CASCADE"), nullable=True, index=True)
    exception_id = Column(String(36), ForeignKey("exceptions.id", ondelete="CASCADE"), nullable=True, index=True)
    agent_name = Column(String(100), nullable=False)  # ExceptionAgent, CopilotAgent, etc.
    provider = Column(String(50), nullable=False)  # gemini, groq, etc.
    model_name = Column(String(100), nullable=False)
    
    prompt_tokens = Column(Integer, default=0, nullable=False)
    completion_tokens = Column(Integer, default=0, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    
    # Grounded AI Content
    reasoning_summary = Column(Text, nullable=False)
    evidence = Column(JSON, default=list, nullable=False)
    confidence = Column(Float, nullable=False)
    recommended_action = Column(String(100), nullable=False)
    tool_calls_json = Column(JSON, default=list, nullable=False)
    raw_response = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_name = Column(String(100), nullable=False)
    session_id = Column(String(100), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_query = Column(Text, nullable=False)
    final_response = Column(Text, nullable=False)
    tool_invocations = Column(JSON, default=list, nullable=False)
    citations = Column(JSON, default=list, nullable=False)
    execution_time_ms = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
