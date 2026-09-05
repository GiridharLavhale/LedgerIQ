"""
Evaluation and Benchmarking Pydantic Schemas
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class EvaluationRequest(BaseModel):
    size: int = Field(100, ge=10, le=5000, description="Dataset size: 50, 100, 500, 1000")
    seed: int = Field(42, description="Random seed for reproducible results")
    noise_level: float = Field(0.15, ge=0.0, le=0.5, description="Proportion of simulated edge cases")


class EvaluationRunOut(BaseModel):
    id: str
    dataset_name: str
    record_count: int
    seed: int
    ground_truth_matches: int
    predicted_matches: int
    correct_matches: int
    false_matches: int
    missed_matches: int
    precision: float
    recall: float
    f1_score: float
    match_rate: float
    exception_rate: float
    execution_time_ms: int
    throughput_rps: float
    confusion_matrix: Dict[str, Any]
    breakdown_by_category: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
