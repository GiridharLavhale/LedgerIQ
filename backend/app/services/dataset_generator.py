"""
Deterministic Synthetic Financial Dataset Generator (50, 100, 500, 1000 Records)
"""
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any


MERCHANT_NAMES = [
    "TechCorp Solutions", "Urban Retail Hub", "CloudNine SaaS", 
    "Prime Logistics", "Bharat Agro Supplies", "FinEdge Advisory",
    "Apex Healthcare", "Zeta Dynamics", "BlueSky Travel", "Horizon Electronics"
]

PAYMENT_METHODS = ["UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"]


class SyntheticDatasetGenerator:
    """
    Generates realistic multi-source financial ledgers with mathematically verifiable ground truth.
    """

    @classmethod
    def generate_benchmark_dataset(
        cls,
        record_count: int = 100,
        seed: int = 42,
        fee_rate: float = 0.02,
        gst_rate: float = 0.18
    ) -> Dict[str, Any]:
        """
        Generates paired Payments and Settlements/Bank Statements with ground truth metadata.
        Guarantees total records produced == record_count.
        """
        random.seed(seed)
        base_date = datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)

        payments: List[Dict[str, Any]] = []
        settlements: List[Dict[str, Any]] = []
        ground_truth: Dict[str, Any] = {
            "exact_matches": [],
            "fee_tax_matches": [],
            "fuzzy_matches": [],
            "missing_settlements": [],
            "missing_payments": [],
            "duplicates": [],
            "amount_mismatches": [],
            "date_mismatches": []
        }

        # Each standard pair adds 2 records (1 Payment + 1 Settlement).
        # Dedicated orphans add 1 record.
        # We calculate the number of pairs and orphan singletons to reach exact record_count.
        orphan_count = max(2, int(record_count * 0.10))
        if (record_count - orphan_count) % 2 != 0:
            orphan_count += 1
        
        pair_count = (record_count - orphan_count) // 2

        i = 0
        for p_idx in range(1, pair_count + 1):
            i += 1
            ref_code = f"ORD-{1000 + i}"
            pay_id = f"pay_{uuid.uuid4().hex[:10]}"
            utr_id = f"UTR{random.randint(10000000, 99999999)}"
            merchant = random.choice(MERCHANT_NAMES)
            gross_amt = float(random.randint(50, 500) * 100)  # ₹5,000 to ₹50,000
            
            fee = round(gross_amt * fee_rate, 2)
            tax = round(fee * gst_rate, 2)
            net_amt = round(gross_amt - fee - tax, 2)

            txn_date = base_date + timedelta(days=random.randint(0, 15), hours=random.randint(1, 10))
            case_selector = p_idx % 8

            if case_selector in [1, 2, 3]:
                # EXACT GATEWAY / BANK MATCH
                payment_rec = {
                    "source_type": "PAYMENT",
                    "source_name": "Razorpay Gateway",
                    "external_id": pay_id,
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": gross_amt,
                    "fee": 0.0,
                    "tax": 0.0,
                    "net_amount": gross_amt,
                    "currency": "INR",
                    "transaction_date": txn_date.isoformat(),
                    "counterparty": merchant,
                    "description": f"Customer payment via UPI for {ref_code}"
                }
                settlement_rec = {
                    "source_type": "BANK_STATEMENT",
                    "source_name": "HDFC Current Account",
                    "external_id": pay_id,  # Matching external ID
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": gross_amt,
                    "fee": 0.0,
                    "tax": 0.0,
                    "net_amount": gross_amt,
                    "currency": "INR",
                    "transaction_date": (txn_date + timedelta(hours=4)).isoformat(),
                    "counterparty": "Razorpay Payouts",
                    "description": f"CMS Credit Razorpay Ref {ref_code}"
                }
                payments.append(payment_rec)
                settlements.append(settlement_rec)
                ground_truth["exact_matches"].append({"payment_ref": ref_code, "amount": gross_amt})

            elif case_selector in [4, 5]:
                # SETTLEMENT FEE/TAX AWARE MATCH (Payment = Gross, Settlement = Net, e.g. 10,000 -> 9,764)
                payment_rec = {
                    "source_type": "PAYMENT",
                    "source_name": "Razorpay Gateway",
                    "external_id": pay_id,
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": gross_amt,
                    "fee": fee,
                    "tax": tax,
                    "net_amount": net_amt,
                    "currency": "INR",
                    "transaction_date": txn_date.isoformat(),
                    "counterparty": merchant,
                    "description": f"Credit Card Sale MDR 2% for {ref_code}"
                }
                settlement_rec = {
                    "source_type": "SETTLEMENT",
                    "source_name": "Razorpay Settlement Batch",
                    "external_id": utr_id,
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": net_amt,
                    "fee": fee,
                    "tax": tax,
                    "net_amount": net_amt,
                    "currency": "INR",
                    "transaction_date": (txn_date + timedelta(days=1)).isoformat(),
                    "counterparty": "Razorpay Software Pvt Ltd",
                    "description": f"Settlement Payout for {ref_code} Net of MDR"
                }
                payments.append(payment_rec)
                settlements.append(settlement_rec)
                ground_truth["fee_tax_matches"].append({"payment_ref": ref_code, "gross": gross_amt, "net": net_amt, "fee": fee, "tax": tax})

            elif case_selector == 6:
                # FUZZY REFERENCE MATCH
                fuzzy_ref = f"{ref_code}-RZP"
                payment_rec = {
                    "source_type": "PAYMENT",
                    "source_name": "Razorpay Gateway",
                    "external_id": pay_id,
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": gross_amt,
                    "fee": 0.0,
                    "tax": 0.0,
                    "net_amount": gross_amt,
                    "currency": "INR",
                    "transaction_date": txn_date.isoformat(),
                    "counterparty": merchant,
                    "description": f"Web order {ref_code}"
                }
                settlement_rec = {
                    "source_type": "BANK_STATEMENT",
                    "source_name": "ICICI Bank Statement",
                    "external_id": utr_id,
                    "reference_id": fuzzy_ref,
                    "order_id": fuzzy_ref,
                    "amount": gross_amt,
                    "fee": 0.0,
                    "tax": 0.0,
                    "net_amount": gross_amt,
                    "currency": "INR",
                    "transaction_date": (txn_date + timedelta(days=2)).isoformat(),
                    "counterparty": "PG Payout",
                    "description": f"NEFT-ICIC-{fuzzy_ref}"
                }
                payments.append(payment_rec)
                settlements.append(settlement_rec)
                ground_truth["fuzzy_matches"].append({"payment_ref": ref_code, "settlement_ref": fuzzy_ref, "amount": gross_amt})

            else:
                # AMOUNT MISMATCH
                discrepancy = 500.0
                payment_rec = {
                    "source_type": "PAYMENT",
                    "source_name": "Razorpay Gateway",
                    "external_id": pay_id,
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": gross_amt,
                    "fee": fee,
                    "tax": tax,
                    "net_amount": net_amt,
                    "currency": "INR",
                    "transaction_date": txn_date.isoformat(),
                    "counterparty": merchant,
                    "description": f"Order payment {ref_code}"
                }
                settlement_rec = {
                    "source_type": "SETTLEMENT",
                    "source_name": "Razorpay Settlement Batch",
                    "external_id": utr_id,
                    "reference_id": ref_code,
                    "order_id": ref_code,
                    "amount": net_amt - discrepancy,
                    "fee": fee,
                    "tax": tax,
                    "net_amount": net_amt - discrepancy,
                    "currency": "INR",
                    "transaction_date": (txn_date + timedelta(days=1)).isoformat(),
                    "counterparty": "Razorpay Payouts",
                    "description": f"Settlement with chargeback dispute deduction {ref_code}"
                }
                payments.append(payment_rec)
                settlements.append(settlement_rec)
                ground_truth["amount_mismatches"].append({"reference": ref_code, "expected": net_amt, "actual": net_amt - discrepancy})

        # Add singletons to complete exact record count
        half_orphans = orphan_count // 2
        for o_idx in range(half_orphans):
            i += 1
            orphan_pay_ref = f"ORD-MISSING-SETTLE-{1000 + i}"
            orphan_amt = float(random.randint(50, 200) * 100)
            payments.append({
                "source_type": "PAYMENT",
                "source_name": "Razorpay Gateway",
                "external_id": f"pay_{uuid.uuid4().hex[:10]}",
                "reference_id": orphan_pay_ref,
                "order_id": orphan_pay_ref,
                "amount": orphan_amt,
                "fee": 0.0,
                "tax": 0.0,
                "net_amount": orphan_amt,
                "currency": "INR",
                "transaction_date": (base_date + timedelta(days=random.randint(1, 10))).isoformat(),
                "counterparty": "TechCorp Solutions",
                "description": f"Unsettled payment {orphan_pay_ref}"
            })
            ground_truth["missing_settlements"].append({"reference": orphan_pay_ref, "amount": orphan_amt})

        for o_idx in range(orphan_count - half_orphans):
            i += 1
            orphan_bank_ref = f"BANK-MISSING-PAY-{1000 + i}"
            orphan_amt = float(random.randint(50, 200) * 100)
            settlements.append({
                "source_type": "BANK_STATEMENT",
                "source_name": "HDFC Current Account",
                "external_id": f"UTR{random.randint(10000000, 99999999)}",
                "reference_id": orphan_bank_ref,
                "order_id": orphan_bank_ref,
                "amount": orphan_amt,
                "fee": 0.0,
                "tax": 0.0,
                "net_amount": orphan_amt,
                "currency": "INR",
                "transaction_date": (base_date + timedelta(days=random.randint(1, 10))).isoformat(),
                "counterparty": "Direct Deposit",
                "description": f"Unidentified Direct RTGS {orphan_bank_ref}"
            })
            ground_truth["missing_payments"].append({"reference": orphan_bank_ref, "amount": orphan_amt})

        all_records = payments + settlements
        total_records = len(all_records)
        total_ground_truth_matches = (
            len(ground_truth["exact_matches"]) +
            len(ground_truth["fee_tax_matches"]) +
            len(ground_truth["fuzzy_matches"])
        )

        return {
            "record_count": total_records,
            "seed": seed,
            "payments": payments,
            "settlements": settlements,
            "all_records": all_records,
            "ground_truth": ground_truth,
            "ground_truth_matches_count": total_ground_truth_matches
        }
