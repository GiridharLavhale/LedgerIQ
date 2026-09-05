"""
EvaluationRun and Benchmark ORM Model
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from app.core.database import Base


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_name = Column(String(100), nullable=False)
    record_count = Column(Integer, nullable=False)
    seed = Column(Integer, default=42, nullable=False)
    
    # Ground Truth vs Prediction Matrix
    ground_truth_matches = Column(Integer, nullable=False)
    predicted_matches = Column(Integer, nullable=False)
    correct_matches = Column(Integer, nullable=False)  # True Positives
    false_matches = Column(Integer, nullable=False)    # False Positives
    missed_matches = Column(Integer, nullable=False)   # False Negatives
    
    # Statistical Metrics
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    match_rate = Column(Float, nullable=False)
    exception_rate = Column(Float, nullable=False)
    
    # Performance
    execution_time_ms = Column(Integer, nullable=False)
    throughput_rps = Column(Float, nullable=False)
    
    confusion_matrix = Column(JSON, default=dict, nullable=False)
    breakdown_by_category = Column(JSON, default=dict, nullable=False)
    
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
