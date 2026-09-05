"""
Scoring and Fuzzy String Distance Algorithms
"""
import difflib
from datetime import datetime
from typing import Tuple, Any


def calculate_string_similarity(str1: str, str2: str) -> float:
    """Calculate SequenceMatcher similarity ratio between two reference strings."""
    if not str1 or not str2:
        return 0.0
    s1 = str1.strip().upper()
    s2 = str2.strip().upper()
    if s1 == s2:
        return 1.0
    # Substring check: if one is completely contained in the other
    if len(s1) >= 6 and (s1 in s2 or s2 in s1):
        return 0.92
    return difflib.SequenceMatcher(None, s1, s2).ratio()


def calculate_date_difference(dt1: Any, dt2: Any) -> int:
    """Calculate absolute difference in calendar days between two dates or date strings."""
    if not dt1 or not dt2:
        return 999
    
    def to_date(d):
        if isinstance(d, str):
            try:
                d = datetime.fromisoformat(d.replace("Z", "+00:00"))
            except Exception:
                try:
                    d = datetime.strptime(d[:10], "%Y-%m-%d")
                except Exception:
                    return None
        if hasattr(d, "date"):
            return d.date()
        return d

    d1 = to_date(dt1)
    d2 = to_date(dt2)
    if not d1 or not d2:
        return 999
    return abs((d1 - d2).days)


def calculate_amount_similarity(amt1: float, amt2: float, tolerance: float = 0.05) -> Tuple[bool, float]:
    """Check if amounts are within tolerance."""
    diff = abs(amt1 - amt2)
    is_exact = diff <= tolerance
    if amt1 == 0:
        return is_exact, diff
    similarity = max(0.0, 1.0 - (diff / max(abs(amt1), 1.0)))
    return is_exact, diff
