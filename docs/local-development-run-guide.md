# LedgerIQ — Local Development Run Guide

**Project:** LedgerIQ ⚖️⚡  
**Tagline:** *Reconcile faster. Explain every rupee. Resolve exceptions with confidence.*  
**Track:** Razorpay AI Buildathon — Track 04: AI Finance Controller  
**Operating System Target:** Windows 10 / 11 with Visual Studio Code  

This guide provides the exact, verified step-by-step procedure to run the entire LedgerIQ application (Backend + Frontend + Database + AI Engine + Demo Benchmark) locally on your Windows machine using Visual Studio Code.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Open in VS Code](#3-open-in-vs-code)
4. [Environment Setup](#4-environment-setup)
5. [API Key Requirements](#5-api-key-requirements)
6. [Backend Setup (Terminal 1)](#6-backend-setup-terminal-1)
7. [Database Setup & Automatic Seeding](#7-database-setup--automatic-seeding)
8. [Backend Startup](#8-backend-startup)
9. [Backend Verification](#9-backend-verification)
10. [Frontend Setup (Terminal 2)](#10-frontend-setup-terminal-2)
11. [Frontend Startup](#11-frontend-startup)
12. [First Login](#12-first-login)
13. [End-to-End Demo Flow](#13-end-to-end-demo-flow)
14. [AI Feature Verification](#14-ai-feature-verification)
15. [Automated Tests](#15-automated-tests)
16. [System Benchmark Verification](#16-system-benchmark-verification)
17. [E2E Workflow Verification](#17-e2e-workflow-verification)
18. [Troubleshooting Common Windows & VS Code Issues](#18-troubleshooting-common-windows--vs-code-issues)
19. [Security Best Practices](#19-security-best-practices)
20. [Shutdown Procedure](#20-shutdown-procedure)

---

## 1. Prerequisites

Before starting, ensure the following software is installed on your Windows machine:

| Component | Minimum Version | Recommended / Tested | Check Command |
|---|---|---|---|
| **Python** | 3.11+ | 3.13.x | `python --version` |
| **Node.js** | 18.0+ | 20.x or 24.x | `node --version` |
| **npm** | 9.0+ | 10.x or 11.x | `npm --version` |
| **Visual Studio Code** | Latest | Latest | `code --version` |
| **Git** | 2.x+ | Latest | `git --version` |

> [!NOTE]
> Docker and PostgreSQL are **NOT** required for local development. LedgerIQ includes an automatic SQLite fallback (`ledgeriq.db`) that runs self-contained without any external services or containers.

---

## 2. Project Structure

The project has two distinct applications:

```text
LedgerIQ/
├── .env.example              # Template environment file
├── .gitignore                # Git ignore rules
├── README.md                 # Project overview
├── docker-compose.yml        # Docker composition for production (optional)
├── docs/                     # Technical specifications and guides
│   ├── DESIGN.md             # Visual design tokens & layout rules
│   └── local-development-run-guide.md
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── main.py           # FastAPI entry point & lifespan seeds
│   │   ├── core/             # Configuration, Database, Security, Logging
│   │   ├── models/           # SQLAlchemy async models
│   │   ├── api/              # 17 REST API routers
│   │   ├── reconciliation/   # Normalizer, Matcher, Verifier, Exceptions
│   │   ├── agents/           # Specialized AI Agents & Provider Abstractions
│   │   └── services/         # Dataset generator, report service, evaluation
│   ├── tests/                # 21 unit & integration tests
│   ├── requirements.txt      # Python dependencies
│   ├── pytest.ini            # Pytest configuration
│   ├── verify_system.py      # Benchmark runner script
│   └── verify_e2e.py         # End-to-end integration test script
└── frontend/                 # React 18 / Vite / TypeScript Application
    ├── src/
    │   ├── main.tsx          # React application entry point
    │   ├── App.tsx           # Router & global authenticated layout
    │   ├── api/              # Axios HTTP client & typed API SDK
    │   ├── components/       # Design System UI primitives
    │   └── features/         # 15 specialized FinOps operational screens
    ├── package.json          # Node dependencies & scripts
    ├── tailwind.config.js    # Design System colors & tokens
    └── vite.config.ts        # Vite development server configuration
```

---

## 3. Open in VS Code

1. Launch **Visual Studio Code**.
2. Go to **File** > **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the `LedgerIQ` root directory (e.g., `C:\Users\<YOUR_USER>\Desktop\LedgerIQ`).
4. In VS Code, verify the File Explorer on the left shows `backend/`, `frontend/`, and `docs/`.

---

## 4. Environment Setup

LedgerIQ comes with a pre-configured `.env.example` file in the project root.

### Create `.env`
In the root directory of `LedgerIQ`, create a file named `.env`:

#### Option A: Copy using PowerShell in VS Code Terminal
```powershell
Copy-Item .env.example .env
```

#### Option B: Copy using Command Prompt (CMD)
```cmd
copy .env.example .env
```

### Review `.env` Variables

```ini
# Application Settings
PROJECT_NAME=LedgerIQ
ENVIRONMENT=development
DEBUG=true
API_V1_STR=/api/v1

# Security & Authentication
JWT_SECRET=super_secret_jwt_key_ledgeriq_buildathon_2026_dev_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database Configuration
# Uses local SQLite by default. No database server installation required.
DATABASE_URL=sqlite+aiosqlite:///./ledgeriq.db
DB_ECHO=false

# AI Provider Configuration
# Options: fallback, gemini, groq, openrouter, ollama
AI_PROVIDER=fallback
AI_MODEL_NAME=gemini-2.0-flash
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Razorpay API Credentials (Optional - for live/test account sync)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# CORS Settings (frontend origins)
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]
```

> [!TIP]
> You can leave all values as their defaults! The application is fully configured to run out-of-the-box on SQLite with the built-in deterministic fallback AI reasoning provider.

---

## 5. API Key Requirements

| Category | Requirement | Details |
|---|---|---|
| **Required to START the application** | **NONE (0 Keys)** | LedgerIQ starts cleanly without any external API keys. |
| **Required for Demo Mode** | **NONE (0 Keys)** | 100-record benchmark, synthetic generation, and testing run completely offline. |
| **Required for Core Reconciliation** | **NONE (0 Keys)** | All 4-level matching, GST/MDR math, and exception detection are 100% deterministic Python/SQL code. |
| **Required for AI / Copilot Features** | **OPTIONAL** | LedgerIQ has a built-in `FallbackReasoningProvider` that generates grounded financial analysis directly from SQL data. |
| **Required for Live Razorpay Sync** | **OPTIONAL** | Only needed if you want to pull live/test transactions directly from `https://api.razorpay.com/v1`. |

### Razorpay API Configuration (Optional):
- **Variable Names:**
  - `RAZORPAY_KEY_ID=<YOUR_KEY_ID>`
  - `RAZORPAY_KEY_SECRET=<YOUR_KEY_SECRET>`
- **Required to Start Application:** **NO**
- **Required for Demo Mode:** **NO**
- **Required for Razorpay Live Mode:** **YES** (Only to sync live/test payments and settlements from Razorpay)
- **Required for AI:** **NO**
- **Offline Alternative:** Click **"Simulate Razorpay API Sync"** on the Data Sources screen to test the exact Razorpay API ingestion, paise-to-INR normalization, and Level 4 reconciliation pipeline offline without API keys.

### Available AI Providers (All Optional):

1. **Deterministic Fallback (`AI_PROVIDER=fallback`)** — *Default*
   - **Key Required:** None
   - **Behavior:** Operates offline, grounded in mathematical proofs and SQL queries with zero hallucination.
2. **Google Gemini (`AI_PROVIDER=gemini`)**
   - **Key Variable:** `GEMINI_API_KEY=<YOUR_KEY_HERE>`
   - **Model:** `gemini-2.0-flash`
   - **Behavior if Missing:** Gracefully degrades to the deterministic fallback engine without crashing.
3. **Groq (`AI_PROVIDER=groq`)**
   - **Key Variable:** `GROQ_API_KEY=<YOUR_KEY_HERE>`
   - **Model:** `llama-3.3-70b-versatile`
4. **OpenRouter (`AI_PROVIDER=openrouter`)**
   - **Key Variable:** `OPENROUTER_API_KEY=<YOUR_KEY_HERE>`
   - **Model:** `meta-llama/llama-3.1-70b-instruct`
5. **Local Ollama (`AI_PROVIDER=ollama`)**
   - **Key Required:** None (requires local Ollama service running on `http://localhost:11434`)

---

## 6. Backend Setup (Terminal 1)

Open your first terminal in VS Code:
- Menu: **Terminal** > **New Terminal** (`Ctrl + Shift + ` `)
- Ensure the terminal is PowerShell or CMD.

### Step 6.1: Navigate to the `backend` folder
```powershell
cd backend
```

### Step 6.2: Create a Python Virtual Environment
```powershell
python -m venv venv
```

### Step 6.3: Activate the Virtual Environment

**In PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

*(If PowerShell displays an `Execution_Policies` script restriction error, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then rerun `.\venv\Scripts\Activate.ps1`).*

**In Command Prompt (CMD):**
```cmd
venv\Scripts\activate.bat
```

Once activated, your terminal prompt will be prefixed with `(venv)`.

### Step 6.4: Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

---

## 7. Database Setup & Automatic Seeding

You do **NOT** need to run any manual database creation, migration, or seeding script!

When the FastAPI backend boots up, its application lifespan handler automatically:
1. Calls `init_db()`: Creates the SQLite database file (`ledgeriq.db`) and builds all relational tables via SQLAlchemy ORM.
2. Calls `seed_initial_data()`: Checks if the default organization and administrative account exist. If not, it automatically seeds:
   - **Organization:** `Razorpay FinOps Org` (Slug: `razorpay-finops`)
   - **Admin User Email:** `admin@ledgeriq.io`
   - **Admin Password:** `admin123`
   - **Admin Role:** `ADMIN`

---

## 8. Backend Startup

In **Terminal 1** (inside `backend` directory with `venv` activated), execute:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Expected Startup Output:
```text
INFO:     Will watch for changes in: ['C:\\Users\\...\\LedgerIQ\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started re-loader process [PID] using WatchFiles
[INFO] [ledgeriq] Starting LedgerIQ API Server...
[INFO] [ledgeriq] Database initialized successfully.
[INFO] [ledgeriq] Initialized default admin: admin@ledgeriq.io / admin123
INFO:     Application startup complete.
```

---

## 9. Backend Verification

Keep Terminal 1 running. You can verify the backend is running by opening a browser or testing with `curl`:

1. **Health Check Endpoint:**
   - URL: `http://127.0.0.1:8000/health`
   - Response: `{"status":"ok","project":"LedgerIQ","version":"1.0.0"}`
2. **Readiness Endpoint:**
   - URL: `http://127.0.0.1:8000/health/ready`
   - Response: `{"status":"ready","database":"connected","ai_provider":"fallback"}`
3. **Interactive OpenAPI / Swagger Documentation:**
   - URL: `http://127.0.0.1:8000/docs`
   - Displays all 17 mounted routers with schemas and test consoles.

---

## 10. Frontend Setup (Terminal 2)

Leave Terminal 1 running the backend. Now open a **second terminal** in VS Code:
- Click the **+** (New Terminal) icon or split terminal in VS Code's terminal pane.

### Step 10.1: Navigate to the `frontend` directory
```powershell
cd frontend
```

### Step 10.2: Install Frontend Dependencies
```powershell
npm install
```

---

## 11. Frontend Startup

In **Terminal 2** (inside `frontend` directory), execute:

```powershell
npm run dev
```

### Expected Output:
```text
  VITE v5.4.8  ready in 345 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Now open your web browser and navigate to:
👉 **`http://localhost:5173`**

---

## 12. First Login

When you navigate to `http://localhost:5173`, the application will display the Login screen.

### Option A: 1-Click Instant Demo Login (Recommended)
Click the amber button labeled:
👉 **"Instant Demo Login (admin@ledgeriq.io)"**

This calls the controlled demo auth endpoint, receives a signed JWT access token, saves it in `localStorage`, and redirects you straight to the FinOps Command Center.

### Option B: Manual Credentials
- **Email:** `admin@ledgeriq.io`
- **Password:** `admin123`
- Click **Sign In**.

### Option C: Register a New Team
Click **"Register your team"** to create a custom organization, administrator account, and custom role.

---

## 13. End-to-End Demo Flow

Once logged in, experience the complete financial operations loop:

```text
Login 
  ↓
FinOps Command Center (Dashboard)
  ↓
Click "Demo Benchmark (100 Txns)" in Top Navbar
  ↓
Deterministic Ingestion (Payments + Settlements + Bank Feeds)
  ↓
4-Tier Hierarchical Reconciliation Engine (Level 1 to 4)
  ↓
Matches Breakdown & Independent Mathematical Verification (Gross - MDR - GST = Net)
  ↓
Exceptions Workbench (10 Discrepancy Types Classified)
  ↓
Open Any Exception → 4-Pane Comparative Ledger (Payment, Settlement, Bank, Invoice)
  ↓
AI Investigation Agent → Root Cause & Audited Recommendation
  ↓
Operator Action Center → Resolve / Approve / Reject
  ↓
Compliance Audit Trail (Immutable Log of Event, Actor, Timestamp, Diff)
  ↓
Export CFO Reports (CSV, Multi-Sheet XLSX, PDF)
```

### Step-by-Step Instructions:
1. **Trigger Demo Benchmark:** In the top navigation bar, click the amber button **"Demo Benchmark (100 Txns)"**.
   - Within 50 milliseconds, 100 realistic records across Razorpay Gateway, HDFC Bank, and Axis Bank feeds are generated, normalized, and reconciled.
2. **Review Batch Detail:** The screen navigates to `/batches/<batch-id>`. Notice:
   - **70 records matched** (35 paired records across Exact, Fee/Tax Aware, and Fuzzy rules).
   - **30 exceptions preserved** (orphans, duplicates, amount mismatches, fee leakages).
3. **Inspect Independent Mathematical Verification:** Navigate to **Verification Engine** in the sidebar.
   - Test verifying INR 10,000 gross against INR 9,764 net (2% MDR + 18% GST).
   - Notice the proof formula: $Gross - MDR - GST = Net$.
4. **Investigate Exceptions:** Navigate to **Exceptions** in the sidebar.
   - Click on any exception (e.g., `FEE_DISCREPANCY` or `MISSING_SETTLEMENT`).
   - Examine the **4-Pane Comparative Ledger** showing side-by-side ledger records.
   - Review the **AI Root-Cause Explanation** with mathematical evidence.
5. **Resolve the Exception:**
   - In the Operator Action Center, select an action (e.g., **Approve Adjustment** or **Resolve**), enter notes, and submit.
6. **Verify Audit Trail:** Navigate to **Audit Trail** in the sidebar.
   - Verify that your resolution action was captured immutably with user email, timestamp, and before/after diffs.
7. **Ask Finance Copilot:** Click the **Finance Copilot** button in the top navbar or sidebar.
   - Ask: *"How much money is currently unreconciled?"* or *"Summarize the latest reconciliation batch."*
   - Watch the copilot execute read-only database tools and reply with grounded evidence.

---

## 14. AI Feature Verification

To verify that the AI subsystem functions properly with and without external API keys:

### Test Without Any API Key (Default Fallback)
1. Ensure `AI_PROVIDER=fallback` in `.env` (or leave `GEMINI_API_KEY` blank).
2. Start the application, log in, and open **Finance Copilot**.
3. Type: *"How much money is currently unreconciled?"*
4. **Expected Result:** The copilot executes the `get_batch_metrics` tool, retrieves the actual database numbers, and prints a structured summary citing real database figures.

### Test With Google Gemini API Key
1. In your `.env` file, set:
   ```ini
   AI_PROVIDER=gemini
   AI_MODEL_NAME=gemini-2.0-flash
   GEMINI_API_KEY=AIzaSy...your-actual-api-key
   ```
2. Restart the backend terminal (`Ctrl + C`, then re-run the uvicorn command).
3. Open **Finance Copilot** or inspect an exception.
4. **Expected Result:** Responses will now be enriched by Google Gemini 2.0 Flash using real database tools.

---

## 15. Automated Tests

LedgerIQ includes an automated test suite with **21 unit and integration tests** covering health, authentication, RBAC security, dataset generator, exception engine, data sources, independent verifier, and 4-tier matching engine.

To run the full test suite, open a terminal in `backend` with `venv` activated:

```powershell
cd backend
python -m pytest tests/ -v
```

### Expected Output:
```text
tests/test_api.py::test_health_endpoints PASSED
tests/test_api.py::test_auth_and_login PASSED
tests/test_api.py::test_evaluation_benchmark_run PASSED
tests/test_api.py::test_copilot_chat PASSED
tests/test_api.py::test_security_unauthenticated_requests_rejected PASSED
tests/test_dataset_generator.py::test_dataset_generator_50_records PASSED
tests/test_dataset_generator.py::test_dataset_generator_100_records PASSED
tests/test_dataset_generator.py::test_dataset_generator_determinism PASSED
tests/test_exception_engine.py::test_exception_classification_duplicate PASSED
tests/test_exception_engine.py::test_exception_missing_settlement PASSED
tests/test_exception_engine.py::test_exception_missing_payment PASSED
tests/test_extended_api.py::test_data_sources_api PASSED
tests/test_extended_api.py::test_independent_verification_api PASSED
tests/test_extended_api.py::test_specialized_transaction_views PASSED
tests/test_matching_engine.py::test_level_1_exact_id_matching PASSED
tests/test_matching_engine.py::test_level_2_strict_composite_matching PASSED
tests/test_matching_engine.py::test_level_3_fuzzy_reference_matching PASSED
tests/test_matching_engine.py::test_level_4_settlement_fee_and_tax_matching PASSED
tests/test_normalizer.py::test_map_columns_standard PASSED
tests/test_normalizer.py::test_parse_monetary_values PASSED
tests/test_normalizer.py::test_dataframe_normalization PASSED

============================= 21 passed in ~4s ==============================
```

---

## 16. System Benchmark Verification

To run the standalone CLI benchmark verification script:

```powershell
cd backend
python verify_system.py
```

### Expected Output:
```text
======================================================================
LEDGERIQ: END-TO-END FINANCIAL RECONCILIATION BENCHMARK (100 RECORDS)
======================================================================
[OK] Database initialized & Default Org / Admin seeded successfully.
[OK] Generated 100 realistic multi-source financial records.
BENCHMARK SCORECARD:
Total Records Ingested:      100
Matched Records:             70
Exceptions Preserved:        30
Match Rate:                  70.0%
Deterministic Precision:     100.00%
Deterministic Recall:        100.00%
F1 Accuracy Score:           100.00%
Engine Throughput:           > 2,000 records/sec
[OK] Level 4 Settlement-Aware Matches Verified: 12 pairs successfully decomposed.
FINAL QUALITY GATE: ALL PHASES VERIFIED AND COMPLETE.
```

---

## 17. E2E Workflow Verification

To test all 10 steps of the financial-ops loop programmatically:

```powershell
cd backend
python verify_e2e.py
```

### Expected Output:
```text
1. Testing Login... [OK]
2. Testing Dashboard Metrics... [OK]
3. Testing Demo Benchmark (100 Txns)... [OK]
4. Testing Matches Retrieval & Strategy Breakdown... [OK]
5. Testing Independent Mathematical Verification... [OK]
6. Testing Exception Listing & 4-Pane Comparative Ledger... [OK]
7. Testing AI Agent Explanation & Investigation... [OK]
8. Testing Operator Action & Resolution... [OK]
9. Testing Compliance Audit Trail... [OK]
10. Testing Report Generation (CSV, XLSX, PDF)... [OK]
=== ALL 10 STEPS OF END-TO-END DEMO FLOW VERIFIED 100% SUCCESSFUL ===
```

---

## 18. Troubleshooting Common Windows & VS Code Issues

### 1. `python` is not recognized as an internal or external command
- **Cause:** Python is not added to your Windows `PATH` environment variable.
- **Fix:** Re-run the Python Windows installer, select **Modify**, and check the box **"Add Python to PATH"**. Alternatively, invoke Python via `py`:
  ```powershell
  py -m venv venv
  py -m uvicorn app.main:app --reload
  ```

### 2. PowerShell Script Execution Policy Error (`Activate.ps1 cannot be loaded`)
- **Cause:** Windows PowerShell restricts script execution by default.
- **Fix:** Open PowerShell in VS Code and run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

### 3. Port 8000 is already in use
- **Cause:** A previous backend process is still occupying port 8000.
- **Fix:** Find and terminate the process holding port 8000:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```

### 4. Port 5173 is already in use
- **Cause:** Another Vite instance is running.
- **Fix:** Terminate the occupying process or allow Vite to bind to `http://localhost:5174`.

### 5. `npm` is not recognized
- **Cause:** Node.js is not installed or not in system PATH.
- **Fix:** Download and install Node.js (LTS version) from [nodejs.org](https://nodejs.org), then restart VS Code.

### 6. Frontend cannot connect to Backend (Network Error / CORS)
- **Cause:** The backend is not running on port 8000, or the URL in `.env` does not match.
- **Fix:** 
  1. Confirm `http://127.0.0.1:8000/health` returns `{"status":"ok"}`.
  2. Verify that `CORS_ORIGINS` in `backend/app/core/config.py` includes `"http://localhost:5173"`.

### 7. Database Locking (`database is locked`)
- **Cause:** Multiple async processes attempting simultaneous writes to SQLite.
- **Fix:** The backend uses connection serialization with `check_same_thread=False`. If a file lock persists, stop the backend (`Ctrl + C`), delete `backend/ledgeriq.db`, and restart the backend. The database will automatically reinitialize.

---

## 19. Security Best Practices

1. **Never Commit `.env`:** The root `.gitignore` is configured to exclude all `.env` files except `.env.example`.
2. **Never Commit API Keys:** Do not hardcode API keys into source files. Always use environment variables.
3. **Never Put Secrets in React Frontend Code:** Frontend code is bundled and publicly visible in browser dev tools. All LLM calls and database queries must route strictly through the FastAPI backend.
4. **Do Not Share JWT Secrets:** In production, generate a cryptographically strong random string (`openssl rand -hex 32`) for `JWT_SECRET`.

---

## 20. Shutdown Procedure

To cleanly stop the application:

1. **Stop Frontend (Terminal 2):**
   - Click into Terminal 2.
   - Press `Ctrl + C`.
   - If prompted `Terminate batch job (Y/N)?`, type `Y` and press `Enter`.
2. **Stop Backend (Terminal 1):**
   - Click into Terminal 1.
   - Press `Ctrl + C`.
   - The Uvicorn process will gracefully close database connections and shut down.
