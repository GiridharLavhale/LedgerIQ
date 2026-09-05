# REST API Specification — LedgerIQ

**Base URL:** `/api/v1`  
**Protocol:** REST / JSON (Multipart for uploads)  
**Authentication:** HTTP Bearer Header (`Authorization: Bearer <jwt_token>`)

---

## 1. Authentication & Users

### `POST /auth/register`
Creates a new organization and root admin user.
- **Request Body:** `{ email, password, full_name, org_name }`
- **Response:** `{ token_type, access_token, refresh_token, user }`

### `POST /auth/login`
Authenticates user and issues JWT tokens.
- **Request Body:** `{ email, password }`
- **Response:** `{ token_type, access_token, refresh_token, user }`

### `GET /auth/me`
Returns the profile and role of the authenticated user.

### `GET /users`
List users in the organization (Requires `ADMIN` or `FINANCE_MANAGER`).

---

## 2. Ingestion & Reconciliation Batches

### `POST /uploads`
Uploads tabular transaction files (`.csv`, `.xlsx`, `.json`) and performs validation and schema normalization preview.
- **Request:** `multipart/form-data` with `file`, `source_type` (`PAYMENT`, `SETTLEMENT`, `BANK_STATEMENT`, `INVOICE`).
- **Response:** `{ upload_id, filename, row_count, parsed_records, detected_mapping }`

### `POST /batches`
Creates a reconciliation batch and triggers deterministic matching.
- **Request Body:** `{ name, upload_ids, options: { tolerance_days, fee_rate, gst_rate } }`
- **Response:** `{ batch_id, status: "PROCESSING", total_records }`

### `GET /batches`
Lists reconciliation batches with pagination, summary counts, and match rates.

### `GET /batches/{id}`
Returns granular batch details including metrics, duration, match rate, and summary totals.

### `GET /batches/{id}/progress`
Real-time progress polling endpoint returning `{ records_processed, total_records, percent, status }`.

---

## 3. Transactions & Matches

### `GET /transactions`
Queries canonical financial transactions.
- **Query Params:** `batch_id`, `source_type`, `status`, `search`, `page`, `page_size`.

### `GET /transactions/{id}`
Returns full record details with linked matching record or exception.

### `GET /matches`
Queries successful and partial matches with confidence scores and evidence strings.

---

## 4. Exceptions & Resolution Center

### `GET /exceptions`
Lists detected exceptions.
- **Query Params:** `batch_id`, `status` (`OPEN`, `INVESTIGATING`, `RESOLVED`), `type`, `severity`, `page`.

### `GET /exceptions/{id}`
Returns complete 4-pane comparative ledger for an exception along with AI root-cause analysis.

### `POST /exceptions/{id}/actions`
Executes an audit-logged resolution action on an exception.
- **Request Body:** `{ action: "APPROVE_MATCH" | "REJECT_MATCH" | "RESOLVE" | "ASSIGN" | "COMMENT", notes, target_user_id }`
- **Response:** `{ success: true, exception_id, new_status }`

### `POST /exceptions/{id}/analyze`
Triggers on-demand AI exception investigation for root-cause reasoning.

---

## 5. Finance Copilot

### `POST /copilot/chat`
Conversational endpoint for grounded FinOps queries.
- **Request Body:** `{ message: string, history: list, batch_id?: string }`
- **Response:** `{ reply: string, citations: list, evidence: list, tools_called: list }`

---

## 6. Evaluation & Benchmarking

### `POST /evaluations/run`
Generates a deterministic synthetic dataset of specified size (50, 100, 500, 1000) and executes reconciliation against ground truth.
- **Request Body:** `{ size: 100, seed: 42, noise_level: 0.1 }`
- **Response:** `{ run_id, total_records, ground_truth_matches, predicted_matches, precision, recall, f1_score, match_rate, exception_rate, execution_time_ms, throughput_rps }`

### `GET /evaluations/history`
Returns historical benchmark runs and accuracy trends.

---

## 7. Reports

### `GET /reports/reconciliation/{batch_id}?format=csv|xlsx|json`
Generates and downloads formal reconciliation summary report.

### `GET /reports/exceptions/{batch_id}?format=csv|xlsx|json`
Exports detailed exception log with AI explanations and audit statuses.

---

## 8. Audit Logs & System Health

### `GET /audit-logs`
Filterable audit trail of all financial mutations.

### `GET /health`
Liveness check returning `{ status: "ok", timestamp }`.

### `GET /health/ready`
Readiness check validating database connection, Redis availability, and AI provider reachability.
