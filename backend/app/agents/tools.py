"""
Controlled Read-Only Financial Tools for AI Agents
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.batch import ReconciliationBatch
from app.models.transaction import Transaction, SourceType, TransactionStatus
from app.models.exception import ExceptionRecord, ExceptionStatus
from app.models.match import ReconciliationMatch
from app.reconciliation.verifier import verify_settlement_decomposition, calculate_fee_and_tax, round_curr


async def get_reconciliation_summary(db: AsyncSession, batch_id: str) -> Dict[str, Any]:
    """Returns macro batch volume, match counts, match rate, and discrepancy totals."""
    stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == batch_id)
    res = await db.execute(stmt)
    batch = res.scalars().first()
    if not batch:
        return {"error": f"Batch '{batch_id}' not found."}
        
    return {
        "batch_id": batch.id,
        "name": batch.name,
        "status": batch.status,
        "total_records": batch.total_records,
        "matched_records": batch.matched_records,
        "unmatched_records": batch.unmatched_records,
        "exception_records": batch.exception_records,
        "resolved_exceptions": batch.resolved_exceptions,
        "match_rate_pct": batch.match_rate,
        "exception_rate_pct": batch.exception_rate,
        "total_volume_inr": float(batch.total_volume),
        "matched_volume_inr": float(batch.matched_volume),
        "discrepancy_amount_inr": float(batch.discrepancy_amount),
        "processing_time_ms": batch.processing_time_ms,
        "throughput_rps": batch.throughput_rps
    }


async def get_transaction(db: AsyncSession, transaction_id: str) -> Dict[str, Any]:
    """Returns complete details of a specific canonical transaction."""
    stmt = select(Transaction).where(
        or_(
            Transaction.id == transaction_id,
            Transaction.external_id == transaction_id,
            Transaction.reference_id == transaction_id
        )
    )
    res = await db.execute(stmt)
    txn = res.scalars().first()
    if not txn:
        return {"error": f"Transaction '{transaction_id}' not found in database."}

    return {
        "id": txn.id,
        "batch_id": txn.batch_id,
        "source_type": txn.source_type,
        "source_name": txn.source_name,
        "external_id": txn.external_id,
        "reference_id": txn.reference_id,
        "order_id": txn.order_id,
        "amount_inr": float(txn.amount),
        "fee_inr": float(txn.fee),
        "tax_inr": float(txn.tax),
        "net_amount_inr": float(txn.net_amount),
        "currency": txn.currency,
        "transaction_date": txn.transaction_date.isoformat(),
        "status": txn.status,
        "counterparty": txn.counterparty
    }


async def search_transactions(
    db: AsyncSession,
    query: str,
    batch_id: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Searches transactions by external reference, order ID, counterparty, or amount."""
    stmt = select(Transaction)
    if batch_id:
        stmt = stmt.where(Transaction.batch_id == batch_id)

    q = f"%{query}%"
    stmt = stmt.where(
        or_(
            Transaction.external_id.ilike(q),
            Transaction.reference_id.ilike(q),
            Transaction.order_id.ilike(q),
            Transaction.counterparty.ilike(q)
        )
    ).limit(limit)

    res = await db.execute(stmt)
    txns = res.scalars().all()
    return [
        {
            "id": t.id,
            "source_type": t.source_type,
            "reference_id": t.reference_id,
            "amount_inr": float(t.amount),
            "status": t.status,
            "date": t.transaction_date.isoformat()
        }
        for t in txns
    ]


async def get_exception(db: AsyncSession, exception_id: str) -> Dict[str, Any]:
    """Fetches details of an exception, including expected vs actual amounts and differences."""
    stmt = select(ExceptionRecord).where(
        or_(
            ExceptionRecord.id == exception_id,
            ExceptionRecord.transaction_id == exception_id
        )
    )
    res = await db.execute(stmt)
    exc = res.scalars().first()
    if not exc:
        return {"error": f"Exception '{exception_id}' not found."}

    return {
        "id": exc.id,
        "batch_id": exc.batch_id,
        "transaction_id": exc.transaction_id,
        "exception_type": exc.exception_type,
        "severity": exc.severity,
        "status": exc.status,
        "expected_amount_inr": float(exc.expected_amount),
        "actual_amount_inr": float(exc.actual_amount),
        "difference_amount_inr": float(exc.difference_amount),
        "evidence": exc.evidence_json,
        "ai_explanation": exc.ai_explanation,
        "ai_recommended_action": exc.ai_recommended_action
    }


async def search_exceptions(
    db: AsyncSession,
    batch_id: Optional[str] = None,
    status_filter: str = "OPEN",
    severity: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Retrieves exceptions filtered by batch, status, or severity."""
    stmt = select(ExceptionRecord)
    if batch_id:
        stmt = stmt.where(ExceptionRecord.batch_id == batch_id)
    if status_filter:
        stmt = stmt.where(ExceptionRecord.status == status_filter.upper())
    if severity:
        stmt = stmt.where(ExceptionRecord.severity == severity.upper())

    stmt = stmt.order_by(ExceptionRecord.difference_amount.desc()).limit(limit)
    res = await db.execute(stmt)
    excs = res.scalars().all()

    return [
        {
            "id": e.id,
            "exception_type": e.exception_type,
            "severity": e.severity,
            "difference_inr": float(e.difference_amount),
            "status": e.status,
            "ai_explanation": e.ai_explanation
        }
        for e in excs
    ]


async def get_settlement(db: AsyncSession, reference_id: str, batch_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves settlement records associated with a specific reference."""
    stmt = select(Transaction).where(
        Transaction.source_type.in_([SourceType.SETTLEMENT.value, SourceType.BANK_STATEMENT.value]),
        or_(
            Transaction.reference_id == reference_id,
            Transaction.external_id == reference_id
        )
    )
    if batch_id:
        stmt = stmt.where(Transaction.batch_id == batch_id)

    res = await db.execute(stmt)
    settlements = res.scalars().all()
    if not settlements:
        return {"found": False, "message": f"No settlement found for reference '{reference_id}'"}

    return {
        "found": True,
        "records": [
            {
                "id": s.id,
                "amount_inr": float(s.amount),
                "fee_inr": float(s.fee),
                "tax_inr": float(s.tax),
                "net_amount_inr": float(s.net_amount),
                "date": s.transaction_date.isoformat(),
                "status": s.status
            }
            for s in settlements
        ]
    }


def calculate_discrepancy(
    gross_amount: float,
    net_amount: float,
    fee_rate: float = 0.02,
    gst_rate: float = 0.18
) -> Dict[str, Any]:
    """Performs deterministic verification of expected net payout against actual settlement."""
    is_valid, exp_fee, exp_tax, exp_net, diff = verify_settlement_decomposition(
        gross_amount=gross_amount,
        actual_net=net_amount,
        fee_rate=fee_rate,
        gst_rate=gst_rate
    )
    return {
        "gross_amount_inr": gross_amount,
        "actual_net_inr": net_amount,
        "expected_fee_inr": exp_fee,
        "expected_tax_inr": exp_tax,
        "expected_net_inr": exp_net,
        "difference_inr": diff,
        "is_mathematically_reconciled": is_valid
    }


async def get_batch_metrics(db: AsyncSession, org_id: str) -> Dict[str, Any]:
    """Returns platform-wide metrics including total volume, match rate, and active discrepancies."""
    stmt = select(
        func.count(ReconciliationBatch.id),
        func.sum(ReconciliationBatch.total_records),
        func.sum(ReconciliationBatch.matched_records),
        func.sum(ReconciliationBatch.exception_records),
        func.sum(ReconciliationBatch.total_volume),
        func.sum(ReconciliationBatch.discrepancy_amount)
    ).where(ReconciliationBatch.org_id == org_id)

    res = await db.execute(stmt)
    row = res.first()

    batches_count = row[0] or 0
    total_records = row[1] or 0
    matched_records = row[2] or 0
    exception_records = row[3] or 0
    total_vol = float(row[4] or 0.0)
    discrepancy_vol = float(row[5] or 0.0)

    match_rate = round((matched_records / max(1, total_records)) * 100.0, 2)
    exception_rate = round((exception_records / max(1, total_records)) * 100.0, 2)

    return {
        "batches_count": batches_count,
        "total_transactions": total_records,
        "matched_transactions": matched_records,
        "exception_transactions": exception_records,
        "unreconciled_transactions": total_records - matched_records,
        "platform_match_rate_pct": match_rate,
        "platform_exception_rate_pct": exception_rate,
        "total_volume_inr": total_vol,
        "unreconciled_discrepancy_inr": discrepancy_vol
    }


async def get_financial_summary(db: AsyncSession, org_id: str) -> Dict[str, Any]:
    """Returns executive financial summary of all unreconciled balances and open liabilities."""
    metrics = await get_batch_metrics(db, org_id)
    top_excs = await search_exceptions(db, limit=5)
    return {
        "metrics": metrics,
        "largest_discrepancies": top_excs
    }
