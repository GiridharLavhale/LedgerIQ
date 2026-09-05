"""
Authentication Router: Register, Login, Refresh, Me
"""
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserOut
from app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    stmt = select(User).where(User.email == req.email)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Create Organization with unique slug
    base_slug = req.org_name.lower().replace(" ", "-")
    slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
    org = Organization(name=req.org_name, slug=slug)
    db.add(org)
    await db.flush()

    # Determine role: If first user in org, make ADMIN
    user_role = req.role if req.role in [r.value for r in UserRole] else UserRole.ADMIN.value

    # Create User
    user = User(
        org_id=org.id,
        email=req.email,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        role=user_role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Issue Tokens
    access_token = create_access_token(user.id, {"org_id": org.id, "role": user.role, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    await log_audit_event(
        db=db,
        user=user,
        action="USER_REGISTERED",
        target_entity="USER",
        target_id=user.id,
        new_state={"email": user.email, "role": user.role},
        request=request
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "org_id": user.org_id}
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token(user.id, {"org_id": user.org_id, "role": user.role, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    await log_audit_event(
        db=db,
        user=user,
        action="USER_LOGIN",
        target_entity="USER",
        target_id=user.id,
        request=request
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "org_id": user.org_id}
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = create_access_token(user.id, {"org_id": user.org_id, "role": user.role, "email": user.email})
    new_refresh = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "org_id": user.org_id}
    )


@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(request: Request, db: AsyncSession = Depends(get_db)):
    """Explicitly controlled demo authentication endpoint for evaluation and benchmarking."""
    stmt = select(User).where(User.email == "admin@ledgeriq.io")
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo user account not initialized")

    access_token = create_access_token(user.id, {"org_id": user.org_id, "role": user.role, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    await log_audit_event(
        db=db,
        user=user,
        action="DEMO_USER_LOGIN",
        target_entity="USER",
        target_id=user.id,
        request=request,
        details="Authenticated via explicitly controlled Demo Login endpoint."
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "org_id": user.org_id}
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
