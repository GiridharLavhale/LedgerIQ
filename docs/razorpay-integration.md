# LedgerIQ — Razorpay API Integration Specification

**Project:** LedgerIQ ⚖️⚡  
**Tagline:** *Reconcile faster. Explain every rupee. Resolve exceptions with confidence.*  
**Track:** Razorpay AI Buildathon — Track 04: AI Finance Controller  
**Version:** 1.0.0  

---

## 1. Executive Overview

LedgerIQ integrates directly with the official **Razorpay REST APIs** (`/v1/payments` and `/v1/settlements`) to ingest, normalize, and reconcile multi-source financial transactions.

The architecture strictly separates:
1. **Live Data Ingestion**: Pulling real payment captures and settlement payout records via Razorpay's REST endpoints.
2. **Paise-to-INR Normalization**: Converting native Razorpay denominations (paise, epoch seconds, gateway fees) into LedgerIQ's canonical data model.
3. **Deterministic Financial Verification**: Level 1 to Level 4 reconciliation (validating Gross Payment − 2% MDR − 18% GST = Net Settlement) calculated in pure Python/SQL without LLM hallucinations.
4. **Agentic AI Layer**: Explaining root causes, anomalies, and recommending operator actions grounded in real database records.

---

## 2. Integration Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Razorpay REST API v1                        │
│   GET /v1/payments            GET /v1/settlements           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP Basic Auth (Server-side only)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│       LedgerIQ Razorpay Connector (Async HTTPX)             │
│   - Timeouts, retries, rate-limit backoff                   │
│   - Secret masking & zero secret leakage in logs            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Raw JSON (Paise, Epoch timestamps)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Razorpay Data Normalizer                     │
│   - Denomination conversion: Paise → INR (Decimal)          │
│   - Timestamp conversion: Epoch seconds → ISO UTC DateTime  │
│   - Statutory decomposition: Gross, MDR Fee, GST Tax, Net   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Canonical Financial Records
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Deterministic Reconciliation Engine                │
│   - Level 1: Exact Transaction / Payment ID ($100\%$)       │
│   - Level 2: Composite Strict Reference + Date ($98\%$)     │
│   - Level 3: Normalized Fuzzy Proximity Match ($85\%$)      │
│   - Level 4: Statutory Settlement Fee/Tax Aware ($95\%$)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Verified Batches & Exceptions
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Autonomous AI Finance Controller                │
│   - Exception Investigation Agent (Root-cause proofs)       │
│   - Finance Copilot Agent (Grounded SQL queries & citations)│
│   - CFO Report Agent (Executive summary generation)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Two Operational Modes

LedgerIQ supports two clearly demarcated modes to satisfy both the Buildathon evaluation requirements and real-world fintech operations:

### Mode 1: Demo / Synthetic Mode (Default)
- **API Key Required:** **NONE (0 Keys)**
- **Purpose:** 1-Click offline evaluation, repeatable 100-record benchmark, deterministic testing, and judge review without needing external credentials.
- **Data Generator:** Deterministic synthetic dataset generator with embedded ground-truth labels for precision, recall, and throughput benchmarks.
- **Offline Simulation:** Available via **"Simulate Razorpay API Sync"** in Data Sources, testing the live Razorpay normalization pipeline without network calls.

### Mode 2: Razorpay Live / Test API Mode
- **API Key Required:** `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- **Purpose:** Ingests live or test-mode transactions from an active Razorpay merchant account.
- **Endpoints Used:**
  - `GET https://api.razorpay.com/v1/payments?count=50`
  - `GET https://api.razorpay.com/v1/settlements?count=20`
  - `GET https://api.razorpay.com/v1/payments/{payment_id}`
- **Trigger:** Accessible via the **Data Sources** screen (`/data-sources`) or `POST /api/v1/integrations/razorpay/sync`.

---

## 4. Environment Variables Configuration

Configure your Razorpay API keys in your root `.env` file:

```ini
# Razorpay API Credentials (Optional - for live/test sync, not required for Demo Mode)
RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
RAZORPAY_KEY_SECRET=YourKeySecretHere
```

### How to Obtain Razorpay Test Credentials:
1. Log into the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Toggle the switch at the top to **Test Mode**.
3. Navigate to **Account & Settings** > **API Keys**.
4. Click **Generate Key** to receive your `Key ID` (e.g., `rzp_test_...`) and `Key Secret`.
5. Paste them into your `.env` file.
6. Restart the backend server.

---

## 5. Security & Secret Protection Guarantees

1. **Backend-Only Secret Handling:**
   - The React frontend **NEVER** receives or knows `RAZORPAY_KEY_SECRET`.
   - All Razorpay communications route strictly through `backend/app/integrations/razorpay/client.py`.
2. **Key Masking:**
   - Public status endpoints (`GET /api/v1/integrations/razorpay/status`) only expose masked key identifiers (e.g., `rzp_test_12...34`).
3. **No Secrets in Logs or Code:**
   - Client loggers explicitly sanitize request headers to prevent Bearer/Basic credentials from printing to console or log files.
4. **Git Protection:**
   - Root `.gitignore` explicitly prevents `.env` and sensitive credential files from being tracked.

---

## 6. Data Normalization Reference

Razorpay's API denominated amounts in paise and uses epoch integers for timestamps. LedgerIQ normalizes these automatically:

| Razorpay Native Field | Type | Transformation | LedgerIQ Canonical Field | Canonical Type |
|---|---|---|---|---|
| `id` | String (`pay_...`) | Preserved verbatim | `external_id` | `VARCHAR(100)` |
| `order_id` | String (`order_...`) | Preserved verbatim | `reference_id` / `order_id` | `VARCHAR(100)` |
| `amount` | Integer (paise) | `round(amount / 100.0, 2)` | `amount` (Gross INR) | `DECIMAL(15,2)` |
| `fee` | Integer (paise) | `round(fee / 100.0, 2)` | `fee` (MDR Fee INR) | `DECIMAL(15,2)` |
| `tax` | Integer (paise) | `round(tax / 100.0, 2)` | `tax` (GST Tax INR) | `DECIMAL(15,2)` |
| `amount - fee` | Calculated | `amount - fee` | `net_amount` | `DECIMAL(15,2)` |
| `created_at` | Unix Epoch (seconds) | `datetime.fromtimestamp(...)` | `transaction_date` | `DateTime(UTC)` |
| `email` / `contact` | String | Counterparty mapping | `counterparty` | `VARCHAR(255)` |

---

## 7. API Endpoints

All endpoints are mounted under `/api/v1/integrations/razorpay`:

### 1. `GET /api/v1/integrations/razorpay/status`
Returns configuration status, masked Key ID, and active mode without exposing secrets.

### 2. `POST /api/v1/integrations/razorpay/test-connection`
Safely tests live connectivity against `GET /v1/payments?count=1`. Does not mutate any financial state.

### 3. `POST /api/v1/integrations/razorpay/sync`
Synchronizes live payments and settlements from Razorpay API, normalizes records, creates a Reconciliation Batch, and runs the 4-tier reconciliation engine.

### 4. `POST /api/v1/integrations/razorpay/mock-sync`
Ingests mock Razorpay API payloads for offline demonstration of the live schema pipeline.

---

## 8. Error Handling & Resilience

- **Missing Credentials:** Returns `HTTP 400 Bad Request` with helpful instructions; does not crash the server.
- **Invalid Credentials (HTTP 401):** Returns clean error message: *"Authentication failed: Invalid Razorpay Key ID or Key Secret."*
- **Rate Limit (HTTP 429):** Returns error message: *"Razorpay API rate limit exceeded. Please retry after some time."*
- **Timeout:** 15-second timeout safeguard prevents hanging connections.
