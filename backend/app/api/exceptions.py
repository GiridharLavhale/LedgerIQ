"""
Exceptions and Resolution Workbench API Router
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.exception import ExceptionRecord, ExceptionAction, ExceptionStatus, ActionType
from app.models.transaction import Transaction, TransactionStatus
from app.models.match import ReconciliationMatch, MatchStrategy, MatchStatus
from app.models.batch import ReconciliationBatch
from app.schemas.exception import ExceptionOut, ExceptionDetailOut, ExceptionActionRequest
from app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/exceptions", tags=["Exceptions & Resolution"])


@router.get("", response_model=List[ExceptionOut])
async def list_exceptions(
    batch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    exception_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ExceptionRecord).options(selectinload(ExceptionRecord.transaction))
    if batch_id:
        stmt = stmt.where(ExceptionRecord.batch_id == batch_id)
    if status_filter:
        stmt = stmt.where(ExceptionRecord.status == status_filter.upper())
    if severity:
        stmt = stmt.where(ExceptionRecord.severity == severity.upper())
    if exception_type:
        stmt = stmt.where(ExceptionRecord.exception_type == exception_type.upper())

    stmt = stmt.order_by(ExceptionRecord.created_at.desc()).limit(limit).offset(offset)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{exception_id}", response_model=ExceptionDetailOut)
async def get_exception_detail(
    exception_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ExceptionRecord).options(
        selectinload(ExceptionRecord.transaction),
        selectinload(ExceptionRecord.actions)
    ).where(ExceptionRecord.id == exception_id)
    res = await db.execute(stmt)
    exc = res.scalars().first()
    if not exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exception not found")

    # Build 4-Pane Comparative Ledger data
    primary_txn = exc.transaction
    comparative_ledger = {
        "payment": None,
        "settlement": None,
        "bank_statement": None,
        "invoice": None
    }

    if primary_txn:
        st = primary_txn.source_type.lower()
        if st in comparative_ledger:
            comparative_ledger[st] = {
                "id": primary_txn.id,
                "amount": float(primary_txn.amount),
                "fee": float(primary_txn.fee),
                "tax": float(primary_txn.tax),
                "net_amount": float(primary_txn.net_amount),
                "reference_id": primary_txn.reference_id,
                "external_id": primary_txn.external_id,
                "date": primary_txn.transaction_date.isoformat(),
                "status": primary_txn.status,
                "source_name": primary_txn.source_name
            }

        # Check for candidate counterpart in same batch
        cand_id = exc.evidence_json.get("candidate_id") if exc.evidence_json else None
        if cand_id:
            cand_stmt = select(Transaction).where(Transaction.id == cand_id)
            cand_res = await db.execute(cand_stmt)
            cand_txn = cand_res.scalars().first()
            if cand_txn:
                cand_st = cand_txn.source_type.lower()
                comparative_ledger[cand_st] = {
                    "id": cand_txn.id,
                    "amount": float(cand_txn.amount),
                    "fee": float(cand_txn.fee),
                    "tax": float(cand_txn.tax),
                    "net_amount": float(cand_txn.net_amount),
                    "reference_id": cand_txn.reference_id,
                    "external_id": cand_txn.external_id,
                    "date": cand_txn.transaction_date.isoformat(),
                    "status": cand_txn.status,
                    "source_name": cand_txn.source_name
                }

    return ExceptionDetailOut(
        id=exc.id,
        batch_id=exc.batch_id,
        transaction_id=exc.transaction_id,
        exception_type=exc.exception_type,
        severity=exc.severity,
        status=exc.status,
        expected_amount=float(exc.expected_amount),
        actual_amount=float(exc.actual_amount),
        difference_amount=float(exc.difference_amount),
        evidence_json=exc.evidence_json or {},
        ai_explanation=exc.ai_explanation,
        ai_confidence=exc.ai_confidence,
        ai_recommended_action=exc.ai_recommended_action,
        ai_evidence=exc.ai_evidence or [],
        assigned_to=exc.assigned_to,
        created_at=exc.created_at,
        updated_at=exc.updated_at,
        resolved_at=exc.resolved_at,
        transaction=primary_txn,
        actions=exc.actions,
        comparative_ledger=comparative_ledger
    )


@router.post("/{exception_id}/actions", response_model=ExceptionDetailOut)
async def perform_exception_action(
    exception_id: str,
    req: ExceptionActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value, UserRole.FINANCE_ANALYST.value]))
):
    stmt = select(ExceptionRecord).options(
        selectinload(ExceptionRecord.transaction),
        selectinload(ExceptionRecord.actions)
    ).where(ExceptionRecord.id == exception_id)
    res = await db.execute(stmt)
    exc = res.scalars().first()
    if not exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exception not found")

    prev_status = exc.status
    new_status = exc.status

    act_type = req.action_type.upper()

    if act_type == ActionType.APPROVE_MATCH.value:
        new_status = ExceptionStatus.RESOLVED.value
        exc.status = new_status
        exc.resolved_at = datetime.now(timezone.utc)
        exc.resolved_by = current_user.id
        exc.resolution_notes = req.notes or "Match approved by finance operator"

        # Update underlying transaction status
        if exc.transaction:
            exc.transaction.status = TransactionStatus.MANUAL_RESOLVED.value

        # If counterpart supplied, create manual match record
        matched_id = req.matched_transaction_id or (exc.evidence_json.get("candidate_id") if exc.evidence_json else None)
        if matched_id:
            manual_match = ReconciliationMatch(
                batch_id=exc.batch_id,
                primary_txn_id=exc.transaction_id,
                matched_txn_id=matched_id,
                strategy=MatchStrategy.MANUAL_USER_MATCH.value,
                confidence=1.0,
                status=MatchStatus.MANUAL_OVERRIDE.value,
                amount_difference=float(exc.difference_amount),
                date_difference_days=0,
                evidence_summary=f"Approved manually by {current_user.full_name}. Notes: {req.notes or 'None'}"
            )
            db.add(manual_match)

    elif act_type == ActionType.REJECT_MATCH.value:
        new_status = ExceptionStatus.REJECTED_MATCH.value
        exc.status = new_status
        exc.resolution_notes = req.notes or "Match rejected by finance operator"

    elif act_type == ActionType.RESOLVE.value:
        new_status = ExceptionStatus.RESOLVED.value
        exc.status = new_status
        exc.resolved_at = datetime.now(timezone.utc)
        exc.resolved_by = current_user.id
        exc.resolution_notes = req.notes or "Marked as resolved"
        if exc.transaction:
            exc.transaction.status = TransactionStatus.MANUAL_RESOLVED.value

    elif act_type == ActionType.ASSIGN.value:
        if req.target_user_id:
            exc.assigned_to = req.target_user_id
            new_status = ExceptionStatus.UNDER_INVESTIGATION.value
            exc.status = new_status

    # Record action
    action_record = ExceptionAction(
        exception_id=exc.id,
        user_id=current_user.id,
        action_type=act_type,
        previous_status=prev_status,
        new_status=new_status,
        notes=req.notes,
        payload_json={"target_user_id": req.target_user_id, "matched_transaction_id": req.matched_transaction_id}
    )
    db.add(action_record)

    # Update batch resolution counts if resolved
    if new_status == ExceptionStatus.RESOLVED.value and prev_status != ExceptionStatus.RESOLVED.value:
        batch_stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == exc.batch_id)
        batch_res = await db.execute(batch_stmt)
        batch = batch_res.scalars().first()
        if batch:
            batch.resolved_exceptions = (batch.resolved_exceptions or 0) + 1
            if batch.exception_records > 0:
                batch.resolution_rate = round((batch.resolved_exceptions / batch.exception_records) * 100.0, 2)

    await db.commit()
    await db.refresh(exc)

    await log_audit_event(
        db=db,
        user=current_user,
        action=f"EXCEPTION_{act_type}",
        target_entity="EXCEPTION",
        target_id=exc.id,
        previous_state={"status": prev_status},
        new_state={"status": new_status, "action": act_type},
        details=req.notes,
        request=request
    )

    return await get_exception_detail(exception_id, db, current_user)
