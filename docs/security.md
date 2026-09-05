# Security & Governance Specification — LedgerIQ

**Subsystem:** Security, Authentication, RBAC & Compliance  
**Standard:** Enterprise FinOps & SOC 2 Readiness

---

## 1. Authentication & Session Management

- **Password Security:** Passwords hashed with `bcrypt` using 12 salt rounds. Plaintext passwords are never logged or stored.
- **JWT Architecture:**
  - `access_token`: Short-lived (15–60 minutes) HS256 JWT containing `user_id`, `org_id`, and `role`.
  - `refresh_token`: Long-lived (7 days) cryptographically random token stored in database with rotation on use.
- **Rate Limiting:** IP and user-based throttling on authentication endpoints (5 attempts/min) to prevent brute-force attacks.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | ADMIN | FINANCE_MANAGER | FINANCE_ANALYST | VIEWER |
|---|:---:|:---:|:---:|:---:|
| **View Dashboard & Batches** | ✅ | ✅ | ✅ | ✅ |
| **Download Reports (PDF/XLSX)** | ✅ | ✅ | ✅ | ✅ |
| **Use Finance Copilot** | ✅ | ✅ | ✅ | ✅ |
| **Create Reconciliation Batch** | ✅ | ✅ | ✅ | ❌ |
| **Upload Transaction Files** | ✅ | ✅ | ✅ | ❌ |
| **Investigate Exceptions** | ✅ | ✅ | ✅ | ❌ |
| **Approve / Reject Matches** | ✅ | ✅ | ❌ | ❌ |
| **Resolve & Close Exceptions** | ✅ | ✅ | ❌ | ❌ |
| **Configure AI Providers & Keys**| ✅ | ❌ | ❌ | ❌ |
| **Manage Users & Roles** | ✅ | ❌ | ❌ | ❌ |
| **Delete Batches / Data** | ✅ | ❌ | ❌ | ❌ |

---

## 3. Data Integrity & Financial Guardrails

- **Zero LLM Mutation:** AI agents have strictly read-only tool definitions. They are programmatically prohibited from altering balances, approving matches, or mutating database records directly.
- **Audit Trails:** All financial mutations (batch creation, match approval, manual resolution, user assignment) are immutably logged with actor ID, timestamp, prior state, new state, and client IP.
- **SQL Injection & XSS Protection:** Parameterized queries via SQLAlchemy ORM, Pydantic input sanitization, and React automated output escaping.
- **Secrets Management:** Zero committed secrets; all credentials loaded via environment variables (`.env`).
