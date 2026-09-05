"""
FastAPI Dependencies: DB Session, Auth, Current User, RBAC and Audit Logger
"""
from typing import AsyncGenerator, List, Optional, Any, Dict
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.audit import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=True)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and validate the authenticated user from the Bearer JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")

    return user


def require_role(allowed_roles: List[str]):
    """Enforce RBAC role checking."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.ADMIN.value:
            return current_user  # Admin has omni-access
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role}'. Required: {allowed_roles}"
            )
        return current_user
    return role_checker


async def log_audit_event(
    db: AsyncSession,
    user: Optional[User],
    action: str,
    target_entity: str,
    target_id: str,
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    details: Optional[str] = None
) -> AuditLog:
    """Helper to record immutable audit log entries."""
    ip_addr = request.client.host if request and request.client else "127.0.0.1"
    req_id = getattr(request.state, "request_id", None) if request and hasattr(request, "state") else None
    
    audit_entry = AuditLog(
        user_id=user.id if user else None,
        org_id=user.org_id if user else None,
        action=action,
        target_entity=target_entity,
        target_id=target_id,
        previous_state=previous_state,
        new_state=new_state,
        ip_address=ip_addr,
        request_id=req_id,
        details=details
    )
    db.add(audit_entry)
    await db.commit()
    return audit_entry
