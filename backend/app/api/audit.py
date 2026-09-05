"""
Audit Trail API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogOut
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("", response_model=List[AuditLogOut])
async def list_audit_logs(
    action: Optional[str] = None,
    target_entity: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(AuditLog).where(AuditLog.org_id == current_user.org_id)
    if action:
        stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
    if target_entity:
        stmt = stmt.where(AuditLog.target_entity == target_entity.upper())

    stmt = stmt.order_by(desc(AuditLog.created_at)).limit(limit).offset(offset)
    res = await db.execute(stmt)
    return res.scalars().all()
