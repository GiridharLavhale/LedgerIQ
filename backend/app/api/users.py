"""
Users Management Router
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserOut])
async def list_users(
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.org_id == current_user.org_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=UserOut)
async def create_user(
    req: UserCreate,
    request: Request,
    current_user: User = Depends(require_role([UserRole.ADMIN.value])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == req.email)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        org_id=current_user.org_id,
        email=req.email,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        is_active=req.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log_audit_event(
        db=db,
        user=current_user,
        action="USER_CREATED",
        target_entity="USER",
        target_id=user.id,
        new_state={"email": user.email, "role": user.role},
        request=request
    )

    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    req: UserUpdate,
    request: Request,
    current_user: User = Depends(require_role([UserRole.ADMIN.value])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id, User.org_id == current_user.org_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    prev_state = {"role": user.role, "is_active": user.is_active, "full_name": user.full_name}

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active

    await db.commit()
    await db.refresh(user)

    await log_audit_event(
        db=db,
        user=current_user,
        action="USER_UPDATED",
        target_entity="USER",
        target_id=user.id,
        previous_state=prev_state,
        new_state={"role": user.role, "is_active": user.is_active, "full_name": user.full_name},
        request=request
    )

    return user
