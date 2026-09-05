# Evaluation, Benchmarking & Ground Truth Methodology — LedgerIQ

**Subsystem:** Synthetic Dataset Generation & Accuracy Verification  
**Standard:** Deterministic Ground Truth Verification

---

## 1. Benchmarking Objectives

To establish confidence in financial operations, LedgerIQ provides a repeatable benchmarking harness. Instead of arbitrary demo datasets, LedgerIQ generates synthetic multi-source financial ledgers with mathematically verifiable ground truth mappings.

---

## 2. Synthetic Dataset Generation Parameters

The dataset generator (`app/services/dataset_generator.py`) supports configurable sizes:
- **50 Records:** Quick verification and unit validation.
- **100 Records:** Standard demo and end-to-end evaluation suite.
- **500 Records:** High-density batch stress test.
- **1,000+ Records:** Production throughput and memory efficiency benchmark.

### Generated Scenarios & Distributions
1. **Exact Matches ($40\%$):** Clean gateway payments matched against bank/settlement with exact IDs and amounts.
2. **Settlement Fee Deductions ($25\%$):** Gateway gross payment with 2.0% MDR + 18% GST ($2.36\%$ total) deducted in the bank settlement.
3. **Delayed Settlements ($10\%$):** Settlement arrives $T+1$ to $T+3$ days later with identical reference.
4. **Fuzzy Reference Discrepancies ($5\%$):** Truncated bank narrative with matching amount and date proximity.
5. **Missing Settlements / Payments ($10\%$):** Orphan records missing the corresponding ledger entry.
6. **Amount Mismatches ($5\%$):** Gateway payment vs settlement differing beyond fee schedule (e.g. chargeback or penalty).
7. **Duplicate Transactions ($3\%$):** Accidental double-capture sharing reference and amount.
8. **Partial Settlements ($2\%$):** Multi-tranche payout for a high-value order.

---

## 3. Evaluation Metrics & Formulas

```
                         Actual Matches    Actual Exceptions
Predicted Matches             TP                  FP
Predicted Exceptions          FN                  TN
```

- **Precision:**
  $$\text{Precision} = \frac{\text{True Matches (TP)}}{\text{True Matches (TP)} + \text{False Matches (FP)}}$$
- **Recall:**
  $$\text{Recall} = \frac{\text{True Matches (TP)}}{\text{True Matches (TP)} + \text{Missed Matches (FN)}}$$
- **F1 Score:**
  $$\text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
- **Match Rate:**
  $$\text{Match Rate} = \frac{\text{Total Matched Records}}{\text{Total Ingested Records}} \times 100\%$$
- **Exception Rate:**
  $$\text{Exception Rate} = \frac{\text{Total Flagged Exceptions}}{\text{Total Ingested Records}} \times 100\%$$
- **Throughput:**
  $$\text{Throughput (RPS)} = \frac{\text{Total Records}}{\text{Processing Time (seconds)}}$$
