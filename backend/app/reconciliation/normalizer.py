"""
Schema Normalizer and Canonical Financial Model Mapper
"""
import io
import re
import json
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd


# Canonical Field Synonyms Dictionary
HEADER_ALIASES = {
    "external_id": [
        "external_id", "transaction_id", "txn_id", "payment_id", "pay_id", "utr", 
        "utr_number", "tran_id", "bank_reference", "reference_number", "rrn", "cheque_no"
    ],
    "reference_id": [
        "reference_id", "reference", "ref_no", "ref", "merchant_reference", 
        "merchant_txn_id", "client_reference", "booking_ref", "tracking_id"
    ],
    "order_id": [
        "order_id", "order_no", "order_number", "order_ref", "invoice_no", "bill_id"
    ],
    "amount": [
        "amount", "gross_amount", "txn_amount", "transaction_amount", "order_amount", 
        "credit", "debit", "total_amount", "bill_amount", "value", "payment_amount"
    ],
    "fee": [
        "fee", "gateway_fee", "mdr", "commission", "charge", "processing_fee", "convenience_fee"
    ],
    "tax": [
        "tax", "gst", "service_tax", "vat", "tax_amount", "cgst_sgst", "igst"
    ],
    "net_amount": [
        "net_amount", "settlement_amount", "payout_amount", "net_settled", "net_credit", "settled_amount"
    ],
    "currency": [
        "currency", "curr", "ccy", "currency_code"
    ],
    "transaction_date": [
        "transaction_date", "date", "txn_date", "payment_date", "settlement_date", 
        "value_date", "created_at", "timestamp", "posted_date"
    ],
    "counterparty": [
        "counterparty", "customer_name", "payer", "payee", "party_name", "merchant_name", "beneficiary"
    ],
    "description": [
        "description", "narrative", "narration", "remarks", "notes", "memo", "details"
    ]
}


def clean_header_name(header: str) -> str:
    """Normalize header string to lowercase snake_case."""
    h = str(header).strip().lower()
    h = re.sub(r"[^a-z0-9_]", "_", h)
    h = re.sub(r"_+", "_", h).strip("_")
    return h


def map_columns(headers: List[str]) -> Dict[str, str]:
    """Map detected input headers to canonical field names."""
    mapping = {}
    cleaned_headers = {clean_header_name(h): h for h in headers}

    for canonical_field, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            cleaned_alias = clean_header_name(alias)
            if cleaned_alias in cleaned_headers:
                original_header = cleaned_headers[cleaned_alias]
                if original_header not in mapping.values():
                    mapping[canonical_field] = original_header
                    break
    return mapping


def parse_monetary_value(val: Any) -> float:
    """Parse string/numeric value to clean float monetary amount."""
    if val is None or pd.isna(val) or val == "":
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
        
    s = str(val).strip()
    # Strip currency signs (₹, $, €, £), commas, and spaces
    s = re.sub(r"[₹$€£,\s]", "", s)
    # Handle negative values in parentheses: (100.00) -> -100.00
    if s.startswith("(") and s.endswith(")"):
        s = "-" + s[1:-1]
        
    try:
        return float(Decimal(s))
    except (InvalidOperation, ValueError):
        return 0.0


def parse_datetime_value(val: Any) -> datetime:
    """Parse multi-format date strings into timezone-aware datetime."""
    if val is None or pd.isna(val) or val == "":
        return datetime.now(timezone.utc)
    if isinstance(val, (datetime, pd.Timestamp)):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val.astimezone(timezone.utc)

    s = str(val).strip()
    # Try ISO formats first
    try:
        dt = pd.to_datetime(s, utc=True)
        return dt.to_pydatetime()
    except Exception:
        pass

    # Common standard patterns
    date_formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y",
    ]
    for fmt in date_formats:
        try:
            parsed = datetime.strptime(s, fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    return datetime.now(timezone.utc)


class FinancialDataNormalizer:
    """Normalizes tabular datasets into canonical financial records."""

    @classmethod
    def parse_file_content(cls, content: bytes, filename: str) -> pd.DataFrame:
        """Load tabular file into Pandas DataFrame."""
        fn = filename.lower()
        if fn.endswith(".csv") or fn.endswith(".txt"):
            return pd.read_csv(io.BytesIO(content), encoding="utf-8-sig", dtype=str)
        elif fn.endswith(".xlsx") or fn.endswith(".xls"):
            return pd.read_excel(io.BytesIO(content), dtype=str)
        elif fn.endswith(".json"):
            data = json.loads(content.decode("utf-8"))
            if isinstance(data, list):
                return pd.DataFrame(data)
            elif isinstance(data, dict) and "records" in data:
                return pd.DataFrame(data["records"])
            else:
                return pd.DataFrame([data])
        else:
            # Attempt CSV parsing as fallback
            return pd.read_csv(io.BytesIO(content), dtype=str)

    @classmethod
    def normalize_records(
        cls,
        df: pd.DataFrame,
        source_type: str = "PAYMENT",
        source_name: str = "Uploaded File",
        custom_mapping: Optional[Dict[str, str]] = None
    ) -> Tuple[List[Dict[str, Any]], Dict[str, str], List[str]]:
        """
        Normalize DataFrame rows into a canonical dictionary structure.
        Returns (canonical_records, detected_mapping, validation_errors).
        """
        headers = [str(c) for c in df.columns]
        mapping = custom_mapping or map_columns(headers)
        
        records: List[Dict[str, Any]] = []
        errors: List[str] = []

        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            
            # Extract fields via mapping
            ext_id = str(row_dict.get(mapping.get("external_id"), "")).strip() if mapping.get("external_id") else None
            ref_id = str(row_dict.get(mapping.get("reference_id"), "")).strip() if mapping.get("reference_id") else None
            order_id = str(row_dict.get(mapping.get("order_id"), "")).strip() if mapping.get("order_id") else None
            
            amount = parse_monetary_value(row_dict.get(mapping.get("amount"))) if mapping.get("amount") else 0.0
            fee = parse_monetary_value(row_dict.get(mapping.get("fee"))) if mapping.get("fee") else 0.0
            tax = parse_monetary_value(row_dict.get(mapping.get("tax"))) if mapping.get("tax") else 0.0
            
            # Net amount computation: if explicitly supplied use it, else compute amount - fee - tax
            if mapping.get("net_amount") and not pd.isna(row_dict.get(mapping.get("net_amount"))):
                net_amount = parse_monetary_value(row_dict.get(mapping.get("net_amount")))
            else:
                net_amount = amount - fee - tax
                
            currency = str(row_dict.get(mapping.get("currency"), "INR")).strip().upper() if mapping.get("currency") else "INR"
            if not currency or currency == "NAN":
                currency = "INR"

            txn_date = parse_datetime_value(row_dict.get(mapping.get("transaction_date"))) if mapping.get("transaction_date") else datetime.now(timezone.utc)
            counterparty = str(row_dict.get(mapping.get("counterparty"), "")).strip() if mapping.get("counterparty") else None
            description = str(row_dict.get(mapping.get("description"), "")).strip() if mapping.get("description") else None

            # Fallbacks if IDs are missing
            if not ext_id and not ref_id and not order_id:
                ref_id = f"REF-{idx+1000}"

            canonical_record = {
                "source_type": source_type.upper(),
                "source_name": source_name,
                "external_id": ext_id if ext_id and ext_id != "nan" else None,
                "reference_id": ref_id if ref_id and ref_id != "nan" else (ext_id or order_id),
                "order_id": order_id if order_id and order_id != "nan" else None,
                "amount": round(amount, 2),
                "fee": round(fee, 2),
                "tax": round(tax, 2),
                "net_amount": round(net_amount, 2),
                "currency": currency,
                "transaction_date": txn_date,
                "counterparty": counterparty if counterparty and counterparty != "nan" else None,
                "description": description if description and description != "nan" else None,
                "raw_data": {k: (v if not pd.isna(v) else None) for k, v in row_dict.items()}
            }
            records.append(canonical_record)

        return records, mapping, errors
