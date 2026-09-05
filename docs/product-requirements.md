# Product Requirements Document (PRD) — LedgerIQ

**Product Name:** LedgerIQ  
**Tagline:** Reconcile faster. Explain every rupee. Resolve exceptions with confidence.  
**Track:** Razorpay AI Buildathon — Track 04: AI Finance Controller  
**Version:** 1.0.0 (Production Architecture)

---

## 1. Problem Statement

Financial operations teams in modern digital businesses process millions of transactions across payment gateways (Razorpay, Stripe), acquiring banks (HDFC, ICICI, Axis), order management systems (Shopify, Magento, Custom OMS), and ERP ledgers (SAP, NetSuite, Tally). 

Reconciling these distributed ledgers presents major bottlenecks:
1. **Schema and Header Divergence:** Gateways output `transaction_id`, `payment_id`, `ref_no`, `gross_amount`, whereas bank feeds output `UTR`, `Narrative`, `Credit`, `Debit`.
2. **Hidden Deductions and Fee Structures:** A gross payment of ₹10,000 settles as ₹9,764 after 2% Gateway MDR (₹200) + 18% GST on MDR (₹36). Naive reconcilers flag this as an amount mismatch.
3. **Timing & Settlement Delays (T+1 / T+2):** Transactions occur on Day 0, but batch settlement arrives on Day 2 with consolidated UTRs.
4. **Opaque AI "Hallucinations":** Generic LLM bots invent numbers or hallucinate balance reconciliations, which is catastrophic for finance audits.
5. **Slow Manual Exception Triage:** Finance analysts manually download spreadsheets to investigate missing payments, partial settlements, and duplicate charges.

---

## 2. Product Objectives & Target Metrics

LedgerIQ delivers an end-to-end autonomous and human-in-the-loop finance-operations loop with:
- **Zero-Hallucination Math:** 100% deterministic matching, fee/tax verification, and discrepancy calculation.
- **Explainable AI:** AI agents provide evidence-backed natural language explanations for every detected anomaly.
- **Repeatable 50–1,000+ Record Benchmarks:** Continuous accuracy, precision, and recall measurement against ground truth datasets.
- **Operational KPIs:**
  - Reconciliation throughput: > 500 records/sec on single worker
  - Deterministic Precision: > 99.5% on clean/fee-adjusted records
  - Exception resolution auditability: 100% immutable event logging

---

## 3. Core Functional Requirements

### 3.1 Data Ingestion & Schema Normalization
- Ingest heterogeneous tabular formats: `.csv`, `.xlsx`, `.xls`, `.json`.
- Normalize multi-source schemas into a standard canonical financial model:
  - Canonical fields: `record_id`, `source_type` (PAYMENT, SETTLEMENT, BANK_STATEMENT, INVOICE, FEE, TAX, REFUND), `transaction_id`, `reference_id`, `order_id`, `amount`, `fee`, `tax`, `net_amount`, `currency`, `timestamp`, `status`, `counterparty`, `metadata`.
- Strict format validation, currency consistency checks, and idempotent upload deduplication.

### 3.2 4-Tier Reconciliation Hierarchy
- **Level 1 (Exact Match):** Exact string match on Transaction ID / Gateway Reference ID ($100\%$ confidence).
- **Level 2 (Composite Strict Match):** Composite match on Reference ID + Currency + Exact Amount + Date ($95\%-99\%$ confidence).
- **Level 3 (Fuzzy Proximity Match):** Normalized reference matching (Levenshtein distance $\ge 0.85$ or common prefixes) + Date Proximity Window (within $\pm 3$ days) + Amount tolerance ($70\%-90\%$ confidence).
- **Level 4 (Settlement-Aware Fee/Tax Match):** Decomposes net settlement vs gross payment:
  $$\text{Net Settlement} = \text{Gross Payment} - \text{MDR Fee} - \text{GST Tax}$$
  Validates standard MDR schedules (e.g. 2% + 18% GST = 2.36% total deduction).

### 3.3 Exception Engine
- Classifies unresolved and anomalous records into 10 explicit categories:
  1. `AMOUNT_MISMATCH`
  2. `MISSING_SETTLEMENT`
  3. `MISSING_PAYMENT`
  4. `DUPLICATE_TRANSACTION`
  5. `DATE_MISMATCH`
  6. `REFERENCE_MISMATCH`
  7. `FEE_DISCREPANCY`
  8. `TAX_DISCREPANCY`
  9. `PARTIAL_SETTLEMENT`
  10. `UNKNOWN`
- Full exception lifecycle: `OPEN` $\rightarrow$ `UNDER_INVESTIGATION` $\rightarrow$ `APPROVED_MATCH` / `REJECTED_MATCH` $\rightarrow$ `RESOLVED`.
- Human actions: Approve Match, Reject Match, Re-run AI Analysis, Assign Analyst, Add Audit Note.

### 3.4 Agentic AI Finance Controller
- **Provider-Agnostic LLM Layer:** Pluggable backends (Google Gemini, Groq, OpenRouter, Local Ollama, LiteLLM).
- **Controlled Read-Only Tools:** Agents query the database via strict read-only APIs:
  - `get_reconciliation_summary`
  - `get_transaction`
  - `search_transactions`
  - `get_exception`
  - `search_exceptions`
  - `get_settlement`
  - `calculate_discrepancy`
  - `get_batch_metrics`
  - `get_financial_summary`
- **Agent Roles:**
  1. **Reconciliation Agent:** Executive health analysis & variance breakdown.
  2. **Exception Investigator Agent:** Deep comparative side-by-side evidence analysis.
  3. **Finance Copilot Agent:** Conversational assistant answering grounded natural language queries with citations.
  4. **Report Agent:** Generates audit-ready variance and compliance reports.

### 3.5 Evaluation & Benchmarking Suite
- Built-in synthetic dataset generator for 50, 100, 500, and 1,000 records.
- Realistic scenarios: clean matches, fee deductions, tax deductions, delayed settlements, missing records, duplicates, partial settlements, amount/date/reference anomalies, refunds.
- Ground truth metadata embedded for automated calculation of:
  - Total Records, Matched Records, Unmatched Records, Exception Records
  - Match Rate %, Exception Rate %, Resolution Rate %
  - Precision, Recall, F1 Score
  - Processing Time (ms) & Throughput (records/sec).

### 3.6 Enterprise Security, RBAC & Audit Trail
- Authentication: JWT access tokens + refresh tokens, bcrypt password hashing.
- Role-Based Access Control:
  - `ADMIN`: Full system management, user management, API keys, batch deletion.
  - `FINANCE_MANAGER`: Batch creation, exception resolution, report approval, settings.
  - `FINANCE_ANALYST`: Batch creation, exception investigation, notes, manual matching.
  - `VIEWER`: Read-only dashboard, batch inspection, reports download.
- Immutable audit log recording user, action, entity, entity ID, previous state, new state, timestamp, and IP/request ID.

---

## 4. User Personas

| Persona | Role | Primary Goals | Key LedgerIQ Features |
|---|---|---|---|
| **Priya S.** | VP of Finance / CFO | High-level cash visibility, unreconciled liability tracking, audit sign-off | Dashboard KPIs, Executive Reports, Variance Analytics |
| **Rahul M.** | FinOps Manager | Daily settlement clearance, exception triage, team delegation | Exception Queue, Batch Inspector, Copilot Q&A |
| **Ananya K.** | Senior Finance Analyst | Investigating complex discrepancies, fee/tax audits, resolving anomalies | 4-Pane Comparative Ledger, AI Root-Cause Engine, Audit Trail |
| **Vikram R.** | Internal Auditor / Compliance | Proving zero variance, verifying calculation methodology, export trails | Audit Logs, Evaluation Benchmarks, PDF/Excel Exports |
