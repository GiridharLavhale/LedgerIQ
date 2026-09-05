"""
Reconciliation Batch Processing Service
"""
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.logging import logger
from app.models.batch import ReconciliationBatch, BatchStatus, Upload
from app.models.transaction import Transaction, TransactionStatus
from app.models.match import ReconciliationMatch, MatchStatus
from app.models.exception import ExceptionRecord
from app.reconciliation.normalizer import FinancialDataNormalizer
from app.reconciliation.matcher import ReconciliationEngine
from app.reconciliation.exception_engine import ExceptionEngine


class ReconciliationService:

    @classmethod
    async def process_batch(
        cls,
        batch_id: str,
        db: AsyncSession,
        fee_rate: float = 0.02,
        gst_rate: float = 0.18,
        date_tolerance_days: int = 3,
        amount_tolerance: float = 0.05
    ) -> ReconciliationBatch:
        """
        Executes end-to-end reconciliation for a batch:
        1. Ingests raw uploads and maps to canonical transactions
        2. Executes 4-tier waterfall matching engine
        3. Executes 10-category exception engine
        4. Calculates quantitative and monetary metrics
        5. Persists matches, exceptions, and audit logs
        """
        start_time = time.time()
        logger.info(f"Starting reconciliation for batch {batch_id}")

        stmt = select(ReconciliationBatch).where(ReconciliationBatch.id == batch_id)
        res = await db.execute(stmt)
        batch = res.scalars().first()
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")

        batch.status = BatchStatus.PROCESSING.value
        await db.commit()

        # Step 1: Fetch all transactions associated with this batch
        txn_stmt = select(Transaction).where(Transaction.batch_id == batch_id)
        txn_res = await db.execute(txn_stmt)
        db_txns = txn_res.scalars().all()

        # If transactions are not yet created from uploads, create them
        if not db_txns:
            upload_stmt = select(Upload).where(Upload.batch_id == batch_id)
            upload_res = await db.execute(upload_stmt)
            uploads = upload_res.scalars().all()

            for up in uploads:
                if up.raw_file_path:
                    with open(up.raw_file_path, "rb") as f:
                        content = f.read()
                    df = FinancialDataNormalizer.parse_file_content(content, up.filename)
                    records, _, _ = FinancialDataNormalizer.normalize_records(
                        df=df,
                        source_type=up.source_type,
                        source_name=up.filename,
                        custom_mapping=up.mapping_applied
                    )
                    for rec in records:
                        txn_obj = Transaction(
                            org_id=batch.org_id,
                            batch_id=batch.id,
                            upload_id=up.id,
                            source_type=rec["source_type"],
                            source_name=rec["source_name"],
                            external_id=rec["external_id"],
                            reference_id=rec["reference_id"],
                            order_id=rec["order_id"],
                            amount=Decimal(str(rec["amount"])),
                            fee=Decimal(str(rec["fee"])),
                            tax=Decimal(str(rec["tax"])),
                            net_amount=Decimal(str(rec["net_amount"])),
                            currency=rec["currency"],
                            transaction_date=rec["transaction_date"],
                            status=TransactionStatus.UNRECONCILED.value,
                            counterparty=rec["counterparty"],
                            description=rec["description"],
                            raw_data=rec["raw_data"]
                        )
                        db.add(txn_obj)
            await db.commit()

            # Refresh loaded transactions
            txn_res = await db.execute(txn_stmt)
            db_txns = txn_res.scalars().all()

        total_records = len(db_txns)
        if total_records == 0:
            batch.status = BatchStatus.COMPLETED.value
            batch.completed_at = datetime.now(timezone.utc)
            await db.commit()
            return batch

        # Convert ORM transactions into dictionary payloads for pure algorithmic matcher
        txns_payload = [
            {
                "id": t.id,
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
                "transaction_date": t.transaction_date,
                "counterparty": t.counterparty,
                "raw_data": t.raw_data
            }
            for t in db_txns
        ]

        # Step 2: Run 4-Tier Matching Engine
        engine = ReconciliationEngine(
            fee_rate=fee_rate,
            gst_rate=gst_rate,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance=amount_tolerance
        )
        matches, matched_ids, unresolved_txns = engine.execute_reconciliation(txns_payload)

        # Persist Matches
        matched_volume = 0.0
        total_fees = 0.0
        total_taxes = 0.0

        for m in matches:
            match_orm = ReconciliationMatch(
                batch_id=batch.id,
                primary_txn_id=m.primary_txn_id,
                matched_txn_id=m.matched_txn_id,
                strategy=m.strategy.value,
                confidence=m.confidence,
                status=m.status.value,
                amount_difference=Decimal(str(m.amount_difference)),
                date_difference_days=m.date_difference_days,
                calculated_fee=Decimal(str(m.calculated_fee)),
                calculated_tax=Decimal(str(m.calculated_tax)),
                evidence_summary=m.evidence_summary
            )
            db.add(match_orm)
            total_fees += m.calculated_fee
            total_taxes += m.calculated_tax

        # Update matched transactions status
        txn_map = {t.id: t for t in db_txns}
        for m in matches:
            if m.primary_txn_id in txn_map:
                txn_map[m.primary_txn_id].status = TransactionStatus.MATCHED.value
                matched_volume += float(txn_map[m.primary_txn_id].amount)
            if m.matched_txn_id in txn_map:
                txn_map[m.matched_txn_id].status = TransactionStatus.MATCHED.value

        # Step 3: Run Exception Engine
        exception_engine = ExceptionEngine(
            fee_rate=fee_rate,
            gst_rate=gst_rate,
            date_tolerance_days=date_tolerance_days
        )
        raw_exceptions = exception_engine.evaluate_exceptions(
            unresolved_txns=unresolved_txns,
            all_txns=txns_payload,
            batch_id=batch.id
        )

        total_discrepancy = 0.0
        for exc in raw_exceptions:
            exc_orm = ExceptionRecord(
                batch_id=batch.id,
                transaction_id=exc["transaction_id"],
                exception_type=exc["exception_type"],
                severity=exc["severity"],
                status=exc["status"],
                expected_amount=Decimal(str(exc["expected_amount"])),
                actual_amount=Decimal(str(exc["actual_amount"])),
                difference_amount=Decimal(str(exc["difference_amount"])),
                evidence_json=exc["evidence_json"],
                ai_explanation=exc["ai_explanation"],
                ai_confidence=exc["ai_confidence"],
                ai_recommended_action=exc["ai_recommended_action"]
            )
            db.add(exc_orm)
            total_discrepancy += float(exc["difference_amount"])

            if exc["transaction_id"] in txn_map:
                txn_map[exc["transaction_id"]].status = TransactionStatus.EXCEPTION.value

        # Step 4: Calculate Batch Summary Metrics
        elapsed_ms = max(1, int((time.time() - start_time) * 1000))
        matched_records_count = len(matched_ids)
        exception_records_count = len(raw_exceptions)
        unmatched_records_count = total_records - matched_records_count

        match_rate = round((matched_records_count / total_records) * 100.0, 2) if total_records > 0 else 0.0
        exception_rate = round((exception_records_count / total_records) * 100.0, 2) if total_records > 0 else 0.0
        throughput = round((total_records / (elapsed_ms / 1000.0)), 2)

        total_vol = sum(float(t.amount) for t in db_txns)

        batch.total_records = total_records
        batch.matched_records = matched_records_count
        batch.unmatched_records = unmatched_records_count
        batch.exception_records = exception_records_count
        batch.match_rate = match_rate
        batch.exception_rate = exception_rate
        batch.total_volume = Decimal(str(round(total_vol, 2)))
        batch.matched_volume = Decimal(str(round(matched_volume, 2)))
        batch.discrepancy_amount = Decimal(str(round(total_discrepancy, 2)))
        batch.total_fee_amount = Decimal(str(round(total_fees, 2)))
        batch.total_tax_amount = Decimal(str(round(total_taxes, 2)))
        batch.processing_time_ms = elapsed_ms
        batch.throughput_rps = throughput
        batch.processed_count = total_records
        batch.status = BatchStatus.COMPLETED.value
        batch.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(batch)

        logger.info(f"Reconciliation batch {batch.id} completed. Match Rate: {match_rate}%, Discrepancy: INR {total_discrepancy:.2f} in {elapsed_ms}ms")
        return batch
