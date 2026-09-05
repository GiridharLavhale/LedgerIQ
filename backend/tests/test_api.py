"""
Integration Tests for FastAPI Endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        res_live = await ac.get("/health/live")
        assert res_live.status_code == 200
        assert res_live.json()["status"] == "alive"

        res_ready = await ac.get("/health/ready")
        assert res_ready.status_code == 200
        assert res_ready.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_auth_and_login():
    import uuid
    unique_email = f"cfo_{uuid.uuid4().hex[:6]}@ledgeriq.io"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register new organization
        reg_payload = {
            "email": unique_email,
            "password": "securepassword123",
            "full_name": "Test FinOps Lead",
            "org_name": "Test Logistics Pvt Ltd"
        }
        res_reg = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 200
        data = res_reg.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email

        # Login
        login_payload = {
            "email": unique_email,
            "password": "securepassword123"
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200
        assert "access_token" in res_login.json()


@pytest.mark.asyncio
async def test_evaluation_benchmark_run():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login demo admin
        login_res = await ac.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Run 50-record benchmark
        eval_payload = {"size": 50, "seed": 42}
        res = await ac.post("/api/v1/evaluations/run", json=eval_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["record_count"] == 50
        assert data["precision"] > 70.0
        assert data["recall"] > 70.0
        assert data["throughput_rps"] > 0.0


@pytest.mark.asyncio
async def test_copilot_chat():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        chat_payload = {"message": "How much money is currently unreconciled?"}
        res = await ac.post("/api/v1/copilot/chat", json=chat_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "reply" in data
        assert len(data["tool_calls"]) > 0


@pytest.mark.asyncio
async def test_security_unauthenticated_requests_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Protected endpoints must reject requests with no token
        res_eval = await ac.post("/api/v1/evaluations/run", json={"size": 50, "seed": 42})
        assert res_eval.status_code == 401

        res_batches = await ac.get("/api/v1/batches")
        assert res_batches.status_code == 401

        res_dashboard = await ac.get("/api/v1/dashboard/metrics")
        assert res_dashboard.status_code == 401

        res_copilot = await ac.post("/api/v1/copilot/chat", json={"message": "test"})
        assert res_copilot.status_code == 401

        # Invalid token must be rejected
        invalid_headers = {"Authorization": "Bearer invalid_token_xyz"}
        res_invalid = await ac.get("/api/v1/batches", headers=invalid_headers)
        assert res_invalid.status_code == 401

