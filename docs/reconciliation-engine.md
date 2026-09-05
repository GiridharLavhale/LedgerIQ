# Reconciliation Engine Architecture & Algorithmic Hierarchy — LedgerIQ

**Subsystem:** Core Deterministic Financial Engine  
**Author:** Principal Fintech Systems Architect

---

## 1. Design Philosophy

In modern fintech platforms, **the reconciliation engine must be 100% deterministic, idempotent, and explainable**.
- **No LLM in the loop for calculations**: The reconciliation engine uses discrete mathematical algorithms, exact relational joins, fuzzy distance heuristics, and tax/fee accounting schedules.
- **Auditability**: Every match produces an exact strategy label, numeric confidence score, day delta, amount delta, and human-readable evidence summary.

---

## 2. The 4-Tier Matching Hierarchy

```
                      +-----------------------------+
                      |   Ingested Transaction Pool |
                      +--------------+--------------+
                                     |
                                     v
                 +---------------------------------------+
                 | PASS 1: Level 1 - Exact ID Match     |
                 | - Exact external_id or reference_id   |
                 | - Confidence = 100%                   |
                 +-------------------+-------------------+
                                     | (Unmatched Records)
                                     v
                 +---------------------------------------+
                 | PASS 2: Level 2 - Composite Strict    |
                 | - Same Ref + Amount + Date + Currency |
                 | - Confidence = 98%                    |
                 +-------------------+-------------------+
                                     | (Unmatched Records)
                                     v
                 +---------------------------------------+
                 | PASS 3: Level 3 - Fuzzy Reference     |
                 | - Levenshtein >= 0.85 / Substring     |
                 | - Date Window (+/- 3 days)            |
                 | - Confidence = 75% - 90%              |
                 +-------------------+-------------------+
                                     | (Unmatched Records)
                                     v
                 +---------------------------------------+
                 | PASS 4: Level 4 - Settlement Fee/Tax  |
                 | - Net = Gross - MDR Fee - GST Tax     |
                 | - Confidence = 95%                    |
                 +-------------------+-------------------+
                                     |
                                     v
                      +-----------------------------+
                      | Exceptions & Discrepancies  |
                      | (Classified into 10 types)  |
                      +-----------------------------+
```

---

## 3. Mathematical Specifications for Level 4 Settlement-Aware Matching

When payments pass through a payment gateway (e.g. Razorpay), the gross transaction amount is debited from the customer, but the merchant receives a net payout after deduction of Merchant Discount Rate (MDR) and Goods & Services Tax (GST):

$$\text{Net Settlement} = \text{Gross Payment} - \text{MDR Fee} - \text{GST Tax}$$

Where:
$$\text{MDR Fee} = \text{Gross Payment} \times r_{\text{MDR}}$$
$$\text{GST Tax} = \text{MDR Fee} \times r_{\text{GST}}$$

For standard Indian payments:
- Standard MDR ($r_{\text{MDR}}$): $2.0\%$ ($0.02$)
- Standard GST on MDR ($r_{\text{GST}}$): $18.0\%$ ($0.18$)
- Effective Total Deduction: $2.0\% \times (1 + 0.18) = 2.36\%$

### Example:
- **Gross Payment:** ₹10,000.00
- **MDR Fee (2%):** ₹200.00
- **GST on Fee (18%):** ₹36.00
- **Expected Net Settlement:** $10000 - 200 - 36 = \text{₹}9,764.00$

If a bank statement or gateway settlement record of ₹9,764.00 is discovered matching the date and reference of the ₹10,000.00 payment, the engine correctly tags it as `MATCHED` under `SETTLEMENT_FEE_AWARE` with zero false-alarm variance.

---

## 4. Exception Engine Taxonomy (10 Categories)

| Exception Code | Definition | Severity | Automated Action |
|---|---|---|---|
| `AMOUNT_MISMATCH` | Reference IDs match, but amounts differ beyond fee/tax schedules | HIGH | Flag for review, calculate net discrepancy |
| `MISSING_SETTLEMENT` | Payment recorded in gateway/OMS, but no corresponding settlement after $T+3$ days | HIGH | Query acquiring bank settlement batch |
| `MISSING_PAYMENT` | Bank settlement received without a matching initial payment event | HIGH | Audit orphan settlement record |
| `DUPLICATE_TRANSACTION` | Multiple payments or bank entries sharing identical reference and amount | CRITICAL | Halt automatic capture, alert finance team |
| `DATE_MISMATCH` | Record matched on ID and amount but exceeds allowed settlement window ($>7$ days) | MEDIUM | Flag for timing delay verification |
| `REFERENCE_MISMATCH` | Bank narrative contains truncated reference requiring fuzzy confidence check | LOW | Suggest human confirmation |
| `FEE_DISCREPANCY` | Gateway deducted MDR differing from merchant contract rate | MEDIUM | Generate fee overcharge claim |
| `TAX_DISCREPANCY` | GST applied on fee does not match 18% statutory schedule | MEDIUM | Flag for tax reporting adjustment |
| `PARTIAL_SETTLEMENT` | Settlement amount is a fraction of gross payment (e.g. split payouts) | MEDIUM | Link partial match, keep remainder open |
| `UNKNOWN` | Unmatched orphan entry with unparseable metadata | LOW | Assign to Tier-1 analyst |

---

## 5. Performance Targets & Complexity

- **Algorithm Complexity:** $O(N \log N)$ total time across all 4 passes using indexed hash tables and sorted date-range windows.
- **Throughput:** Ingests and reconciles 1,000 transactions in $< 1.5\text{ seconds}$ on standard single-core execution.
- **Memory Footprint:** $< 100\text{ MB}$ memory for 10,000 in-flight records.
