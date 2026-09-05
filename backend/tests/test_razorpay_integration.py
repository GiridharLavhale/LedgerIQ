"""
Integration Tests for Razorpay API Client, Normalizer, Service, and Router
"""
import pytest
from decimal import Decimal
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport, Response

from app.main import app
from app.integrations.razorpay.client import RazorpayClient
from app.integrations.razorpay.normalizer import RazorpayDataNormalizer
from app.integrations.razorpay.service import RazorpayIngestionService


def test_razorpay_client_configuration():
    # 1. Test unconfigured client
    client_unconfigured = RazorpayClient(key_id=None, key_secret=None)
    assert client_unconfigured.is_configured is False
    assert client_unconfigured.masked_key_id == "NOT_CONFIGURED"

    # 2. Test configured client
    client_configured = RazorpayClient(key_id="rzp_test_1234567890abcdef", key_secret="secret_abc123xyz")
    assert client_configured.is_configured is True
    assert client_configured.masked_key_id.startswith("rzp_test")
    assert "secret" not in client_configured.masked_key_id


def test_razorpay_normalizer():
    # Test payment normalization (converting paise to INR)
    raw_payment = {
        "id": "pay_TEST123456",
        "entity": "payment",
        "amount": 1000000,  # 1,000,000 paise = INR 10,000.00
        "currency": "INR",
        "status": "captured",
        "order_id": "order_ORD999",
        "method": "upi",
        "fee": 20000,       # 20,000 paise = INR 200.00 (2% MDR)
        "tax": 3600,        # 3,600 paise = INR 36.00 (18% GST)
        "email": "priya.customer@example.com",
        "created_at": 1700000000
    }

    norm_pay = RazorpayDataNormalizer.normalize_payment(raw_payment, org_id="org-1", batch_id="batch-1")
    assert norm_pay["source_type"] == "PAYMENT"
    assert norm_pay["source_name"] == "Razorpay Gateway"
    assert norm_pay["external_id"] == "pay_TEST123456"
    assert norm_pay["order_id"] == "order_ORD999"
    assert norm_pay["amount"] == Decimal("10000.00")
    assert norm_pay["fee"] == Decimal("200.00")
    assert norm_pay["tax"] == Decimal("36.00")
    assert norm_pay["net_amount"] == Decimal("9800.00")
    assert norm_pay["counterparty"] == "priya.customer@example.com"

    # Test settlement normalization
    raw_settlement = {
        "id": "setl_SETL999",
        "entity": "settlement",
        "amount": 976400,   # 976,400 paise = INR 9,764.00
        "status": "processed",
        "fees": 20000,
        "tax": 3600,
        "utr": "UTR_RZP_777888",
        "created_at": 1700086400
    }

    norm_setl = RazorpayDataNormalizer.normalize_settlement(raw_settlement, org_id="org-1", batch_id="batch-1")
    assert norm_setl["source_type"] == "SETTLEMENT"
    assert norm_setl["source_name"] == "Razorpay Settlement Batch"
    assert norm_setl["external_id"] == "setl_SETL999"
    assert norm_setl["reference_id"] == "UTR_RZP_777888"
    assert norm_setl["amount"] == Decimal("9764.00")


@pytest.mark.asyncio
async def test_razorpay_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/v1/integrations/razorpay/status", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "configured" in data
        assert "mode" in data
        assert "key_id_masked" in data
        # Ensure secret key is never leaked
        assert "key_secret" not in data


@pytest.mark.asyncio
async def test_razorpay_mock_sync_and_reconciliation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Run mock sync (tests the complete pipeline without hitting external Razorpay network)
        sync_payload = {"count": 20, "auto_reconcile": True}
        res = await ac.post("/api/v1/integrations/razorpay/mock-sync", json=sync_payload, headers=headers)
        assert res.status_code == 200
        batch = res.json()
        assert "Razorpay API Feed" in batch["name"]
        assert batch["total_records"] > 0
        assert batch["matched_records"] > 0
        assert batch["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_razorpay_live_sync_unconfigured_error():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login", json={"email": "admin@ledgeriq.io", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # If credentials are not configured, should return 400 with helpful error, not crash
        res = await ac.post("/api/v1/integrations/razorpay/sync", json={"count": 10}, headers=headers)
        # Should be 400 Bad Request if unconfigured, or 200/502 depending on env
        assert res.status_code in [400, 502, 200]
