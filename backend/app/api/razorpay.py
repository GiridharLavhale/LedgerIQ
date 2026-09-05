"""
Razorpay Integration API Router
Exposes status, live synchronization, connection testing, and mock ingestion endpoints.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.batch import BatchDetailOut
from app.api.deps import get_current_user, require_role
from app.integrations.razorpay.client import RazorpayClient
from app.integrations.razorpay.service import RazorpayIngestionService

router = APIRouter(prefix="/integrations/razorpay", tags=["Razorpay Live Integration"])


class RazorpaySyncRequest(BaseModel):
    count: int = Field(default=50, ge=5, le=100, description="Number of payments to fetch from Razorpay API")
    auto_reconcile: bool = Field(default=True, description="Automatically trigger deterministic reconciliation upon ingestion")


@router.get("/status")
async def get_razorpay_status(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Returns configuration status of the Razorpay integration.
    Never exposes secret keys.
    """
    client = RazorpayClient()
    return {
        "configured": client.is_configured,
        "key_id_masked": client.masked_key_id,
        "base_url": client.base_url,
        "mode": "LIVE_OR_TEST_API" if client.is_configured else "DEMO_FALLBACK",
        "instructions": (
            "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to connect your live or test Razorpay account."
            if not client.is_configured else
            "Razorpay API credentials detected and ready for synchronization."
        )
    }


@router.post("/test-connection")
async def test_razorpay_connection(
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value]))
) -> Dict[str, Any]:
    """
    Safely verifies live API connectivity and credentials against Razorpay's API.
    Does not modify or mutate any transactions.
    """
    client = RazorpayClient()
    return await client.test_connection()


@router.post("/sync", response_model=BatchDetailOut)
async def sync_razorpay_data(
    req: RazorpaySyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value, UserRole.FINANCE_ANALYST.value]))
):
    """
    Fetches live/test payments and settlements from Razorpay API, normalizes them,
    persists them in a canonical ReconciliationBatch, and executes deterministic reconciliation.
    """
    client = RazorpayClient()
    if not client.is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in environment."
        )

    try:
        batch = await RazorpayIngestionService.sync_live_data(
            db=db,
            current_user=current_user,
            count=req.count,
            auto_reconcile=req.auto_reconcile
        )
        return batch
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to sync with Razorpay API: {str(e)}")


@router.post("/mock-sync", response_model=BatchDetailOut)
async def mock_sync_razorpay_data(
    req: RazorpaySyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value, UserRole.FINANCE_ANALYST.value]))
):
    """
    Simulates live Razorpay API responses using exact Razorpay schema specifications
    to test the Razorpay ingestion and normalization pipeline offline or without API keys.
    """
    batch = await RazorpayIngestionService.sync_mock_data(
        db=db,
        current_user=current_user,
        count=req.count,
        auto_reconcile=req.auto_reconcile
    )
    return batch
