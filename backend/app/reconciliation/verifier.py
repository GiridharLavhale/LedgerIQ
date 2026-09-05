"""
Financial Calculation and Verification Utilities (Fee/Tax Decomposition)
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Dict, Any


def round_curr(val: float) -> float:
    """Round currency to 2 decimal places using standard banker's/commercial half-up rounding."""
    d = Decimal(str(val))
    return float(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def calculate_fee_and_tax(
    gross_amount: float,
    fee_rate: float = 0.02,  # 2.0% MDR
    gst_rate: float = 0.18   # 18% GST on MDR
) -> Tuple[float, float, float]:
    """
    Decomposes gross payment into:
    1. MDR Fee = Gross * fee_rate
    2. Tax = Fee * gst_rate
    3. Net Settlement = Gross - Fee - Tax
    
    Example: 10,000 gross -> 200.0 fee, 36.0 tax -> 9764.0 net
    """
    fee = round_curr(gross_amount * fee_rate)
    tax = round_curr(fee * gst_rate)
    net = round_curr(gross_amount - fee - tax)
    return fee, tax, net


def verify_settlement_decomposition(
    gross_amount: float,
    actual_net: float,
    fee_rate: float = 0.02,
    gst_rate: float = 0.18,
    tolerance: float = 0.05
) -> Tuple[bool, float, float, float, float]:
    """
    Verifies if actual_net matches expected gross - fee - tax.
    Returns (is_valid, expected_fee, expected_tax, expected_net, difference).
    """
    exp_fee, exp_tax, exp_net = calculate_fee_and_tax(gross_amount, fee_rate, gst_rate)
    diff = round_curr(abs(actual_net - exp_net))
    is_valid = diff <= tolerance
    return is_valid, exp_fee, exp_tax, exp_net, diff
