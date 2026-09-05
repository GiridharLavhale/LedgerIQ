# LedgerIQ ⚖️⚡

> **Reconcile faster. Explain every rupee. Resolve exceptions with confidence.**

LedgerIQ is an enterprise-grade AI Finance Controller platform designed for high-volume, multi-source financial reconciliation, automated discrepancy detection, deterministic verification, and agentic AI investigation. Built for the **Razorpay AI Buildathon — Track 04: AI Finance Controller**.

---

## 🌟 Executive Summary

Traditional financial operations (FinOps) teams spend hundreds of manual hours every month cross-referencing payment gateway reports, bank statements, order management systems, fee schedules, and tax ledgers. The core challenges are schema fragmentation, fee/tax deductions (e.g. MDR 2% + 18% GST), timing delays, and missing records.

**LedgerIQ solves this with a two-tier architecture:**
1. **Deterministic Financial Core**: Hard mathematical logic, 4-tier hierarchical matching (Exact, Reference+Amount+Date, Fuzzy Proximity, and Settlement-Aware Fee/Tax decomposition), zero hallucinations, and tamper-evident audit trails.
2. **Agentic AI Layer**: Multi-agent orchestration powered by provider-agnostic LLMs (Gemini, Groq, OpenRouter, Ollama) equipped with read-only financial tools for root-cause exception analysis, natural-language FinOps Copilot, and automated executive reporting.

---

## 🚀 Key Capabilities

- **Multi-Source Ingestion & Schema Normalization**: Ingest CSV, Excel (XLSX), and JSON exports from payment gateways (Razorpay, Stripe), core banking statements (HDFC, ICICI, SBI), invoices, fees, and tax reports into a canonical financial data model.
- **4-Level Deterministic Reconciliation Engine**:
  - **Level 1**: Exact Gateway Reference / Transaction ID matching ($100\%$ confidence).
  - **Level 2**: Composite Reference + Amount + Currency + Strict Date validation ($95\%-99\%$ confidence).
  - **Level 3**: Normalized Fuzzy Reference + Date Proximity Window + Order metadata matching ($70\%-90\%$ confidence).
  - **Level 4**: Settlement-Aware Fee/Tax Decomposition ($$Payment - Fee - Tax = Settlement$$, e.g. ₹10,000 - ₹200 - ₹36 = ₹9,764).
- **Automated Exception Management**: 10 distinct exception classifications (`AMOUNT_MISMATCH`, `MISSING_SETTLEMENT`, `MISSING_PAYMENT`, `DUPLICATE_TRANSACTION`, `DATE_MISMATCH`, `REFERENCE_MISMATCH`, `FEE_DISCREPANCY`, `TAX_DISCREPANCY`, `PARTIAL_SETTLEMENT`, `UNKNOWN`).
- **AI Finance Controller & Copilot**:
  - Root-cause reasoning on unresolved discrepancies with evidence citations.
  - Conversational AI Copilot grounded on real database queries with zero hallucination guarantee.
  - Automated action recommendations for finance analysts.
- **Repeatable Evaluation & Benchmarking Suite**: Generates 50, 100, 500, 1000+ synthetic transaction sets with ground truth labels to benchmark precision, recall, match rate, exception rate, and execution throughput.
- **Enterprise Security & Governance**: Role-Based Access Control (`ADMIN`, `FINANCE_MANAGER`, `FINANCE_ANALYST`, `VIEWER`), JWT authentication, and immutable audit logs.
- **Export & Reporting**: Comprehensive reconciliation, exception, and settlement reports in CSV, XLSX, and PDF/HTML formats.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │   React 19 + Vite + TS    │
                                  │   Tailwind + Lucide UI    │
                                  └─────────────┬─────────────┘
                                                │ REST API (JWT)
                                                ▼
                                  ┌───────────────────────────┐
                                  │   FastAPI Modular Core    │
                                  │   (Auth, RBAC, API V1)    │
                                  └──────┬──────────────┬─────┘
                                         │              │
                    ┌────────────────────┘              └────────────────────┐
                    ▼                                                        ▼
┌──────────────────────────────────────┐            ┌──────────────────────────────────────┐
│       Reconciliation Engine          │            │       Agentic AI Orchestrator        │
│  - Level 1: Exact Reference Match    │            │  - Provider Abstraction Layer        │
│  - Level 2: Composite Strict Match   │            │    (Gemini, Groq, OpenRouter, Local) │
│  - Level 3: Fuzzy Proximity Match    │            │  - Exception Investigator Agent      │
│  - Level 4: Fee/Tax Settlement Match │            │  - Finance Copilot Agent             │
│  - Exception Classification Engine   │            │  - Tool Calling & Grounded Evidence  │
└───────────────────┬──────────────────┘            └──────────────────┬───────────────────┘
                    │                                                  │
                    └────────────────────┐              ┌──────────────┘
                                         ▼              ▼
                                  ┌───────────────────────────┐
                                  │   PostgreSQL 18 Database  │
                                  │   SQLAlchemy 2.0 Models   │
                                  │   (Audit Trail, Batches)  │
                                  └───────────────────────────┘
```

---

## 📂 Project Structure

```
LedgerIQ/
├── backend/
│   ├── app/
│   │   ├── api/             # API Routers (auth, batches, copilot, exceptions, reports, etc.)
│   │   ├── core/            # Config, Security, Database, Logging, Rate Limiting
│   │   ├── models/          # SQLAlchemy ORM Entities & Audit Models
│   │   ├── schemas/         # Pydantic v2 Request/Response Schemas
│   │   ├── reconciliation/  # Normalizer, 4-Level Matcher, Fee/Tax Verifier, Exception Engine
│   │   ├── agents/          # AI Agents, Tool Registries, Provider Abstractions
│   │   ├── services/        # Business Logic & Synthetic Dataset Generator
│   │   └── main.py          # FastAPI Application Entrypoint
│   ├── tests/               # Unit, Integration, and Benchmark Test Suite
│   ├── requirements.txt     # Python Dependencies
│   └── Dockerfile           # Backend Container Definition
├── frontend/
│   ├── src/
│   │   ├── components/      # UI primitives (Cards, Tables, Skeletons, Modals, Badges)
│   │   ├── features/        # Feature modules (Dashboard, Reconciliation, Exceptions, Copilot)
│   │   ├── api/             # Typed API Clients (Axios/Fetch)
│   │   ├── hooks/           # TanStack Query & Auth Hooks
│   │   ├── types/           # TypeScript Data Models & Enums
│   │   ├── App.tsx          # Root Application & Router Configuration
│   │   └── main.tsx         # React DOM Initialization
│   ├── package.json         # Node Dependencies
│   ├── vite.config.ts       # Vite Configuration
│   └── tailwind.config.js   # Tailwind Theme Configuration
├── docs/                    # Complete Technical Architecture & Specifications
├── docker-compose.yml       # Production Container Orchestration
└── README.md                # Project Overview & Quickstart Guide
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 20+ & npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📊 Benchmark & Demo Datasets

LedgerIQ includes a built-in synthetic financial data generator. Run deterministic benchmarks on 50, 100, 500, or 1000 records with known ground truth directly from the UI or via CLI:

```bash
cd backend
python -m app.services.dataset_generator --size 100 --seed 42 --output-dir demo_data/
```

---

## 🔒 Security & Compliance

- **Zero LLM Math**: Mathematical reconciliation is 100% deterministic; AI is strictly used for natural language explanation and recommendation.
- **RBAC**: Four permission tiers (`ADMIN`, `FINANCE_MANAGER`, `FINANCE_ANALYST`, `VIEWER`).
- **Audit Trails**: Every matching, exception approval, rejection, and resolution is logged with actor ID, timestamp, prior state, and new state.

---

## 📄 License

MIT License. Designed and engineered for the Razorpay AI Buildathon 2026.
