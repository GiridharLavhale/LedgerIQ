# Database Design & Schema Specification — LedgerIQ

**Engine:** PostgreSQL 18 (with SQLite 3 developer fallback)  
**ORM:** SQLAlchemy 2.0 (Declarative Base, Mapped Types)  
**Migration Engine:** Alembic

---

## 1. Entity-Relationship Diagram (Conceptual)

```
[organizations]
       | 1:N
[users] ──────< [audit_logs]
       | 1:N
[reconciliation_batches] ──────< [uploads]
       | 1:N
[transactions] ───────────────┬───────────────< [reconciliation_matches]
  (Payments, Settlements,    │
   Bank Txns, Invoices)       └───────────────< [exceptions]
                                                      | 1:N
                                              [exception_actions]
                                                      |
                                              [ai_decisions]
```

---

## 2. Core Tables & Field Definitions

### 2.1 `organizations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `name` | VARCHAR(255) | NOT NULL | Organization name |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe slug |
| `settings` | JSONB / TEXT | DEFAULT '{}' | Custom business rules & MDR defaults |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Creation timestamp |

### 2.2 `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `org_id` | VARCHAR(36) | FOREIGN KEY (organizations.id) | Tenant association |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Login email |
| `hashed_password` | VARCHAR(255) | NOT NULL | Bcrypt hashed secret |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'FINANCE_ANALYST' | `ADMIN`, `FINANCE_MANAGER`, `FINANCE_ANALYST`, `VIEWER` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Creation timestamp |

### 2.3 `reconciliation_batches`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID batch identifier |
| `org_id` | VARCHAR(36) | FOREIGN KEY (organizations.id) | Tenant association |
| `name` | VARCHAR(255) | NOT NULL | Human-readable batch title |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `total_records` | INTEGER | NOT NULL, DEFAULT 0 | Count of ingested records |
| `matched_records` | INTEGER | NOT NULL, DEFAULT 0 | Successfully matched count |
| `unmatched_records` | INTEGER | NOT NULL, DEFAULT 0 | Unmatched records count |
| `exception_records` | INTEGER | NOT NULL, DEFAULT 0 | Flagged exceptions count |
| `match_rate` | FLOAT | NOT NULL, DEFAULT 0.0 | Percentage (0.0 to 100.0) |
| `exception_rate` | FLOAT | NOT NULL, DEFAULT 0.0 | Percentage (0.0 to 100.0) |
| `total_volume` | NUMERIC(14, 2) | NOT NULL, DEFAULT 0.0 | Total gross monetary value |
| `discrepancy_amount`| NUMERIC(14, 2) | NOT NULL, DEFAULT 0.0 | Total financial variance |
| `processing_time_ms`| INTEGER | NOT NULL, DEFAULT 0 | Execution duration in ms |
| `throughput_rps` | FLOAT | NOT NULL, DEFAULT 0.0 | Records processed per second |
| `metadata_json` | JSONB / TEXT | DEFAULT '{}' | Ingestion details & data sources |
| `created_by` | VARCHAR(36) | FOREIGN KEY (users.id) | Initiator user ID |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Batch start timestamp |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Completion timestamp |

### 2.4 `transactions` (Canonical Financial Ledger)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Internal UUID |
| `batch_id` | VARCHAR(36) | FOREIGN KEY (reconciliation_batches.id), INDEX | Ingested batch |
| `source_type` | VARCHAR(50) | NOT NULL, INDEX | `PAYMENT`, `SETTLEMENT`, `BANK_STATEMENT`, `INVOICE`, `FEE`, `TAX`, `REFUND` |
| `source_name` | VARCHAR(100) | NOT NULL | Source name (e.g. 'Razorpay Gateway', 'HDFC Bank') |
| `external_id` | VARCHAR(255) | INDEX | Provider ID (e.g. `pay_N8yX1...`, `UTR98412...`) |
| `reference_id` | VARCHAR(255) | INDEX | Business / Order Reference |
| `order_id` | VARCHAR(255) | INDEX | Order reference identifier |
| `amount` | NUMERIC(14, 2) | NOT NULL | Transaction gross value |
| `fee` | NUMERIC(14, 2) | NOT NULL, DEFAULT 0.0 | Deducted fee |
| `tax` | NUMERIC(14, 2) | NOT NULL, DEFAULT 0.0 | Deducted tax (e.g. GST) |
| `net_amount` | NUMERIC(14, 2) | NOT NULL | Net received/settled value |
| `currency` | VARCHAR(10) | NOT NULL, DEFAULT 'INR' | 3-letter currency code |
| `transaction_date` | TIMESTAMP WITH TIME ZONE | NOT NULL, INDEX | Date of financial event |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'UNRECONCILED' | `UNRECONCILED`, `MATCHED`, `EXCEPTION`, `MANUAL_RESOLVED` |
| `counterparty` | VARCHAR(255) | NULL | Payer or payee name |
| `raw_data` | JSONB / TEXT | DEFAULT '{}' | Original un-normalized JSON record |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Ingestion timestamp |

### 2.5 `reconciliation_matches`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `batch_id` | VARCHAR(36) | FOREIGN KEY (reconciliation_batches.id), INDEX | Associated batch |
| `primary_txn_id` | VARCHAR(36) | FOREIGN KEY (transactions.id), INDEX | Primary record (e.g. Payment) |
| `matched_txn_id` | VARCHAR(36) | FOREIGN KEY (transactions.id), INDEX | Counterpart record (e.g. Settlement / Bank) |
| `strategy` | VARCHAR(50) | NOT NULL | `EXACT_ID`, `STRICT_COMPOSITE`, `FUZZY_PROXIMITY`, `SETTLEMENT_FEE_AWARE` |
| `confidence` | FLOAT | NOT NULL | Deterministic score (0.0 to 1.0) |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'MATCHED' | `MATCHED`, `LIKELY_MATCH`, `PARTIAL_MATCH`, `MANUAL_OVERRIDE` |
| `amount_difference` | NUMERIC(14, 2) | NOT NULL, DEFAULT 0.0 | Discrepancy between records |
| `date_difference_days` | INTEGER | NOT NULL, DEFAULT 0 | Day delta between records |
| `evidence_summary` | TEXT | NOT NULL | Human-readable verification proof |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Match timestamp |

### 2.6 `exceptions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `batch_id` | VARCHAR(36) | FOREIGN KEY (reconciliation_batches.id), INDEX | Associated batch |
| `transaction_id` | VARCHAR(36) | FOREIGN KEY (transactions.id), INDEX | Problematic transaction |
| `exception_type` | VARCHAR(50) | NOT NULL, INDEX | `AMOUNT_MISMATCH`, `MISSING_SETTLEMENT`, `MISSING_PAYMENT`, `DUPLICATE_TRANSACTION`, `DATE_MISMATCH`, `REFERENCE_MISMATCH`, `FEE_DISCREPANCY`, `TAX_DISCREPANCY`, `PARTIAL_SETTLEMENT`, `UNKNOWN` |
| `severity` | VARCHAR(20) | NOT NULL, DEFAULT 'MEDIUM' | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'OPEN' | `OPEN`, `INVESTIGATING`, `RESOLVED`, `IGNORED` |
| `expected_amount` | NUMERIC(14, 2) | NOT NULL | Target financial value |
| `actual_amount` | NUMERIC(14, 2) | NOT NULL | Actual observed value |
| `difference_amount` | NUMERIC(14, 2) | NOT NULL | Absolute or signed delta |
| `evidence_json` | JSONB / TEXT | DEFAULT '{}' | Deterministic discrepancy evidence |
| `ai_explanation` | TEXT | NULL | Agent-generated root cause analysis |
| `ai_confidence` | FLOAT | NULL | Confidence in AI explanation |
| `ai_recommended_action` | VARCHAR(100) | NULL | Suggested resolution action |
| `assigned_to` | VARCHAR(36) | FOREIGN KEY (users.id), NULL | Assigned analyst |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last update |

### 2.7 `exception_actions` & `audit_logs`
- `exception_actions`: Stores analyst actions (`APPROVE_MATCH`, `REJECT_MATCH`, `RESOLVE`, `ASSIGN`, `COMMENT`) with actor ID, timestamp, and notes.
- `audit_logs`: Immutable compliance ledger tracking every financial modification.

---

## 3. Database Indexes Strategy

```sql
CREATE INDEX idx_transactions_batch_source ON transactions (batch_id, source_type);
CREATE INDEX idx_transactions_ext_id ON transactions (external_id);
CREATE INDEX idx_transactions_ref_id ON transactions (reference_id);
CREATE INDEX idx_exceptions_batch_status ON exceptions (batch_id, status);
CREATE INDEX idx_exceptions_type ON exceptions (exception_type);
CREATE INDEX idx_matches_batch ON reconciliation_matches (batch_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (target_entity, target_id);
```
