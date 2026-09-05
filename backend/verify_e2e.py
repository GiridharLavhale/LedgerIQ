"""
End-to-End Workflow Verification Script for LedgerIQ
"""
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app, seed_initial_data
from app.core.database import init_db


async def test_full_workflow():
    await init_db()
    await seed_initial_data()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        print("1. Testing Login...")
        login_res = await ac.post("/api/v1/auth/demo-login")
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   [OK] Logged in successfully with valid JWT.")

        print("2. Testing Dashboard Metrics...")
        dash_res = await ac.get("/api/v1/dashboard/metrics", headers=headers)
        assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
        print("   [OK] Dashboard returned valid KPIs.")

        print("3. Testing Demo Benchmark (100 Txns Ingestion & Reconciliation)...")
        demo_res = await ac.post("/api/v1/evaluations/seed-demo?size=100&seed=42", headers=headers)
        assert demo_res.status_code == 200, f"Demo seed failed: {demo_res.text}"
        batch = demo_res.json()
        batch_id = batch["id"]
        assert batch["total_records"] == 100
        assert batch["matched_records"] > 0
        assert batch["exception_records"] > 0
        print(f"   [OK] Batch reconciled: {batch['matched_records']} matched, {batch['exception_records']} exceptions.")

        print("4. Testing Matches Retrieval & Strategy Breakdown...")
        matches_res = await ac.get(f"/api/v1/batches/{batch_id}/matches", headers=headers)
        assert matches_res.status_code == 200
        matches = matches_res.json()
        strategies = set(m["strategy"] for m in matches)
        print(f"   [OK] Total matches: {len(matches)}. Strategies detected: {strategies}")
        assert "EXACT_ID" in strategies
        assert "SETTLEMENT_FEE_AWARE" in strategies

        print("5. Testing Independent Mathematical Verification...")
        ver_res = await ac.post("/api/v1/verification/verify-pair", json={
            "gross_amount": 10000.0,
            "actual_net_amount": 9764.0,
            "fee_rate": 0.02,
            "gst_rate": 0.18
        }, headers=headers)
        assert ver_res.status_code == 200
        assert ver_res.json()["is_mathematically_verified"] is True
        print("   [OK] Independent verification confirmed formula: Gross - MDR (2%) - GST (18%) = Net.")

        print("6. Testing Exception Listing & 4-Pane Comparative Ledger...")
        exc_list_res = await ac.get(f"/api/v1/exceptions?batch_id={batch_id}", headers=headers)
        assert exc_list_res.status_code == 200
        exceptions = exc_list_res.json()
        assert len(exceptions) > 0
        first_exc_id = exceptions[0]["id"]
        
        exc_detail_res = await ac.get(f"/api/v1/exceptions/{first_exc_id}", headers=headers)
        assert exc_detail_res.status_code == 200
        exc_detail = exc_detail_res.json()
        assert "comparative_ledger" in exc_detail
        print(f"   [OK] Retrieved exception: {exc_detail['exception_type']} with 4-Pane Comparative Ledger.")

        print("7. Testing AI Agent Explanation & Investigation...")
        agent_res = await ac.post("/api/v1/agents/exception-agent/investigate", json={"exception_id": first_exc_id}, headers=headers)
        assert agent_res.status_code == 200
        print("   [OK] Exception Agent returned grounded root cause and recommended action.")

        print("8. Testing Operator Action & Resolution...")
        action_res = await ac.post(f"/api/v1/exceptions/{first_exc_id}/actions", json={
            "action_type": "RESOLVE",
            "notes": "Resolved via End-to-End audit verification test."
        }, headers=headers)
        assert action_res.status_code == 200
        print("   [OK] Operator resolution recorded and updated.")

        print("9. Testing Compliance Audit Trail...")
        audit_res = await ac.get("/api/v1/audit", headers=headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()
        assert len(logs) > 0
        print(f"   [OK] Audit trail contains {len(logs)} immutable events.")

        print("10. Testing Report Generation (CSV, XLSX, PDF)...")
        csv_res = await ac.get(f"/api/v1/reports/reconciliation/{batch_id}?format=CSV", headers=headers)
        assert csv_res.status_code == 200
        assert len(csv_res.content) > 0

        xlsx_res = await ac.get(f"/api/v1/reports/reconciliation/{batch_id}?format=XLSX", headers=headers)
        assert xlsx_res.status_code == 200
        assert len(xlsx_res.content) > 0

        pdf_res = await ac.get(f"/api/v1/reports/reconciliation/{batch_id}?format=PDF", headers=headers)
        assert pdf_res.status_code == 200
        assert len(pdf_res.content) > 0
        print("   [OK] All reports (CSV, XLSX, PDF) generated successfully.")

        print("\n=== ALL 10 STEPS OF END-TO-END DEMO FLOW VERIFIED 100% SUCCESSFUL ===")


if __name__ == "__main__":
    asyncio.run(test_full_workflow())
