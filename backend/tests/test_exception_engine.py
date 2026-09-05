"""
Unit Tests for Exception Classification Engine
"""
from datetime import datetime, timezone, timedelta
from app.reconciliation.exception_engine import ExceptionEngine
from app.models.exception import ExceptionType, ExceptionSeverity


def test_exception_classification_duplicate():
    engine = ExceptionEngine()
    now = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)

    all_txns = [
        {"id": "T1", "source_type": "PAYMENT", "reference_id": "ORD-DUP-1", "amount": 5000.0, "transaction_date": now},
        {"id": "T2", "source_type": "PAYMENT", "reference_id": "ORD-DUP-1", "amount": 5000.0, "transaction_date": now}
    ]
    unresolved = list(all_txns)

    exceptions = engine.evaluate_exceptions(unresolved, all_txns, batch_id="B1")
    assert len(exceptions) >= 1
    dup_excs = [e for e in exceptions if e["exception_type"] == ExceptionType.DUPLICATE_TRANSACTION.value]
    assert len(dup_excs) > 0
    assert dup_excs[0]["severity"] == ExceptionSeverity.CRITICAL.value


def test_exception_missing_settlement():
    engine = ExceptionEngine()
    now = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)

    all_txns = [
        {"id": "T3", "source_type": "PAYMENT", "reference_id": "ORD-ORPHAN-PAY", "amount": 15000.0, "transaction_date": now}
    ]
    unresolved = list(all_txns)

    exceptions = engine.evaluate_exceptions(unresolved, all_txns, batch_id="B2")
    assert len(exceptions) == 1
    assert exceptions[0]["exception_type"] == ExceptionType.MISSING_SETTLEMENT.value
    assert exceptions[0]["difference_amount"] == 15000.0


def test_exception_missing_payment():
    engine = ExceptionEngine()
    now = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)

    all_txns = [
        {"id": "T4", "source_type": "BANK_STATEMENT", "reference_id": "ORD-ORPHAN-BANK", "amount": 25000.0, "transaction_date": now}
    ]
    unresolved = list(all_txns)

    exceptions = engine.evaluate_exceptions(unresolved, all_txns, batch_id="B3")
    assert len(exceptions) == 1
    assert exceptions[0]["exception_type"] == ExceptionType.MISSING_PAYMENT.value
    assert exceptions[0]["difference_amount"] == 25000.0
