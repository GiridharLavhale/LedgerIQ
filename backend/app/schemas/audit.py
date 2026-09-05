"""
Audit Log Pydantic Schemas
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    target_entity: str
    target_id: str
    previous_state: Optional[Dict[str, Any]]
    new_state: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    request_id: Optional[str]
    details: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
