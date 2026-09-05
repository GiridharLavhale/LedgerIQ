"""
Unit Tests for Schema Normalizer and Field Mapping
"""
import pandas as pd
from app.reconciliation.normalizer import (
    FinancialDataNormalizer,
    map_columns,
    parse_monetary_value,
    parse_datetime_value
)


def test_map_columns_standard():
    headers = ["Payment_ID", "Gross_Amount", "Date", "Customer_Name", "GST"]
    mapping = map_columns(headers)
    assert mapping.get("external_id") == "Payment_ID"
    assert mapping.get("amount") == "Gross_Amount"
    assert mapping.get("transaction_date") == "Date"
    assert mapping.get("counterparty") == "Customer_Name"
    assert mapping.get("tax") == "GST"


def test_parse_monetary_values():
    assert parse_monetary_value("₹10,000.50") == 10000.50
    assert parse_monetary_value("$1,250.00") == 1250.00
    assert parse_monetary_value("(500.00)") == -500.00
    assert parse_monetary_value(9764.0) == 9764.0
    assert parse_monetary_value("") == 0.0
    assert parse_monetary_value(None) == 0.0


def test_dataframe_normalization():
    df = pd.DataFrame([
        {
            "txn_id": "pay_test_001",
            "ref_no": "ORD-501",
            "amount": "15,000.00",
            "fee": "300.00",
            "tax": "54.00",
            "date": "2026-08-20 14:30:00",
            "payer": "Acme Corp"
        }
    ])
    records, mapping, errors = FinancialDataNormalizer.normalize_records(df, source_type="PAYMENT")
    assert len(records) == 1
    rec = records[0]
    assert rec["external_id"] == "pay_test_001"
    assert rec["reference_id"] == "ORD-501"
    assert rec["amount"] == 15000.00
    assert rec["fee"] == 300.00
    assert rec["tax"] == 54.00
    assert rec["net_amount"] == 14646.00
    assert rec["currency"] == "INR"
    assert rec["counterparty"] == "Acme Corp"
