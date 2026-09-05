# Technical Design Document — LedgerIQ

**Author:** Principal Software Architect & Senior Full-Stack Engineer  
**Date:** 2026-08-28  
**Scope:** End-to-End Implementation Blueprint

---

## 1. Architectural Layers & Separation of Concerns

The LedgerIQ backend follows a clean, modular, domain-driven structure:

1. **`app/core/` (Foundational Services):**
   - Application configuration with Pydantic `BaseSettings`.
   - Async and sync SQLAlchemy session factories.
   - Security primitives (password hashing, JWT issuance & verification).
   - Structured JSON logging and request-ID propagation middleware.

2. **`app/models/` (Relational Entities):**
   - Declarative SQLAlchemy models with UUID primary keys, foreign key constraints, and performance indexes.

3. **`app/schemas/` (Data Transfer Objects):**
   - Pydantic v2 schemas for all request payloads, response bodies, and validation rules.

4. **`app/reconciliation/` (Deterministic Financial Core):**
   - `normalizer.py`: Heterogeneous header alias matching and currency/date sanitization.
   - `matcher.py`: 4-tier waterfall matching engine.
   - `verifier.py`: Double-entry balance calculation and rounding tolerance checker.
   - `scoring.py`: Confidence score calculation.
   - `exception_engine.py`: 10-category exception classifier.

5. **`app/agents/` (AI Intelligence Layer):**
   - `provider.py`: Provider-agnostic adapter for Gemini, Groq, OpenRouter, Ollama, and Fallback.
   - `tools.py`: Read-only, grounded database introspection tools.
   - `orchestrator.py`: Multi-agent graph orchestrator routing tasks to specialized agents.
   - `copilot_agent.py`: Grounded conversational FinOps assistant.
   - `exception_agent.py`: Structured root-cause explanation generator.

6. **`app/api/` (REST Endpoints):**
   - Thin HTTP controllers enforcing RBAC, input validation, and structured error responses.

7. **`app/services/` (Business Logic & Datasets):**
   - Batch coordination, progress tracking, synthetic dataset generator with ground-truth generation.

---

## 2. Asynchronous Execution & Progress Tracking

Reconciliation jobs are executed asynchronously to keep HTTP response times instant:
1. Client POSTs `/batches` with upload IDs.
2. Server creates a `reconciliation_batches` record with status `PROCESSING` and spawns a background worker task.
3. The background worker normalizes records, runs Level 1-4 matching passes in chunks, updates progress counters (`records_processed / total_records`), and commits results.
4. The client polls `/batches/{id}/progress` or receives reactive UI updates until `COMPLETED`.

---

## 3. Error Handling Protocol

All API errors return RFC 7807 structured JSON objects:
```json
{
  "error": {
    "code": "INVALID_FILE_SCHEMA",
    "message": "The uploaded CSV is missing required date or amount columns.",
    "request_id": "req-98f2b34a",
    "details": {
      "missing_fields": ["transaction_date", "amount"]
    }
  }
}
```
Stack traces are never exposed in production responses.
