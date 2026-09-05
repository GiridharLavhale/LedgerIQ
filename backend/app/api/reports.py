"""
Reports API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.models.batch import ReconciliationBatch
from app.models.transaction import Transaction
from app.models.match import ReconciliationMatch
from app.models.exception import ExceptionRecord
from app.services.report_service import ReportService
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/reconciliation/{batch_id}")
async def export_reconciliation_report(
    batch_id: str,
    format: str = Query("CSV", pattern="^(CSV|XLSX|PDF|JSON)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == batch_id)
    res = await db.execute(stmt)
    batch = res.scalars().first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    txn_stmt = select(Transaction).where(Transaction.batch_id == batch_id)
    txns = (await db.execute(txn_stmt)).scalars().all()

    match_stmt = select(ReconciliationMatch).where(ReconciliationMatch.batch_id == batch_id)
    matches = (await db.execute(match_stmt)).scalars().all()

    exc_stmt = select(ExceptionRecord).where(ExceptionRecord.batch_id == batch_id)
    exceptions = (await db.execute(exc_stmt)).scalars().all()

    fmt = format.upper()
    if fmt == "CSV":
        content = ReportService.generate_reconciliation_csv(batch, matches, txns)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=reconciliation_{batch_id[:8]}.csv"}
        )
    elif fmt == "XLSX":
        content = ReportService.generate_reconciliation_xlsx(batch, matches, exceptions)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=reconciliation_{batch_id[:8]}.xlsx"}
        )
    elif fmt == "PDF":
        content = ReportService.generate_pdf_report(batch, exceptions)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=reconciliation_{batch_id[:8]}.pdf"}
        )
    else:
        return {
            "batch_id": batch.id,
            "name": batch.name,
            "total_records": batch.total_records,
            "matched_records": batch.matched_records,
            "match_rate": batch.match_rate,
            "discrepancy_amount": float(batch.discrepancy_amount)
        }
