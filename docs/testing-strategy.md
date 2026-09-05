# Testing Strategy & Quality Assurance — LedgerIQ

**Product:** LedgerIQ AI Finance Controller  
**Scope:** Unit, Integration, E2E, and Deterministic Benchmarks

---

## 1. Testing Pyramid & Objectives

```
               /\
              /  \      E2E User Workflows (Login -> Ingest -> Reconcile -> Resolve -> Report)
             /----\
            /      \    API Integration Tests (FastAPI TestClient, DB state, Auth)
           /--------\
          /          \  Unit Tests (Level 1-4 Matching, Fee/Tax Verifier, Normalizer, Exception Engine)
         +------------+
```

---

## 2. Test Suites & Coverage

### 2.1 Unit Tests (`backend/tests/unit/`)
- **`test_normalizer.py`:**
  - Tests various header aliases (`txn_id`, `payment_id`, `UTR`, `credit`, `gross_amount`).
  - Tests currency parsing (₹10,000, 10000.00, $150.50).
  - Tests ISO-8601 and regional date parsing (`2026-08-28`, `28/08/2026`, `08-28-2026`).
- **`test_matching_engine.py`:**
  - **Level 1 Exact ID Match:** Verifies 100% confidence on matching transaction IDs.
  - **Level 2 Composite Strict Match:** Verifies matching on reference + amount + date.
  - **Level 3 Fuzzy Match:** Verifies matching with truncated/prefix references and $\pm 3$ day windows.
  - **Level 4 Settlement Fee/Tax Match:** Verifies deduction formula ($10000 - 200 - 36 = 9764$).
- **`test_exception_engine.py`:**
  - Verifies correct classification of all 10 exception types.
  - Verifies severity scoring and delta calculations.
- **`test_dataset_generator.py`:**
  - Tests deterministic generation of 50, 100, 500, 1000 synthetic records with seed control and ground-truth validation.

### 2.2 Integration Tests (`backend/tests/integration/`)
- **`test_api_auth.py`:** Registration, login, token refresh, RBAC rejection.
- **`test_api_reconciliation.py`:** Uploading files, triggering batch reconciliation, polling progress, verifying persisted matches and exceptions.
- **`test_api_copilot.py`:** Ensuring Copilot tool invocation accurately returns verified database records.
- **`test_api_evaluations.py`:** Running automated benchmark execution and calculating precision, recall, F1 score.

### 2.3 Benchmark Execution Command
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing
```
