"""
System Settings & AI Provider Config Router
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.setting import SystemSetting
from app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    return {
        "ai_provider": settings.AI_PROVIDER,
        "ai_model_name": settings.AI_MODEL_NAME,
        "default_mdr_fee_rate": settings.DEFAULT_MDR_FEE_RATE,
        "default_gst_tax_rate": settings.DEFAULT_GST_TAX_RATE,
        "default_date_tolerance_days": settings.DEFAULT_DATE_TOLERANCE_DAYS,
        "default_amount_tolerance_inr": settings.DEFAULT_AMOUNT_TOLERANCE_INR,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_groq_key": bool(settings.GROQ_API_KEY),
        "has_openrouter_key": bool(settings.OPENROUTER_API_KEY),
        "ollama_base_url": settings.OLLAMA_BASE_URL
    }


@router.post("/ai-config")
async def update_ai_config(
    payload: Dict[str, Any],
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value]))
):
    if "ai_provider" in payload:
        settings.AI_PROVIDER = payload["ai_provider"]
    if "ai_model_name" in payload:
        settings.AI_MODEL_NAME = payload["ai_model_name"]
    if "gemini_api_key" in payload and payload["gemini_api_key"]:
        settings.GEMINI_API_KEY = payload["gemini_api_key"]
    if "groq_api_key" in payload and payload["groq_api_key"]:
        settings.GROQ_API_KEY = payload["groq_api_key"]
    if "openrouter_api_key" in payload and payload["openrouter_api_key"]:
        settings.OPENROUTER_API_KEY = payload["openrouter_api_key"]

    await log_audit_event(
        db=db,
        user=current_user,
        action="SETTINGS_UPDATED",
        target_entity="SYSTEM_SETTING",
        target_id="AI_CONFIG",
        new_state={"provider": settings.AI_PROVIDER, "model": settings.AI_MODEL_NAME},
        request=request
    )

    return {"success": True, "ai_provider": settings.AI_PROVIDER, "ai_model_name": settings.AI_MODEL_NAME}
