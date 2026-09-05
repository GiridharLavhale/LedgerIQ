"""
Transactions Router: Canonical Ledger, Payments, Settlements, Bank Statements, Invoices
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from app.core.database import get_db
from app.models.transaction import Transaction, SourceType, TransactionStatus
from app.models.user import User
from app.schemas.transaction import TransactionResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions & Financial Views"])


def _serialize_txn(t: Transaction) -> dict:
    return {
        "id": t.id,
        "batch_id": t.batch_id,
        "upload_id": t.upload_id,
        "source_type": t.source_type,
        "source_name": t.source_name,
        "external_id": t.external_id,
        "reference_id": t.reference_id,
        "order_id": t.order_id,
        "amount": float(t.amount),
        "fee": float(t.fee),
        "tax": float(t.tax),
        "net_amount": float(t.net_amount),
        "currency": t.currency,
        "transaction_date": t.transaction_date.isoformat(),
        "status": t.status,
        "counterparty": t.counterparty,
        "description": t.description,
        "raw_data": t.raw_data or {},
        "created_at": t.created_at.isoformat()
    }


async def _query_transactions(
    db: AsyncSession,
    org_id: str,
    source_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    batch_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[dict]:
    stmt = select(Transaction).where(Transaction.org_id == org_id)

    if batch_id:
        stmt = stmt.where(Transaction.batch_id == batch_id)
    if source_type and source_type.upper() != "ALL":
        stmt = stmt.where(Transaction.source_type == source_type.upper())
    if status_filter and status_filter.upper() != "ALL":
        stmt = stmt.where(Transaction.status == status_filter.upper())
    if search:
        q = f"%{search}%"
        stmt = stmt.where(
            or_(
                Transaction.external_id.ilike(q),
                Transaction.reference_id.ilike(q),
                Transaction.order_id.ilike(q),
                Transaction.counterparty.ilike(q)
            )
        )

    stmt = stmt.order_by(desc(Transaction.transaction_date)).limit(int(limit)).offset(int(offset))
    res = await db.execute(stmt)
    txns = res.scalars().all()
    return [_serialize_txn(t) for t in txns]


@router.get("", response_model=List[TransactionResponse])
async def list_canonical_transactions(
    source_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    batch_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await _query_transactions(
        db=db,
        org_id=current_user.org_id,
        source_type=source_type,
        status_filter=status_filter,
        batch_id=batch_id,
        search=search,
        limit=limit,
        offset=offset
    )


@router.get("/payments", response_model=List[TransactionResponse])
async def list_payments(
    status_filter: Optional[str] = None,
    batch_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await _query_transactions(
        db=db,
        org_id=current_user.org_id,
        source_type="PAYMENT",
        status_filter=status_filter,
        batch_id=batch_id,
        limit=limit,
        offset=offset
    )


@router.get("/settlements", response_model=List[TransactionResponse])
async def list_settlements(
    status_filter: Optional[str] = None,
    batch_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await _query_transactions(
        db=db,
        org_id=current_user.org_id,
        source_type="SETTLEMENT",
        status_filter=status_filter,
        batch_id=batch_id,
        limit=limit,
        offset=offset
    )


@router.get("/bank-statements", response_model=List[TransactionResponse])
async def list_bank_statements(
    status_filter: Optional[str] = None,
    batch_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await _query_transactions(
        db=db,
        org_id=current_user.org_id,
        source_type="BANK_STATEMENT",
        status_filter=status_filter,
        batch_id=batch_id,
        limit=limit,
        offset=offset
    )


@router.get("/invoices", response_model=List[TransactionResponse])
async def list_invoices(
    status_filter: Optional[str] = None,
    batch_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await _query_transactions(
        db=db,
        org_id=current_user.org_id,
        source_type="INVOICE",
        status_filter=status_filter,
        batch_id=batch_id,
        limit=limit,
        offset=offset
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_details(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Transaction).where(Transaction.id == transaction_id, Transaction.org_id == current_user.org_id)
    res = await db.execute(stmt)
    txn = res.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return _serialize_txn(txn)
