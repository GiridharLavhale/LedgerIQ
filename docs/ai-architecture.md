# AI Architecture & Agentic Controller Specification — LedgerIQ

**Product:** LedgerIQ AI Finance Controller  
**Design Principle:** Grounded, Provider-Agnostic, Zero-Hallucination Agentic Workflow

---

## 1. Provider-Agnostic LLM Layer

LedgerIQ abstracts LLM interactions through a clean provider interface. Any model supporting chat completions or function calling can be configured via environment variables or the UI Settings panel:

- **Google Gemini:** `gemini-2.0-flash`, `gemini-1.5-pro`
- **Groq:** `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`
- **OpenRouter:** Multi-model routing (`anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.1-70b`)
- **Ollama / Local:** `llama3:latest`, `mistral`, `deepseek-r1`
- **Deterministic Rule Engine (Fallback):** Provides rich analytical reasoning without requiring external API keys.

```
                  +-----------------------------------+
                  |      Agent Orchestrator Layer     |
                  +-----------------+-----------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
    +---------------+       +---------------+       +---------------+
    | Gemini Client |       |  Groq Client  |       | Ollama Client |
    +---------------+       +---------------+       +---------------+
            \                       |                       /
             \                      |                      /
              v                     v                     v
            +-----------------------------------------------+
            |        Unified Structured Response Schema     |
            +-----------------------------------------------+
```

---

## 2. Specialized AI Agents

### 2.1 Reconciliation Agent
- **Goal:** Synthesizes batch health, macro settlement variances, and volume distribution across payment methods.
- **Input:** Batch summary statistics, matching breakdown, fee/tax totals.
- **Output:** Executive summary with key risk areas and reconciliation velocity.

### 2.2 Exception Investigator Agent
- **Goal:** Performs automated deep-dive investigations into flagged discrepancies.
- **Input:** 4-pane comparative ledger data (Payment vs Settlement vs Bank Statement vs Invoice).
- **Execution:** Calls `calculate_discrepancy()`, retrieves historical payment behavior, checks fee schedules.
- **Output:**
  - `root_cause`: Human-readable explanation of why the variance occurred.
  - `evidence`: Specific transaction references, mathematical steps ($10000 - 200 - 36 = 9764$).
  - `confidence_score`: 0.0 to 1.0.
  - `recommended_action`: Exact action button for the finance operator (`APPROVE_MATCH`, `REJECT_MATCH`, `FLAG_BANK_ERROR`).

### 2.3 Finance Copilot Agent
- **Goal:** Conversational assistant for CFOs and FinOps analysts to query financial status in natural language.
- **Guardrails:**
  - **Zero Fabrication:** The agent MUST call backend tools to fetch real figures. If data is absent, it explicitly replies "No records found in database."
  - **Citations:** Every numeric claim is accompanied by a database reference link (e.g. `[TXN-1024]`).
  - **Tone:** Professional, precise, conservative, and analytical.

### 2.4 Report Generation Agent
- **Goal:** Compiles formal reconciliation and variance reports for executive review and external auditors.
- **Output:** Formatted Markdown, PDF, CSV, and Excel tables.

---

## 3. Controlled Read-Only Tool Registry

Agents interact with the database exclusively through strict, read-only functional tools:

```python
@tool
def get_reconciliation_summary(batch_id: str) -> dict:
    """Returns batch volume, match count, match rate, and discrepancy totals."""

@tool
def get_transaction(transaction_id: str) -> dict:
    """Returns complete details of a specific canonical transaction."""

@tool
def search_transactions(query: str, batch_id: str = None, limit: int = 10) -> list[dict]:
    """Searches transactions by external reference, amount, or counterparty."""

@tool
def get_exception(exception_id: str) -> dict:
    """Fetches details of an exception, including expected vs actual amounts and differences."""

@tool
def search_exceptions(batch_id: str = None, status: str = "OPEN", severity: str = None) -> list[dict]:
    """Retrieves open exceptions filtered by batch, status, or severity."""

@tool
def calculate_discrepancy(gross_amount: float, net_amount: float, fee_rate: float = 0.02, gst_rate: float = 0.18) -> dict:
    """Performs deterministic calculation of expected net amount and variance."""

@tool
def get_batch_metrics() -> dict:
    """Returns platform-wide metrics including total volume, aggregate match rate, and unresolved exceptions."""
```

---

## 4. Agent Safety & Grounding Protocol

```
User Query: "Why did payment TXN-4091 fail reconciliation?"
  │
  ├─► Copilot Agent receives query
  ├─► Invokes Tool: `get_transaction("TXN-4091")`
  │   └─ Returns: { amount: 15000.0, fee: 300.0, tax: 54.0, status: "EXCEPTION" }
  ├─► Invokes Tool: `get_exception(transaction_id="TXN-4091")`
  │   └─ Returns: { exception_type: "MISSING_SETTLEMENT", days_elapsed: 5 }
  │
  └─► Agent Formulates Grounded Response:
      "Transaction **TXN-4091** (Gross: ₹15,000.00) initiated on 2026-08-20 is currently
       unreconciled due to a **MISSING_SETTLEMENT** exception. The expected net payout of
       ₹14,646.00 (₹15,000 gross - ₹300 MDR - ₹54 GST) has not been received in any bank batch
       after 5 business days (standard SLA is T+2).
       
       **Evidence:**
       - Transaction ID: `TXN-4091`
       - Status: `MISSING_SETTLEMENT`
       - Expected Net: ₹14,646.00
       - Actual Net: ₹0.00
       
       **Recommended Action:** Raise an inquiry with Razorpay support for UTR payout trace."
```
