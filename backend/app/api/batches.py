"""
Reconciliation Batches API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.batch import ReconciliationBatch, BatchStatus, Upload
from app.models.transaction import Transaction
from app.models.match import ReconciliationMatch
from app.schemas.batch import BatchCreate, BatchSummaryOut, BatchDetailOut, BatchProgress
from app.schemas.transaction import TransactionOut
from app.schemas.match import MatchOut
from app.services.reconciliation_service import ReconciliationService
from app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/batches", tags=["Reconciliation Batches"])


async def run_batch_background(batch_id: str, fee_rate: float, gst_rate: float, date_tolerance: int, amount_tolerance: float):
    """Background task runner with dedicated session."""
    async with AsyncSessionLocal() as session:
        try:
            await ReconciliationService.process_batch(
                batch_id=batch_id,
                db=session,
                fee_rate=fee_rate,
                gst_rate=gst_rate,
                date_tolerance_days=date_tolerance,
                amount_tolerance=amount_tolerance
            )
        except Exception as e:
            stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == batch_id)
            res = await session.execute(stmt)
            batch = res.scalars().first()
            if batch:
                batch.status = BatchStatus.FAILED.value
                batch.notes = f"Failed with error: {str(e)}"
                await session.commit()


@router.post("", response_model=BatchDetailOut)
async def create_batch(
    req: BatchCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value, UserRole.FINANCE_ANALYST.value]))
):
    batch = ReconciliationBatch(
        org_id=current_user.org_id,
        name=req.name,
        status=BatchStatus.PROCESSING.value,
        notes=req.notes,
        created_by=current_user.id,
        metadata_json={
            "upload_ids": req.upload_ids,
            "options": req.options.dict() if req.options else {}
        }
    )
    db.add(batch)
    await db.flush()

    # Associate uploads with batch
    if req.upload_ids:
        await db.execute(
            update(Upload)
            .where(Upload.id.in_(req.upload_ids))
            .values(batch_id=batch.id)
        )
    await db.commit()
    await db.refresh(batch)

    # Trigger Reconciliation
    opts = req.options
    fee_r = opts.fee_rate if opts else 0.02
    gst_r = opts.gst_rate if opts else 0.18
    date_tol = opts.date_tolerance_days if opts else 3
    amt_tol = opts.amount_tolerance if opts else 0.05

    # Process immediately synchronously for quick responsiveness
    await ReconciliationService.process_batch(
        batch_id=batch.id,
        db=db,
        fee_rate=fee_r,
        gst_rate=gst_r,
        date_tolerance_days=date_tol,
        amount_tolerance=amt_tol
    )
    await db.refresh(batch)

    await log_audit_event(
        db=db,
        user=current_user,
        action="BATCH_CREATED_AND_RECONCILED",
        target_entity="BATCH",
        target_id=batch.id,
        new_state={"batch_id": batch.id, "records": batch.total_records, "match_rate": batch.match_rate},
        request=request
    )

    return batch


@router.get("", response_model=List[BatchSummaryOut])
async def list_batches(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ReconciliationBatch).where(
        ReconciliationBatch.org_id == current_user.org_id
    ).order_by(ReconciliationBatch.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{batch_id}", response_model=BatchDetailOut)
async def get_batch_detail(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == batch_id)
    res = await db.execute(stmt)
    batch = res.scalars().first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return batch


@router.get("/{batch_id}/progress", response_model=BatchProgress)
async def get_batch_progress(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == batch_id)
    res = await db.execute(stmt)
    batch = res.scalars().first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    percent = 100.0 if batch.status == BatchStatus.COMPLETED.value else (
        round((batch.processed_count / max(1, batch.total_records)) * 100.0, 1)
    )

    return BatchProgress(
        batch_id=batch.id,
        status=batch.status,
        processed_count=batch.processed_count,
        total_records=batch.total_records,
        percent=percent,
        matched_records=batch.matched_records,
        exception_records=batch.exception_records,
        match_rate=batch.match_rate
    )


@router.get("/{batch_id}/transactions", response_model=List[TransactionOut])
async def get_batch_transactions(
    batch_id: str,
    source_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Transaction).where(Transaction.batch_id == batch_id)
    if source_type:
        stmt = stmt.where(Transaction.source_type == source_type.upper())
    if status_filter:
        stmt = stmt.where(Transaction.status == status_filter.upper())

    stmt = stmt.order_by(Transaction.transaction_date.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{batch_id}/matches", response_model=List[MatchOut])
async def get_batch_matches(
    batch_id: str,
    strategy: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ReconciliationMatch).options(
        selectinload(ReconciliationMatch.primary_txn),
        selectinload(ReconciliationMatch.matched_txn)
    ).where(ReconciliationMatch.batch_id == batch_id)

    if strategy:
        stmt = stmt.where(ReconciliationMatch.strategy == strategy.upper())

    stmt = stmt.order_by(ReconciliationMatch.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    return res.scalars().all()
