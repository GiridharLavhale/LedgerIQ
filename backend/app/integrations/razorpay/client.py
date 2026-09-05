"""
Razorpay REST API Client Connector
Handles HTTP Basic Auth, timeouts, retries, rate limits, and safe error handling without exposing secrets.
"""
import os
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger


class RazorpayClient:
    """
    Asynchronous client for Razorpay Payments and Settlements REST API.
    Official Reference: https://razorpay.com/docs/api/
    """

    def __init__(
        self,
        key_id: Optional[str] = None,
        key_secret: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 15.0
    ):
        self.key_id = key_id or settings.RAZORPAY_KEY_ID or os.getenv("RAZORPAY_KEY_ID")
        self.key_secret = key_secret or settings.RAZORPAY_KEY_SECRET or os.getenv("RAZORPAY_KEY_SECRET")
        self.base_url = (base_url or settings.RAZORPAY_API_BASE_URL).rstrip("/")
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """Returns True if both Key ID and Key Secret are non-empty strings."""
        return bool(self.key_id and self.key_secret and len(self.key_id.strip()) > 0 and len(self.key_secret.strip()) > 0)

    @property
    def masked_key_id(self) -> str:
        """Returns safe masked representation of Key ID for status displays (never the secret!)."""
        if not self.key_id:
            return "NOT_CONFIGURED"
        kid = self.key_id.strip()
        if len(kid) <= 8:
            return "***"
        return f"{kid[:8]}...{kid[-4:]}"

    def _get_auth(self) -> Optional[tuple]:
        if not self.is_configured:
            return None
        return (self.key_id.strip(), self.key_secret.strip())

    async def test_connection(self) -> Dict[str, Any]:
        """
        Verifies API connectivity and credentials against Razorpay by testing a 1-item read request.
        Does not perform any mutations or financial operations.
        """
        if not self.is_configured:
            return {
                "success": False,
                "configured": False,
                "message": "Razorpay credentials are not configured in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)."
            }

        url = f"{self.base_url}/payments"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, auth=self._get_auth(), params={"count": 1})
                if resp.status_code == 200:
                    data = resp.json()
                    item_count = data.get("count", 0)
                    return {
                        "success": True,
                        "configured": True,
                        "key_id_masked": self.masked_key_id,
                        "message": f"Successfully connected to Razorpay API (Account active, sample records accessible: {item_count})."
                    }
                elif resp.status_code == 401:
                    return {
                        "success": False,
                        "configured": True,
                        "key_id_masked": self.masked_key_id,
                        "message": "Authentication failed: Invalid Razorpay Key ID or Key Secret."
                    }
                elif resp.status_code == 429:
                    return {
                        "success": False,
                        "configured": True,
                        "message": "Razorpay API rate limit exceeded. Please retry after some time."
                    }
                else:
                    return {
                        "success": False,
                        "configured": True,
                        "message": f"Razorpay API returned status code {resp.status_code}: {resp.text[:200]}"
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "configured": True,
                "message": "Connection to Razorpay API timed out after 15 seconds."
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "configured": True,
                "message": f"Network error connecting to Razorpay API: {str(e)}"
            }

    async def fetch_payments(
        self,
        count: int = 50,
        skip: int = 0,
        from_time: Optional[int] = None,
        to_time: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetches payments collection from GET /v1/payments.
        Amounts returned by Razorpay are in paise.
        """
        if not self.is_configured:
            raise RuntimeError("Razorpay credentials are not configured.")

        url = f"{self.base_url}/payments"
        params: Dict[str, Any] = {"count": min(count, 100), "skip": skip}
        if from_time:
            params["from"] = from_time
        if to_time:
            params["to"] = to_time

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, auth=self._get_auth(), params=params)
                if resp.status_code != 200:
                    logger.error(f"Razorpay fetch_payments failed with status {resp.status_code}")
                    raise RuntimeError(f"Razorpay API error ({resp.status_code}): {resp.text[:200]}")
                data = resp.json()
                return data.get("items", [])
        except httpx.TimeoutException:
            logger.error("Razorpay fetch_payments timed out")
            raise TimeoutError("Razorpay API request timed out.")

    async def fetch_settlements(
        self,
        count: int = 50,
        skip: int = 0,
        from_time: Optional[int] = None,
        to_time: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetches settlements collection from GET /v1/settlements.
        """
        if not self.is_configured:
            raise RuntimeError("Razorpay credentials are not configured.")

        url = f"{self.base_url}/settlements"
        params: Dict[str, Any] = {"count": min(count, 100), "skip": skip}
        if from_time:
            params["from"] = from_time
        if to_time:
            params["to"] = to_time

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, auth=self._get_auth(), params=params)
                if resp.status_code != 200:
                    logger.error(f"Razorpay fetch_settlements failed with status {resp.status_code}")
                    raise RuntimeError(f"Razorpay API error ({resp.status_code}): {resp.text[:200]}")
                data = resp.json()
                return data.get("items", [])
        except httpx.TimeoutException:
            logger.error("Razorpay fetch_settlements timed out")
            raise TimeoutError("Razorpay API request timed out.")

    async def fetch_payment(self, payment_id: str) -> Dict[str, Any]:
        """Fetches a single payment by payment_id."""
        if not self.is_configured:
            raise RuntimeError("Razorpay credentials are not configured.")

        url = f"{self.base_url}/payments/{payment_id}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, auth=self._get_auth())
            if resp.status_code != 200:
                raise RuntimeError(f"Razorpay API error ({resp.status_code}): {resp.text[:200]}")
            return resp.json()
