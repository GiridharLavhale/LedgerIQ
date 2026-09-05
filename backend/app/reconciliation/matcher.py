"""
4-Tier Hierarchical Deterministic Reconciliation Engine
"""
from typing import List, Dict, Any, Tuple, Set, Optional
from datetime import datetime
from app.models.transaction import Transaction, SourceType, TransactionStatus
from app.models.match import ReconciliationMatch, MatchStrategy, MatchStatus
from app.reconciliation.scoring import (
    calculate_string_similarity,
    calculate_date_difference,
    calculate_amount_similarity
)
from app.reconciliation.verifier import verify_settlement_decomposition, round_curr


class MatchResult:
    def __init__(
        self,
        primary_txn_id: str,
        matched_txn_id: str,
        strategy: MatchStrategy,
        confidence: float,
        status: MatchStatus,
        amount_difference: float,
        date_difference_days: int,
        calculated_fee: float,
        calculated_tax: float,
        evidence_summary: str
    ):
        self.primary_txn_id = primary_txn_id
        self.matched_txn_id = matched_txn_id
        self.strategy = strategy
        self.confidence = confidence
        self.status = status
        self.amount_difference = amount_difference
        self.date_difference_days = date_difference_days
        self.calculated_fee = calculated_fee
        self.calculated_tax = calculated_tax
        self.evidence_summary = evidence_summary


class ReconciliationEngine:
    """
    4-Tier Deterministic Waterfall Matching Engine:
    Level 1: Exact Gateway / Reference ID
    Level 2: Strict Composite (Reference + Amount + Currency + Strict Date)
    Level 3: Fuzzy Proximity (Fuzzy Reference + Date Proximity Window)
    Level 4: Settlement-Aware Fee/Tax Decomposition (Payment - Fee - Tax = Settlement)
    """

    def __init__(
        self,
        fee_rate: float = 0.02,
        gst_rate: float = 0.18,
        date_tolerance_days: int = 3,
        amount_tolerance: float = 0.05
    ):
        self.fee_rate = fee_rate
        self.gst_rate = gst_rate
        self.date_tolerance_days = date_tolerance_days
        self.amount_tolerance = amount_tolerance

    def execute_reconciliation(
        self,
        transactions: List[Dict[str, Any]]
    ) -> Tuple[List[MatchResult], Set[str], List[Dict[str, Any]]]:
        """
        Executes 4-tier waterfall matching on a list of canonical transactions.
        Returns:
            - matches: List of verified MatchResult objects
            - matched_txn_ids: Set of transaction IDs matched in the process
            - unresolved: List of unmatched transactions for exception evaluation
        """
        # Separate primary transactions (Payments, Invoices) from counterpart records (Settlements, Bank Statements)
        primary_txns: List[Dict[str, Any]] = []
        counterpart_txns: List[Dict[str, Any]] = []

        for txn in transactions:
            st = str(txn.get("source_type", "")).upper()
            if st in [SourceType.PAYMENT.value, SourceType.INVOICE.value]:
                primary_txns.append(txn)
            else:
                counterpart_txns.append(txn)

        # If all records belong to the same source type, divide into candidate pairs
        if not counterpart_txns and len(primary_txns) > 1:
            mid = len(primary_txns) // 2
            counterpart_txns = primary_txns[mid:]
            primary_txns = primary_txns[:mid]
        elif not primary_txns and counterpart_txns:
            mid = len(counterpart_txns) // 2
            primary_txns = counterpart_txns[:mid]
            counterpart_txns = counterpart_txns[mid:]

        matches: List[MatchResult] = []
        matched_primary_ids: Set[str] = set()
        matched_counterpart_ids: Set[str] = set()

        # Build lookup indices for fast O(1) matching
        cp_by_ext_id: Dict[str, Dict[str, Any]] = {}
        cp_by_ref_id: Dict[str, Dict[str, Any]] = {}

        for cp in counterpart_txns:
            cid = cp["id"]
            if cp.get("external_id"):
                cp_by_ext_id[str(cp["external_id"]).strip().upper()] = cp
            if cp.get("reference_id"):
                cp_by_ref_id[str(cp["reference_id"]).strip().upper()] = cp

        # -------------------------------------------------------------
        # PASS 1: Level 1 - Exact Gateway Transaction ID Match (100%)
        # -------------------------------------------------------------
        for p in primary_txns:
            pid = p["id"]
            if pid in matched_primary_ids:
                continue

            p_ext = str(p.get("external_id") or "").strip().upper()

            matched_cp = None
            if p_ext and p_ext in cp_by_ext_id:
                candidate = cp_by_ext_id[p_ext]
                if candidate["id"] not in matched_counterpart_ids:
                    matched_cp = candidate

            if matched_cp:
                cid = matched_cp["id"]
                p_amt = float(p["amount"])
                c_amt = float(matched_cp["amount"])
                diff = round_curr(abs(p_amt - c_amt))
                days = calculate_date_difference(p["transaction_date"], matched_cp["transaction_date"])

                matches.append(MatchResult(
                    primary_txn_id=pid,
                    matched_txn_id=cid,
                    strategy=MatchStrategy.EXACT_ID,
                    confidence=1.0,
                    status=MatchStatus.MATCHED,
                    amount_difference=diff,
                    date_difference_days=days,
                    calculated_fee=0.0,
                    calculated_tax=0.0,
                    evidence_summary=f"Level 1: Exact identifier match on gateway transaction ID '{p_ext}'. Amount difference: ₹{diff:.2f}, Date difference: {days} day(s)."
                ))
                matched_primary_ids.add(pid)
                matched_counterpart_ids.add(cid)

        # -------------------------------------------------------------
        # PASS 2: Level 2 - Composite Strict Match (Confidence = 98%)
        # Ref + Exact Amount + Same Currency + Date Delta <= 1
        # -------------------------------------------------------------
        for p in primary_txns:
            pid = p["id"]
            if pid in matched_primary_ids:
                continue

            p_ref = str(p.get("reference_id") or "").strip().upper()
            p_amt = float(p["amount"])
            p_curr = str(p.get("currency", "INR")).upper()

            for cp in counterpart_txns:
                cid = cp["id"]
                if cid in matched_counterpart_ids:
                    continue

                c_ref = str(cp.get("reference_id") or "").strip().upper()
                c_amt = float(cp["amount"])
                c_curr = str(cp.get("currency", "INR")).upper()

                if p_ref and c_ref and p_ref == c_ref and p_curr == c_curr:
                    diff = round_curr(abs(p_amt - c_amt))
                    days = calculate_date_difference(p["transaction_date"], cp["transaction_date"])
                    if diff <= self.amount_tolerance and days <= 1:
                        matches.append(MatchResult(
                            primary_txn_id=pid,
                            matched_txn_id=cid,
                            strategy=MatchStrategy.STRICT_COMPOSITE,
                            confidence=0.98,
                            status=MatchStatus.MATCHED,
                            amount_difference=diff,
                            date_difference_days=days,
                            calculated_fee=0.0,
                            calculated_tax=0.0,
                            evidence_summary=f"Level 2: Strict composite match on reference '{p_ref}', amount ₹{p_amt:.2f} and currency {p_curr}. Date difference: {days} day(s)."
                        ))
                        matched_primary_ids.add(pid)
                        matched_counterpart_ids.add(cid)
                        break

        # -------------------------------------------------------------
        # PASS 3: Level 3 - Fuzzy Reference & Date Proximity (75% - 90%)
        # -------------------------------------------------------------
        for p in primary_txns:
            pid = p["id"]
            if pid in matched_primary_ids:
                continue

            p_ref = str(p.get("reference_id") or "").strip()
            p_amt = float(p["amount"])

            best_match = None
            best_score = 0.0

            for cp in counterpart_txns:
                cid = cp["id"]
                if cid in matched_counterpart_ids:
                    continue

                c_ref = str(cp.get("reference_id") or "").strip()
                c_amt = float(cp["amount"])

                sim_ratio = calculate_string_similarity(p_ref, c_ref)
                diff = abs(p_amt - c_amt)
                days = calculate_date_difference(p["transaction_date"], cp["transaction_date"])

                if sim_ratio >= 0.78 and diff <= self.amount_tolerance and days <= self.date_tolerance_days:
                    composite_score = (sim_ratio * 0.6) + (max(0, 1.0 - (days / 10.0)) * 0.4)
                    if composite_score > best_score and composite_score >= 0.75:
                        best_score = composite_score
                        best_match = (cp, diff, days, sim_ratio)

            if best_match:
                cp, diff, days, sim_ratio = best_match
                cid = cp["id"]
                c_ref = str(cp.get("reference_id") or "").strip()
                confidence = round(min(0.92, best_score), 2)
                matches.append(MatchResult(
                    primary_txn_id=pid,
                    matched_txn_id=cid,
                    strategy=MatchStrategy.FUZZY_PROXIMITY,
                    confidence=confidence,
                    status=MatchStatus.LIKELY_MATCH if confidence >= 0.85 else MatchStatus.PARTIAL_MATCH,
                    amount_difference=round_curr(diff),
                    date_difference_days=days,
                    calculated_fee=0.0,
                    calculated_tax=0.0,
                    evidence_summary=f"Level 3: Fuzzy reference match between '{p_ref}' and '{c_ref}' ({sim_ratio*100:.1f}% similarity). Amount: ₹{p_amt:.2f}, Date difference: {days} day(s)."
                ))
                matched_primary_ids.add(pid)
                matched_counterpart_ids.add(cid)

        # -------------------------------------------------------------
        # PASS 4: Level 4 - Settlement-Aware Fee/Tax Match (Confidence = 95%)
        # Formula: Net Settlement = Payment Gross - MDR Fee - GST Tax
        # e.g., 10000 - 200 - 36 = 9764
        # -------------------------------------------------------------
        for p in primary_txns:
            pid = p["id"]
            if pid in matched_primary_ids:
                continue

            p_amt = float(p["amount"])
            p_ref = str(p.get("reference_id") or "").strip().upper()
            p_ext = str(p.get("external_id") or "").strip().upper()

            for cp in counterpart_txns:
                cid = cp["id"]
                if cid in matched_counterpart_ids:
                    continue

                c_amt = float(cp["amount"])
                c_net = float(cp.get("net_amount", c_amt))
                c_ref = str(cp.get("reference_id") or "").strip().upper()
                c_ext = str(cp.get("external_id") or "").strip().upper()

                # Check if references align (exact or fuzzy)
                ref_match = (p_ref and c_ref and p_ref == c_ref) or (p_ext and c_ext and p_ext == c_ext) or (calculate_string_similarity(p_ref, c_ref) >= 0.75)
                days = calculate_date_difference(p["transaction_date"], cp["transaction_date"])

                if ref_match and days <= (self.date_tolerance_days + 4):
                    # Verify mathematical fee/tax decomposition against actual counterpart amount
                    is_valid, exp_fee, exp_tax, exp_net, diff = verify_settlement_decomposition(
                        gross_amount=p_amt,
                        actual_net=c_amt,
                        fee_rate=self.fee_rate,
                        gst_rate=self.gst_rate,
                        tolerance=self.amount_tolerance
                    )
                    if is_valid:
                        matches.append(MatchResult(
                            primary_txn_id=pid,
                            matched_txn_id=cid,
                            strategy=MatchStrategy.SETTLEMENT_FEE_AWARE,
                            confidence=0.95,
                            status=MatchStatus.MATCHED,
                            amount_difference=diff,
                            date_difference_days=days,
                            calculated_fee=exp_fee,
                            calculated_tax=exp_tax,
                            evidence_summary=(
                                f"Level 4: Settlement-aware match. Gross Payment ₹{p_amt:.2f} decomposed into "
                                f"MDR Fee ₹{exp_fee:.2f} ({(self.fee_rate*100):.1f}%) + GST ₹{exp_tax:.2f} ({(self.gst_rate*100):.0f}%), "
                                f"matching Net Settlement payout of ₹{c_amt:.2f} exactly. Date delta: {days} day(s)."
                            )
                        ))
                        matched_primary_ids.add(pid)
                        matched_counterpart_ids.add(cid)
                        break

        # Collect all unmatched records
        all_matched_ids = matched_primary_ids.union(matched_counterpart_ids)
        unresolved = [t for t in transactions if t["id"] not in all_matched_ids]

        return matches, all_matched_ids, unresolved
