"""
Evaluation & Benchmarking API Router
"""
from typing import List
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.models.batch import ReconciliationBatch, BatchStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.evaluation import EvaluationRun
from app.schemas.evaluation import EvaluationRequest, EvaluationRunOut
from app.schemas.batch import BatchDetailOut
from app.services.evaluation_service import EvaluationService
from app.services.dataset_generator import SyntheticDatasetGenerator
from app.services.reconciliation_service import ReconciliationService
from app.api.deps import get_current_user

router = APIRouter(prefix="/evaluations", tags=["Evaluation & Benchmarks"])


@router.post("/run", response_model=EvaluationRunOut)
async def run_benchmark_endpoint(
    req: EvaluationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes a repeatable benchmark on synthetic dataset with ground truth verification."""
    eval_run = await EvaluationService.run_benchmark(req, db, current_user)
    return eval_run


@router.get("/history", response_model=List[EvaluationRunOut])
async def get_evaluation_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(EvaluationRun).order_by(EvaluationRun.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/seed-demo", response_model=BatchDetailOut)
async def seed_demo_batch(
    size: int = 100,
    seed: int = 42,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    One-click demo dataset generation:
    Creates a 100+ record deterministic financial batch with Payments, Settlements, and Bank Statements,
    then automatically runs reconciliation.
    """
    dataset = SyntheticDatasetGenerator.generate_benchmark_dataset(record_count=size, seed=seed)
    records = dataset["all_records"]

    batch = ReconciliationBatch(
        org_id=current_user.org_id,
        name=f"Demo Benchmark Batch ({size} records - Seed {seed})",
        status=BatchStatus.PROCESSING.value,
        created_by=current_user.id,
        notes="Pre-seeded deterministic fintech benchmark dataset for evaluation."
    )
    db.add(batch)
    await db.flush()

    for r in records:
        txn = Transaction(
            org_id=current_user.org_id,
            batch_id=batch.id,
            source_type=r["source_type"],
            source_name=r["source_name"],
            external_id=r.get("external_id"),
            reference_id=r.get("reference_id"),
            order_id=r.get("order_id"),
            amount=Decimal(str(r["amount"])),
            fee=Decimal(str(r.get("fee", 0.0))),
            tax=Decimal(str(r.get("tax", 0.0))),
            net_amount=Decimal(str(r.get("net_amount", r["amount"]))),
            currency=r.get("currency", "INR"),
            transaction_date=datetime.fromisoformat(r["transaction_date"]),
            status=TransactionStatus.UNRECONCILED.value,
            counterparty=r.get("counterparty"),
            description=r.get("description"),
            raw_data=r
        )
        db.add(txn)

    await db.commit()

    # Run Reconciliation
    reconciled_batch = await ReconciliationService.process_batch(
        batch_id=batch.id,
        db=db,
        fee_rate=0.02,
        gst_rate=0.18,
        date_tolerance_days=3,
        amount_tolerance=0.05
    )

    return reconciled_batch
