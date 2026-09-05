"""
Extended API Tests: Data Sources, Specialized Views, Verification, and Specialized Agents
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_data_sources_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Obtain token for admin
        login_res = await client.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. List data sources (should auto-seed default presets)
        res = await client.get("/api/v1/data-sources", headers=headers)
        assert res.status_code == 200
        sources = res.json()
        assert len(sources) >= 4
        assert any(s["source_type"] == "PAYMENT" for s in sources)

        # 2. Create custom data source
        new_ds = {
            "name": "Custom Stripe Checkout",
            "source_type": "PAYMENT",
            "file_format": "CSV",
            "schema_mapping": {"external_id": "ch_id", "amount": "amount"}
        }
        res_create = await client.post("/api/v1/data-sources", json=new_ds, headers=headers)
        assert res_create.status_code == 201
        created_id = res_create.json()["id"]

        # 3. Delete data source
        res_del = await client.delete(f"/api/v1/data-sources/{created_id}", headers=headers)
        assert res_del.status_code == 204


@pytest.mark.asyncio
async def test_independent_verification_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_res = await client.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Test verified pair: INR 10,000 gross with 2% fee (200) + 18% GST (36) -> Net 9764
        payload_valid = {
            "gross_amount": 10000.0,
            "actual_net_amount": 9764.0,
            "fee_rate": 0.02,
            "gst_rate": 0.18,
            "amount_tolerance": 0.05
        }
        res = await client.post("/api/v1/verification/verify-pair", json=payload_valid, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["is_mathematically_verified"] is True
        assert data["calculated_mdr_fee"] == 200.0
        assert data["calculated_gst_tax"] == 36.0
        assert data["variance_amount"] == 0.0

        # 2. Test mismatched pair: Net 9500 (leakage of 264)
        payload_invalid = {
            "gross_amount": 10000.0,
            "actual_net_amount": 9500.0,
            "fee_rate": 0.02,
            "gst_rate": 0.18
        }
        res_inv = await client.post("/api/v1/verification/verify-pair", json=payload_invalid, headers=headers)
        assert res_inv.status_code == 200
        data_inv = res_inv.json()
        assert data_inv["is_mathematically_verified"] is False
        assert data_inv["variance_amount"] == 264.0

        # 3. Get verification rules
        res_rules = await client.get("/api/v1/verification/rules", headers=headers)
        assert res_rules.status_code == 200
        assert len(res_rules.json()["rules"]) == 4


@pytest.mark.asyncio
async def test_specialized_transaction_views():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_res = await client.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Query payments, settlements, bank-statements, invoices endpoints
        for endpoint in ["/api/v1/transactions", "/api/v1/transactions/payments", "/api/v1/transactions/settlements", "/api/v1/transactions/bank-statements", "/api/v1/transactions/invoices"]:
            res = await client.get(endpoint, headers=headers)
            assert res.status_code == 200
            assert isinstance(res.json(), list)
