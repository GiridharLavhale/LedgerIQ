"""
Razorpay Data Normalizer
Transforms native Razorpay API payloads (paise, epoch seconds, nested structures) into LedgerIQ's canonical financial model.
"""
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.transaction import SourceType, TransactionStatus


class RazorpayDataNormalizer:
    """
    Normalizes Razorpay payments and settlements into canonical LedgerIQ transactions.
    Crucial: Razorpay amounts/fees/taxes are denominated in paise (1 INR = 100 paise).
    """

    @staticmethod
    def normalize_payment(item: Dict[str, Any], org_id: str, batch_id: str) -> Dict[str, Any]:
        raw_amt_paise = item.get("amount", 0)
        raw_fee_paise = item.get("fee", 0) or 0
        raw_tax_paise = item.get("tax", 0) or 0

        # Convert paise to INR with Decimal precision
        amount_inr = Decimal(str(round(raw_amt_paise / 100.0, 2)))
        fee_inr = Decimal(str(round(raw_fee_paise / 100.0, 2)))
        tax_inr = Decimal(str(round(raw_tax_paise / 100.0, 2)))
        net_amount_inr = amount_inr - fee_inr

        # Extract transaction timestamp
        epoch = item.get("created_at")
        if epoch:
            txn_date = datetime.fromtimestamp(epoch, tz=timezone.utc)
        else:
            txn_date = datetime.now(timezone.utc)

        # Counterparty & description
        customer = item.get("email") or item.get("contact") or "Razorpay Customer"
        method = item.get("method", "online")
        desc = item.get("description") or f"Payment {item.get('id')} via {method}"

        return {
            "org_id": org_id,
            "batch_id": batch_id,
            "source_type": SourceType.PAYMENT.value,
            "source_name": "Razorpay Gateway",
            "external_id": item.get("id"),
            "reference_id": item.get("order_id") or item.get("id"),
            "order_id": item.get("order_id"),
            "amount": amount_inr,
            "fee": fee_inr,
            "tax": tax_inr,
            "net_amount": net_amount_inr,
            "currency": item.get("currency", "INR"),
            "transaction_date": txn_date,
            "status": TransactionStatus.UNRECONCILED.value,
            "counterparty": str(customer),
            "description": str(desc),
            "raw_data": item
        }

    @staticmethod
    def normalize_settlement(item: Dict[str, Any], org_id: str, batch_id: str) -> Dict[str, Any]:
        raw_amt_paise = item.get("amount", 0)
        raw_fees_paise = item.get("fees", 0) or 0
        raw_tax_paise = item.get("tax", 0) or 0

        amount_inr = Decimal(str(round(raw_amt_paise / 100.0, 2)))
        fee_inr = Decimal(str(round(raw_fees_paise / 100.0, 2)))
        tax_inr = Decimal(str(round(raw_tax_paise / 100.0, 2)))

        epoch = item.get("created_at")
        if epoch:
            txn_date = datetime.fromtimestamp(epoch, tz=timezone.utc)
        else:
            txn_date = datetime.now(timezone.utc)

        utr = item.get("utr") or item.get("id")

        return {
            "org_id": org_id,
            "batch_id": batch_id,
            "source_type": SourceType.SETTLEMENT.value,
            "source_name": "Razorpay Settlement Batch",
            "external_id": item.get("id"),
            "reference_id": utr,
            "order_id": None,
            "amount": amount_inr,
            "fee": fee_inr,
            "tax": tax_inr,
            "net_amount": amount_inr,  # Net credited to bank
            "currency": "INR",
            "transaction_date": txn_date,
            "status": TransactionStatus.UNRECONCILED.value,
            "counterparty": "Razorpay Software Pvt Ltd",
            "description": f"Razorpay Settlement UTR {utr}",
            "raw_data": item
        }
