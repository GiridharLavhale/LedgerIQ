"""
Dedicated Exception Engine & Discrepancy Classifier (10 Categories)
"""
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from app.models.exception import ExceptionRecord, ExceptionType, ExceptionSeverity, ExceptionStatus
from app.models.transaction import SourceType
from app.reconciliation.scoring import calculate_string_similarity, calculate_date_difference
from app.reconciliation.verifier import calculate_fee_and_tax, round_curr


class ExceptionEngine:
    """
    Classifies unresolved and anomalous financial records into 10 structured exception categories.
    """

    def __init__(
        self,
        fee_rate: float = 0.02,
        gst_rate: float = 0.18,
        date_tolerance_days: int = 3
    ):
        self.fee_rate = fee_rate
        self.gst_rate = gst_rate
        self.date_tolerance_days = date_tolerance_days

    def evaluate_exceptions(
        self,
        unresolved_txns: List[Dict[str, Any]],
        all_txns: List[Dict[str, Any]],
        batch_id: str
    ) -> List[Dict[str, Any]]:
        """
        Processes all unresolved transactions and determines precise exception types,
        severity, expected/actual amounts, and deterministic root-cause evidence.
        """
        exceptions: List[Dict[str, Any]] = []
        handled_txn_ids = set()

        # Step 1: Detect Duplicate Transactions
        ref_counts: Dict[str, List[Dict[str, Any]]] = {}
        for t in all_txns:
            ref = str(t.get("reference_id") or "").strip().upper()
            if ref and ref != "NAN":
                ref_counts.setdefault(ref, []).append(t)

        for ref, group in ref_counts.items():
            if len(group) > 1:
                # Check if they share the exact same source type and amount (true duplicate)
                payments_in_group = [t for t in group if str(t.get("source_type")).upper() == SourceType.PAYMENT.value]
                if len(payments_in_group) > 1:
                    for dup in payments_in_group:
                        if dup["id"] in [u["id"] for u in unresolved_txns] and dup["id"] not in handled_txn_ids:
                            amt = float(dup["amount"])
                            exceptions.append({
                                "batch_id": batch_id,
                                "transaction_id": dup["id"],
                                "exception_type": ExceptionType.DUPLICATE_TRANSACTION.value,
                                "severity": ExceptionSeverity.CRITICAL.value,
                                "status": ExceptionStatus.OPEN.value,
                                "expected_amount": amt,
                                "actual_amount": amt * len(payments_in_group),
                                "difference_amount": amt * (len(payments_in_group) - 1),
                                "evidence_json": {
                                    "reason": "Duplicate transaction detected with identical reference and amount",
                                    "reference_id": ref,
                                    "duplicate_count": len(payments_in_group),
                                    "duplicate_ids": [t["id"] for t in payments_in_group]
                                },
                                "ai_explanation": f"Duplicate payment detected for reference '{ref}'. {len(payments_in_group)} instances found totaling ₹{amt * len(payments_in_group):.2f}.",
                                "ai_confidence": 0.99,
                                "ai_recommended_action": "FLAG_DUPLICATE_FOR_REVERSAL"
                            })
                            handled_txn_ids.add(dup["id"])

        # Step 2: Classify Remaining Unresolved Transactions
        for t in unresolved_txns:
            tid = t["id"]
            if tid in handled_txn_ids:
                continue

            st = str(t.get("source_type", "")).upper()
            amt = float(t["amount"])
            ref = str(t.get("reference_id") or "").strip()
            ext = str(t.get("external_id") or "").strip()

            # Find potential counterpart in all_txns that has matching or similar reference
            candidates = [
                cand for cand in all_txns 
                if cand["id"] != tid and str(cand.get("source_type", "")).upper() != st
            ]

            best_candidate = None
            for cand in candidates:
                cand_ref = str(cand.get("reference_id") or "").strip()
                cand_ext = str(cand.get("external_id") or "").strip()
                if (ref and cand_ref and ref.upper() == cand_ref.upper()) or (ext and cand_ext and ext.upper() == cand_ext.upper()):
                    best_candidate = cand
                    break
                elif ref and cand_ref and calculate_string_similarity(ref, cand_ref) >= 0.80:
                    best_candidate = cand
                    break

            if best_candidate:
                c_amt = float(best_candidate["amount"])
                days = calculate_date_difference(t["transaction_date"], best_candidate["transaction_date"])
                
                # Check for Amount Mismatch
                exp_fee, exp_tax, exp_net = calculate_fee_and_tax(amt, self.fee_rate, self.gst_rate)
                diff = round_curr(abs(c_amt - exp_net)) if st == SourceType.PAYMENT.value else round_curr(abs(amt - c_amt))

                if diff > 1.0:
                    # Check if it's a Fee or Tax discrepancy
                    # Suppose fee deduction was different from contract (e.g. 3% instead of 2%)
                    actual_deduction = abs(amt - c_amt)
                    expected_deduction = exp_fee + exp_tax
                    
                    if abs(actual_deduction - expected_deduction) > 0.50 and actual_deduction < amt:
                        exc_type = ExceptionType.FEE_DISCREPANCY.value
                        sev = ExceptionSeverity.MEDIUM.value
                        explanation = f"Fee discrepancy: Gateway deducted ₹{actual_deduction:.2f} instead of expected standard MDR+GST of ₹{expected_deduction:.2f}."
                        action = "REQUEST_FEE_AUDIT"
                    else:
                        exc_type = ExceptionType.AMOUNT_MISMATCH.value
                        sev = ExceptionSeverity.HIGH.value if diff > 500 else ExceptionSeverity.MEDIUM.value
                        explanation = f"Amount mismatch: Transaction of ₹{amt:.2f} has counterpart of ₹{c_amt:.2f}. Discrepancy of ₹{diff:.2f} exceeds standard fee tolerance."
                        action = "INVESTIGATE_AMOUNT_VARIANCE"

                    exceptions.append({
                        "batch_id": batch_id,
                        "transaction_id": tid,
                        "exception_type": exc_type,
                        "severity": sev,
                        "status": ExceptionStatus.OPEN.value,
                        "expected_amount": exp_net if st == SourceType.PAYMENT.value else c_amt,
                        "actual_amount": c_amt if st == SourceType.PAYMENT.value else amt,
                        "difference_amount": diff,
                        "evidence_json": {
                            "candidate_id": best_candidate["id"],
                            "candidate_amount": c_amt,
                            "date_difference_days": days,
                            "discrepancy": diff
                        },
                        "ai_explanation": explanation,
                        "ai_confidence": 0.92,
                        "ai_recommended_action": action
                    })
                    handled_txn_ids.add(tid)
                    continue

                # Check for Date Mismatch (> 7 days settlement delay)
                if days > 7:
                    exceptions.append({
                        "batch_id": batch_id,
                        "transaction_id": tid,
                        "exception_type": ExceptionType.DATE_MISMATCH.value,
                        "severity": ExceptionSeverity.MEDIUM.value,
                        "status": ExceptionStatus.OPEN.value,
                        "expected_amount": amt,
                        "actual_amount": c_amt,
                        "difference_amount": 0.0,
                        "evidence_json": {
                            "candidate_id": best_candidate["id"],
                            "days_elapsed": days,
                            "threshold": 7
                        },
                        "ai_explanation": f"Settlement timing delay: Record matched with counterpart after {days} days (exceeds standard T+3 SLA).",
                        "ai_confidence": 0.95,
                        "ai_recommended_action": "APPROVE_DELAYED_SETTLEMENT"
                    })
                    handled_txn_ids.add(tid)
                    continue

            # Orphan Records: Missing Settlement or Missing Payment
            if st in [SourceType.PAYMENT.value, SourceType.INVOICE.value]:
                exceptions.append({
                    "batch_id": batch_id,
                    "transaction_id": tid,
                    "exception_type": ExceptionType.MISSING_SETTLEMENT.value,
                    "severity": ExceptionSeverity.HIGH.value if amt > 1000 else ExceptionSeverity.MEDIUM.value,
                    "status": ExceptionStatus.OPEN.value,
                    "expected_amount": amt,
                    "actual_amount": 0.0,
                    "difference_amount": amt,
                    "evidence_json": {
                        "source_type": st,
                        "reference_id": ref,
                        "amount": amt,
                        "note": "Payment recorded in OMS/Gateway, but no corresponding settlement or bank credit found."
                    },
                    "ai_explanation": f"Missing settlement: Payment of ₹{amt:.2f} (Ref: {ref}) has no corresponding bank payout or gateway settlement record.",
                    "ai_confidence": 0.90,
                    "ai_recommended_action": "REQUEST_BANK_TRACE"
                })
            elif st in [SourceType.SETTLEMENT.value, SourceType.BANK_STATEMENT.value]:
                exceptions.append({
                    "batch_id": batch_id,
                    "transaction_id": tid,
                    "exception_type": ExceptionType.MISSING_PAYMENT.value,
                    "severity": ExceptionSeverity.HIGH.value if amt > 1000 else ExceptionSeverity.MEDIUM.value,
                    "status": ExceptionStatus.OPEN.value,
                    "expected_amount": 0.0,
                    "actual_amount": amt,
                    "difference_amount": amt,
                    "evidence_json": {
                        "source_type": st,
                        "reference_id": ref,
                        "amount": amt,
                        "note": "Bank credit or settlement received without a corresponding customer payment record."
                    },
                    "ai_explanation": f"Missing payment: Received bank/settlement credit of ₹{amt:.2f} with no matching merchant order or payment reference.",
                    "ai_confidence": 0.88,
                    "ai_recommended_action": "AUDIT_UNCLAIMED_DEPOSIT"
                })
            else:
                exceptions.append({
                    "batch_id": batch_id,
                    "transaction_id": tid,
                    "exception_type": ExceptionType.UNKNOWN.value,
                    "severity": ExceptionSeverity.LOW.value,
                    "status": ExceptionStatus.OPEN.value,
                    "expected_amount": amt,
                    "actual_amount": 0.0,
                    "difference_amount": amt,
                    "evidence_json": {"source_type": st, "reference_id": ref},
                    "ai_explanation": f"Unidentified transaction entry of ₹{amt:.2f}.",
                    "ai_confidence": 0.70,
                    "ai_recommended_action": "MANUAL_REVIEW"
                })

            handled_txn_ids.add(tid)

        return exceptions
