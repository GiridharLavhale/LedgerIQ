"""
Unit Tests for 4-Level Reconciliation Engine
"""
from datetime import datetime, timezone, timedelta
from app.reconciliation.matcher import ReconciliationEngine
from app.models.match import MatchStrategy, MatchStatus


def test_level_1_exact_id_matching():
    engine = ReconciliationEngine()
    now = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)

    txns = [
        {
            "id": "P1",
            "source_type": "PAYMENT",
            "external_id": "pay_exact_100",
            "reference_id": "ORD-100",
            "amount": 5000.0,
            "currency": "INR",
            "transaction_date": now
        },
        {
            "id": "S1",
            "source_type": "SETTLEMENT",
            "external_id": "pay_exact_100",
            "reference_id": "ORD-100",
            "amount": 5000.0,
            "currency": "INR",
            "transaction_date": now
        }
    ]

    matches, matched_ids, unresolved = engine.execute_reconciliation(txns)
    assert len(matches) == 1
    assert matches[0].strategy == MatchStrategy.EXACT_ID
    assert matches[0].confidence == 1.0
    assert len(unresolved) == 0


def test_level_2_strict_composite_matching():
    engine = ReconciliationEngine()
    d1 = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)
    d2 = d1 + timedelta(hours=12)

    txns = [
        {
            "id": "P2",
            "source_type": "PAYMENT",
            "external_id": "pay_diff_ext",
            "reference_id": "ORD-200",
            "amount": 12500.0,
            "currency": "INR",
            "transaction_date": d1
        },
        {
            "id": "S2",
            "source_type": "BANK_STATEMENT",
            "external_id": "utr_diff_ext",
            "reference_id": "ORD-200",
            "amount": 12500.0,
            "currency": "INR",
            "transaction_date": d2
        }
    ]

    matches, matched_ids, unresolved = engine.execute_reconciliation(txns)
    assert len(matches) == 1
    assert matches[0].strategy == MatchStrategy.STRICT_COMPOSITE
    assert matches[0].confidence == 0.98
    assert matches[0].amount_difference == 0.0


def test_level_3_fuzzy_reference_matching():
    engine = ReconciliationEngine(date_tolerance_days=3)
    d1 = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)
    d2 = d1 + timedelta(days=2)

    txns = [
        {
            "id": "P3",
            "source_type": "PAYMENT",
            "reference_id": "ORD-300-PROD",
            "amount": 8000.0,
            "currency": "INR",
            "transaction_date": d1
        },
        {
            "id": "S3",
            "source_type": "BANK_STATEMENT",
            "reference_id": "ORD-300-PROD-RZP",
            "amount": 8000.0,
            "currency": "INR",
            "transaction_date": d2
        }
    ]

    matches, matched_ids, unresolved = engine.execute_reconciliation(txns)
    assert len(matches) == 1
    assert matches[0].strategy == MatchStrategy.FUZZY_PROXIMITY
    assert matches[0].confidence >= 0.75


def test_level_4_settlement_fee_and_tax_matching():
    """
    Tests Level 4 Settlement Aware matching with 2% MDR + 18% GST:
    Gross = 10,000.00
    Fee = 200.00
    Tax = 36.00
    Settlement = 9,764.00
    10000 - 200 - 36 = 9764
    """
    engine = ReconciliationEngine(fee_rate=0.02, gst_rate=0.18)
    d1 = datetime(2026, 8, 20, 10, 0, 0, tzinfo=timezone.utc)
    d2 = d1 + timedelta(days=1)

    txns = [
        {
            "id": "P4",
            "source_type": "PAYMENT",
            "reference_id": "ORD-400",
            "amount": 10000.0,
            "net_amount": 9764.0,
            "currency": "INR",
            "transaction_date": d1
        },
        {
            "id": "S4",
            "source_type": "SETTLEMENT",
            "reference_id": "ORD-400",
            "amount": 9764.0,
            "net_amount": 9764.0,
            "currency": "INR",
            "transaction_date": d2
        }
    ]

    matches, matched_ids, unresolved = engine.execute_reconciliation(txns)
    assert len(matches) == 1
    m = matches[0]
    assert m.strategy == MatchStrategy.SETTLEMENT_FEE_AWARE
    assert m.confidence == 0.95
    assert m.calculated_fee == 200.00
    assert m.calculated_tax == 36.00
    assert m.amount_difference == 0.0
