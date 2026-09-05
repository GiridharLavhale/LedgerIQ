# System Architecture — LedgerIQ

**Product:** LedgerIQ AI Finance Controller  
**Architecture Pattern:** Clean Modular Monolith with Asynchronous Background Processing & Agentic AI Orchestration  
**Status:** Approved for Implementation

---

## 1. High-Level Architecture

LedgerIQ is engineered as a decoupled, multi-tiered enterprise application:

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION TIER                                  |
|  React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts            |
|  - Dashboard KPI Widgets & Realtime Charts                                       |
|  - Multi-File Ingestion Wizard & Progress Trackers                               |
|  - 4-Pane Comparative Ledger (Payment | Settlement | Bank | Invoice)             |
|  - Interactive AI Finance Copilot Drawer with Grounded Citation Chips             |
|  - Benchmark & Evaluation Matrix Runner                                           |
+------------------------------------------+----------------------------------------+
                                           | REST API (JSON / Multipart / JWT)
                                           v
+-----------------------------------------------------------------------------------+
|                                  APPLICATION TIER                                 |
|  FastAPI 0.115+ (Python 3.11+)                                                    |
|  - Authentication & RBAC Middleware (JWT Bearer, bcrypt)                          |
|  - Request ID Tracing & Structured JSON Logging                                   |
|  - API Routers: Auth, Batches, Ingestion, Exceptions, Copilot, Reports, Benchmark |
+---------------------+---------------------------------------+---------------------+
                      |                                       |
                      v                                       v
+-----------------------------------+   +-------------------------------------------+
|    DETERMINISTIC FINANCIAL ENGINE |   |          AGENTIC AI ORCHESTRATOR          |
|  - Schema Header Normalizer       |   |  - Provider Abstraction Layer             |
|  - Canonical Model Validator      |   |    (Gemini, Groq, OpenRouter, Ollama)     |
|  - 4-Tier Match Engine:           |   |  - Read-Only Grounded Tools Registry      |
|    * L1: Exact Reference Match    |   |  - Agents:                                |
|    * L2: Reference+Amt+Date Match |   |    * Reconciliation Agent                 |
|    * L3: Fuzzy Reference Match    |   |    * Exception Investigator Agent         |
|    * L4: Fee/Tax Settlement Match |   |    * Finance Copilot Agent                |
|  - Exception Classification Rule  |   |    * Executive Report Agent               |
|  - Double-Entry Verifier          |   |  - Grounded Evidence Verification         |
+---------------------+-------------+   +---------------------+---------------------+
                      |                                       |
                      +-------------------+-------------------+
                                          | SQLAlchemy 2.0 Async/Sync
                                          v
+-----------------------------------------------------------------------------------+
|                                   DATA TIER                                       |
|  Primary: PostgreSQL 18 (ACID, Foreign Keys, Indexes, JSONB metadata)             |
|  Local Fallback: SQLite 3 with Foreign Key constraints enabled                    |
|  Caching & Queueing: Redis 7+ / Python In-Process Asynchronous Job Queue           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Ingestion & Normalization Subsystem
The ingestion subsystem handles heterogeneous financial records without manual schema remapping:
1. **File Detection:** Detects `.csv`, `.xlsx`, `.xls`, or `.json` stream.
2. **Header Alias Dictionary:** Maps common gateway and bank field synonyms into standard canonical fields:
   - `id`, `transaction_id`, `payment_id`, `txn_id`, `payment_reference` $\rightarrow$ `transaction_id`
   - `amount`, `gross_amount`, `txn_amount`, `order_amount`, `credit` $\rightarrow$ `amount`
   - `fee`, `gateway_fee`, `mdr`, `commission`, `charge` $\rightarrow$ `fee`
   - `tax`, `gst`, `vat`, `service_tax` $\rightarrow$ `tax`
   - `settlement_amount`, `net_amount`, `payout_amount` $\rightarrow$ `net_amount`
3. **Data Sanitization:** Strips currency symbols (₹, $, €, commas), converts decimal strings to `Decimal(12, 2)`, and standardizes ISO-8601 timestamps (`YYYY-MM-DDTHH:MM:SSZ`).

### 2.2 4-Tier Reconciliation Pipeline
The matching engine executes a waterfall hierarchy to ensure maximum deterministic coverage without false positives:
- **Pass 1 (Level 1 Exact ID Match):** O(1) indexed dictionary lookup on exact external transaction reference. Confidence = 100%.
- **Pass 2 (Level 2 Composite Strict Match):** Multi-index match on `Reference + Currency + Exact Amount + Date`. Confidence = 98%.
- **Pass 3 (Level 3 Fuzzy Match):** Substring/prefix and Levenshtein token similarity for gateway IDs with date tolerance ($\pm 3$ days). Confidence = 75–90%.
- **Pass 4 (Level 4 Fee/Tax Settlement-Aware Match):** Calculates net expected settlement:
  $$\text{Expected Net} = \text{Gross Amount} - \text{MDR Fee} - \text{Tax}$$
  If actual settlement equals expected net within $\pm ₹0.05$ rounding tolerance, records are matched with status `MATCHED` and strategy `SETTLEMENT_FEE_AWARE`.

### 2.3 Exception Engine Subsystem
Any record that fails all 4 matching passes or exhibits variance is captured in the `exceptions` table:
- Categorized into one of 10 structured types.
- Severity calculated based on financial impact ($<\text{₹}1,000$: LOW, $\text{₹}1,000-\text{₹}10,000$: MEDIUM, $>\text{₹}10,000$: HIGH, Duplicate/Missing: CRITICAL).
- Automatically enqueued for AI explanation generation.

### 2.4 Agentic AI Subsystem
The AI architecture uses a provider-agnostic bridge:
- **Provider Adapters:** `GoogleGeminiProvider`, `GroqProvider`, `OpenRouterProvider`, `OllamaProvider`, and `DeterministicFallbackProvider`.
- **Tool Protocol:** AI agents never receive raw SQL execution permissions. They invoke strictly typed Python functions that return verified JSON payloads.
- **Evidence Contract:** Every AI response must return:
  - `reasoning_summary` (String)
  - `evidence` (List of record IDs and verified amounts)
  - `confidence` (Float 0.0 – 1.0)
  - `recommended_action` (Enum: `APPROVE_MATCH`, `REJECT_MATCH`, `REQUEST_BANK_RETRY`, `WRITE_OFF`, `MANUAL_REVIEW`)

### 2.5 Security & Audit Subsystem
- **JWT & Password Security:** HS256 JWT tokens with 15-minute access and 7-day refresh expiry. Passwords hashed with `bcrypt`.
- **RBAC Decorators:** FastAPI dependency injection enforces role permissions per endpoint.
- **Tamper-Evident Audit Logging:** Every mutation records `actor_id`, `action`, `target_entity`, `target_id`, `before_state_json`, `after_state_json`, `ip_address`, and `timestamp`.
