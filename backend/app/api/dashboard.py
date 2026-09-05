"""
Dashboard Analytics API Router (FinOps Operations Metrics)
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.user import User
from app.models.batch import ReconciliationBatch
from app.models.transaction import Transaction, SourceType
from app.models.exception import ExceptionRecord, ExceptionType
from app.api.deps import get_current_user
from app.agents.tools import get_batch_metrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Returns top KPI metrics and chart datasets for the operations dashboard."""
    metrics = await get_batch_metrics(db, current_user.org_id)

    # 1. Reconciliation Trend (Recent batches)
    batch_stmt = select(ReconciliationBatch).where(
        ReconciliationBatch.org_id == current_user.org_id
    ).order_by(desc(ReconciliationBatch.created_at)).limit(7)
    recent_batches = (await db.execute(batch_stmt)).scalars().all()

    trend = [
        {
            "batch_name": b.name[:18],
            "total_records": b.total_records,
            "matched_records": b.matched_records,
            "match_rate": b.match_rate,
            "volume_inr": float(b.total_volume),
            "discrepancy_inr": float(b.discrepancy_amount),
            "date": b.created_at.strftime("%b %d")
        }
        for b in reversed(recent_batches)
    ]

    # 2. Exception Categories Breakdown
    exc_stmt = select(
        ExceptionRecord.exception_type,
        func.count(ExceptionRecord.id),
        func.sum(ExceptionRecord.difference_amount)
    ).group_by(ExceptionRecord.exception_type)
    exc_rows = (await db.execute(exc_stmt)).all()

    exception_categories = [
        {
            "category": row[0],
            "count": row[1],
            "amount_inr": float(row[2] or 0.0)
        }
        for row in exc_rows
    ]

    # 3. Source Distribution
    src_stmt = select(
        Transaction.source_type,
        func.count(Transaction.id),
        func.sum(Transaction.amount)
    ).group_by(Transaction.source_type)
    src_rows = (await db.execute(src_stmt)).all()

    source_breakdown = [
        {
            "source": row[0],
            "count": row[1],
            "volume_inr": float(row[2] or 0.0)
        }
        for row in src_rows
    ]

    return {
        "kpis": metrics,
        "trend": trend,
        "exception_categories": exception_categories,
        "source_breakdown": source_breakdown
    }
