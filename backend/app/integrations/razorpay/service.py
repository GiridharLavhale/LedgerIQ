"""
Razorpay Ingestion Service
Orchestrates fetching from Razorpay API, normalization, database persistence, and deterministic reconciliation.
"""
import time
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.batch import ReconciliationBatch, BatchStatus
from app.models.transaction import Transaction
from app.integrations.razorpay.client import RazorpayClient
from app.integrations.razorpay.normalizer import RazorpayDataNormalizer
from app.services.reconciliation_service import ReconciliationService
from app.api.deps import log_audit_event
from app.core.logging import logger


class RazorpayIngestionService:
    """
    Coordinates ingestion of live or test transactions from Razorpay into LedgerIQ.
    """

    @classmethod
    async def sync_live_data(
        cls,
        db: AsyncSession,
        current_user: User,
        count: int = 50,
        auto_reconcile: bool = True
    ) -> ReconciliationBatch:
        """
        Fetches live/test payments and settlements from Razorpay API, normalizes them into
        canonical records, saves them to a new batch, and runs reconciliation.
        """
        client = RazorpayClient()
        if not client.is_configured:
            raise ValueError("Razorpay credentials are not configured in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).")

        logger.info(f"Syncing up to {count} live payments and settlements from Razorpay API...")

        # 1. Fetch from Razorpay API
        payments_raw = await client.fetch_payments(count=count)
        settlements_raw = await client.fetch_settlements(count=min(count, 20))

        if not payments_raw and not settlements_raw:
            raise RuntimeError("No payment or settlement records returned from Razorpay API.")

        # 2. Create Reconciliation Batch
        batch = ReconciliationBatch(
            org_id=current_user.org_id,
            name=f"Razorpay Live Sync ({len(payments_raw) + len(settlements_raw)} txns - {datetime.now(timezone.utc).strftime('%b %d %H:%M')})",
            status=BatchStatus.PROCESSING.value,
            created_by=current_user.id,
            notes=f"Ingested directly from Razorpay REST API (Key: {client.masked_key_id})"
        )
        db.add(batch)
        await db.flush()

        # 3. Normalize and insert canonical transactions
        total_txns = []
        for p in payments_raw:
            norm_p = RazorpayDataNormalizer.normalize_payment(p, org_id=current_user.org_id, batch_id=batch.id)
            total_txns.append(Transaction(**norm_p))

        for s in settlements_raw:
            norm_s = RazorpayDataNormalizer.normalize_settlement(s, org_id=current_user.org_id, batch_id=batch.id)
            total_txns.append(Transaction(**norm_s))

        db.add_all(total_txns)
        await db.commit()

        # 4. Trigger Deterministic Reconciliation
        if auto_reconcile:
            batch = await ReconciliationService.process_batch(
                batch_id=batch.id,
                db=db,
                fee_rate=0.02,
                gst_rate=0.18,
                date_tolerance_days=3,
                amount_tolerance=0.05
            )

        # 5. Immutable Audit Logging
        await log_audit_event(
            db=db,
            user=current_user,
            action="RAZORPAY_API_SYNC",
            target_entity="RECONCILIATION_BATCH",
            target_id=batch.id,
            new_state={"payments_synced": len(payments_raw), "settlements_synced": len(settlements_raw)},
            details=f"Live sync from Razorpay API imported {len(total_txns)} records."
        )

        return batch

    @classmethod
    async def sync_mock_data(
        cls,
        db: AsyncSession,
        current_user: User,
        count: int = 50,
        auto_reconcile: bool = True
    ) -> ReconciliationBatch:
        """
        Simulates live Razorpay API responses using exact Razorpay JSON payload schemas
        (paise denominations, pay_xxx, setl_xxx, epoch timestamps) to test the exact
        Razorpay ingestion and normalization pipeline offline or without API keys.
        """
        random.seed(42)
        base_epoch = int(time.time()) - (86400 * 5)

        raw_payments = []
        raw_settlements = []

        half = max(2, count // 2)
        for i in range(1, half + 1):
            pay_id = f"pay_{uuid.uuid4().hex[:14]}"
            order_id = f"order_{uuid.uuid4().hex[:14]}"
            gross_inr = random.randint(100, 1000) * 10.0  # ₹1,000 to ₹10,000
            amt_paise = int(gross_inr * 100)
            
            # 2% MDR fee in paise
            fee_paise = int(amt_paise * 0.02)
            # 18% GST in paise
            tax_paise = int(fee_paise * 0.18)

            created_at = base_epoch + (i * 3600)

            payment_payload = {
                "id": pay_id,
                "entity": "payment",
                "amount": amt_paise,
                "currency": "INR",
                "status": "captured",
                "order_id": order_id,
                "method": random.choice(["upi", "card", "netbanking"]),
                "fee": fee_paise,
                "tax": tax_paise,
                "email": f"customer_{i}@example.com",
                "contact": "+919876543210",
                "description": f"Razorpay Checkout for {order_id}",
                "created_at": created_at
            }
            raw_payments.append(payment_payload)

            # Pair with settlement (Level 4 fee/tax aware match)
            if i % 3 != 0:  # 66% matched, 33% exceptions
                net_paise = amt_paise - fee_paise - tax_paise
                settlement_payload = {
                    "id": f"setl_{uuid.uuid4().hex[:14]}",
                    "entity": "settlement",
                    "amount": net_paise,
                    "status": "processed",
                    "fees": fee_paise,
                    "tax": tax_paise,
                    "utr": order_id,  # Linked reference for Level 4 fee/tax decomposition match
                    "created_at": created_at + 86400  # T+1 settlement
                }
                raw_settlements.append(settlement_payload)

        # Create Batch
        batch = ReconciliationBatch(
            org_id=current_user.org_id,
            name=f"Razorpay API Feed ({len(raw_payments) + len(raw_settlements)} records)",
            status=BatchStatus.PROCESSING.value,
            created_by=current_user.id,
            notes="Ingested via Razorpay API schema pipeline (normalized from native paise payloads)."
        )
        db.add(batch)
        await db.flush()

        # Normalize through RazorpayDataNormalizer
        txns = []
        for p in raw_payments:
            txns.append(Transaction(**RazorpayDataNormalizer.normalize_payment(p, current_user.org_id, batch.id)))
        for s in raw_settlements:
            txns.append(Transaction(**RazorpayDataNormalizer.normalize_settlement(s, current_user.org_id, batch.id)))

        db.add_all(txns)
        await db.commit()

        if auto_reconcile:
            batch = await ReconciliationService.process_batch(
                batch_id=batch.id,
                db=db,
                fee_rate=0.02,
                gst_rate=0.18,
                date_tolerance_days=3,
                amount_tolerance=0.05
            )

        await log_audit_event(
            db=db,
            user=current_user,
            action="RAZORPAY_API_SYNC",
            target_entity="RECONCILIATION_BATCH",
            target_id=batch.id,
            new_state={"payments_synced": len(raw_payments), "settlements_synced": len(raw_settlements)},
            details="Ingested Razorpay formatted payment & settlement collections."
        )

        return batch
