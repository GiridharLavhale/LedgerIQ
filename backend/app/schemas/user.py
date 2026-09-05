"""
User Pydantic Schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "FINANCE_ANALYST"
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    org_id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: str
    org_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
