"""
Independent Mathematical Verification Router
Deterministic verification of Gross Payment − MDR Fee − GST = Net Settlement.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.reconciliation.verifier import verify_settlement_decomposition, calculate_fee_and_tax
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/verification", tags=["Independent Verification Engine"])


class VerificationRequest(BaseModel):
    gross_amount: float = Field(..., gt=0, description="Gross Payment Amount in INR")
    actual_net_amount: float = Field(..., gt=0, description="Actual Net Settlement Amount in INR")
    fee_rate: float = Field(default=0.02, ge=0.0, le=0.5, description="MDR fee rate (default 2%)")
    gst_rate: float = Field(default=0.18, ge=0.0, le=0.5, description="GST rate on fee (default 18%)")
    amount_tolerance: float = Field(default=0.05, ge=0.0, description="Permitted rounding tolerance in INR")


class VerificationResult(BaseModel):
    gross_amount: float
    actual_net_amount: float
    fee_rate_pct: float
    gst_rate_pct: float
    calculated_mdr_fee: float
    calculated_gst_tax: float
    total_deductions: float
    expected_net_settlement: float
    variance_amount: float
    is_mathematically_verified: bool
    formula_proof: str
    statutory_breakdown: Dict[str, Any]


@router.post("/verify-pair", response_model=VerificationResult)
async def verify_financial_pair(
    payload: VerificationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Executes independent deterministic verification of settlement payout against gross payment.
    Enforces exact formula: Gross − (Gross × FeeRate) − (MDR × GstRate) = Net.
    """
    is_valid, exp_fee, exp_tax, exp_net, diff = verify_settlement_decomposition(
        gross_amount=payload.gross_amount,
        actual_net=payload.actual_net_amount,
        fee_rate=payload.fee_rate,
        gst_rate=payload.gst_rate,
        tolerance=payload.amount_tolerance
    )

    total_ded = round(exp_fee + exp_tax, 2)
    proof_str = (
        f"₹{payload.gross_amount:,.2f} Gross − ₹{exp_fee:,.2f} MDR ({payload.fee_rate*100:.1f}%) "
        f"− ₹{exp_tax:,.2f} GST ({payload.gst_rate*100:.1f}%) = ₹{exp_net:,.2f} Expected Net. "
        f"Actual Net: ₹{payload.actual_net_amount:,.2f} (Variance: ₹{diff:,.2f}). "
        f"Status: {'VERIFIED RECONCILED' if is_valid else 'DISCREPANCY DETECTED'}."
    )

    return VerificationResult(
        gross_amount=payload.gross_amount,
        actual_net_amount=payload.actual_net_amount,
        fee_rate_pct=payload.fee_rate * 100.0,
        gst_rate_pct=payload.gst_rate * 100.0,
        calculated_mdr_fee=exp_fee,
        calculated_gst_tax=exp_tax,
        total_deductions=total_ded,
        expected_net_settlement=exp_net,
        variance_amount=diff,
        is_mathematically_verified=is_valid,
        formula_proof=proof_str,
        statutory_breakdown={
            "mdr_base": exp_fee,
            "cgst_9pct": round(exp_tax / 2.0, 2),
            "sgst_9pct": round(exp_tax / 2.0, 2),
            "igst_18pct": exp_tax,
            "effective_deduction_rate_pct": round(((total_ded) / payload.gross_amount) * 100.0, 3)
        }
    )


@router.get("/rules")
async def get_verification_rules(current_user: User = Depends(get_current_user)):
    """Returns statutory parameters and tolerances enforced by the independent verifier."""
    return {
        "rules": [
            {
                "rule_id": "RULE-L1-EXACT",
                "name": "Level 1: Exact Unique Identifier Match",
                "confidence": 1.0,
                "description": "Matches exact payment gateway transaction ID or settlement UTR."
            },
            {
                "rule_id": "RULE-L2-COMPOSITE",
                "name": "Level 2: Strict Composite Multi-Field Match",
                "confidence": 0.98,
                "description": "Matches Reference ID + Currency + Exact Amount + Date Delta <= 1 day."
            },
            {
                "rule_id": "RULE-L3-FUZZY",
                "name": "Level 3: Proximity & Sequence Similarity Match",
                "confidence": 0.85,
                "description": "Matches normalized string similarity >= 0.80 within +/- 3 business days window."
            },
            {
                "rule_id": "RULE-L4-SETTLEMENT",
                "name": "Level 4: Statutory Settlement Fee & Tax Decomposition",
                "confidence": 0.96,
                "description": "Decomposes 2% MDR Fee + 18% GST to verify net settlement credit against gross payment."
            }
        ],
        "default_tolerances": {
            "default_fee_rate": 0.02,
            "default_gst_rate": 0.18,
            "max_date_tolerance_days": 3,
            "rounding_tolerance_inr": 0.05
        }
    }
