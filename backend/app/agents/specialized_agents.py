"""
Specialized AI Agents for LedgerIQ:
1. ReconciliationAgent (Macro Batch Analysis & Leakage Detection)
2. ExceptionInvestigationAgent (Root Cause & Audited Resolution Proof)
3. ReportAgent (Executive Financial Summaries & Regulatory Notes)
4. FinanceCopilotAgent (Grounded Conversational Copilot)
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.provider import get_llm_provider, LLMProvider
from app.agents.tools import (
    get_reconciliation_summary,
    get_transaction,
    search_transactions,
    get_exception,
    search_exceptions,
    get_settlement,
    calculate_discrepancy,
    get_batch_metrics,
    get_financial_summary
)
from app.core.logging import logger


class ReconciliationAgent:
    """Agent that synthesizes macro batch variances, settlement health, and fee/tax leakage."""
    def __init__(self, db: AsyncSession, org_id: str, provider: Optional[LLMProvider] = None):
        self.db = db
        self.org_id = org_id
        self.provider = provider or get_llm_provider()

    async def analyze_batch(self, batch_id: str) -> Dict[str, Any]:
        summary = await get_reconciliation_summary(self.db, batch_id)
        if "error" in summary:
            return summary

        open_excs = await search_exceptions(self.db, batch_id=batch_id, limit=5)
        
        system_prompt = (
            "You are the LedgerIQ Reconciliation Agent. Analyze this reconciliation batch run based strictly "
            "on the provided deterministic summary data. Explain the match rate, fee/tax deductions, "
            "and active exception trends. Do not hallucinate any numbers outside the provided data."
        )
        user_prompt = f"Deterministic Batch Summary: {summary}\nTop Flagged Exceptions: {open_excs}"
        
        try:
            ai_commentary = await self.provider.chat_complete(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
        except Exception as e:
            logger.warning(f"AI provider failed, using fallback commentary: {e}")
            ai_commentary = (
                f"Batch {summary.get('name')} processed {summary.get('total_records')} records with a {summary.get('match_rate_pct')}% match rate. "
                f"Total gross volume is INR {summary.get('total_volume_inr'):,.2f} with INR {summary.get('discrepancy_amount_inr'):,.2f} in unresolved variances."
            )

        return {
            "batch_id": batch_id,
            "deterministic_summary": summary,
            "top_exceptions": open_excs,
            "ai_analysis": ai_commentary
        }


class ExceptionInvestigationAgent:
    """Agent that performs deep-dive investigation of an exception, extracting mathematical proof and recommending audited action."""
    def __init__(self, db: AsyncSession, org_id: str, provider: Optional[LLMProvider] = None):
        self.db = db
        self.org_id = org_id
        self.provider = provider or get_llm_provider()

    async def investigate_exception(self, exception_id: str) -> Dict[str, Any]:
        exc_data = await get_exception(self.db, exception_id)
        if "error" in exc_data:
            return exc_data

        txn_data = await get_transaction(self.db, exc_data["transaction_id"])
        
        math_check = calculate_discrepancy(
            gross_amount=exc_data.get("expected_amount_inr", 0.0),
            net_amount=exc_data.get("actual_amount_inr", 0.0)
        )

        system_prompt = (
            "You are the LedgerIQ Exception Investigation Agent. Analyze the financial discrepancy between the payment "
            "and settlement records. Ground your reasoning strictly in the mathematical verification and return: "
            "1. Root Cause Summary, 2. Mathematical Proof, 3. Recommended Operator Action (APPROVE_MATCH, REJECT_MATCH, RESOLVE, REQUEST_BANK_RETRY)."
        )
        user_prompt = f"Exception Data: {exc_data}\nTransaction: {txn_data}\nMathematical Verification: {math_check}"

        try:
            reasoning = await self.provider.chat_complete(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
        except Exception as e:
            reasoning = (
                f"Exception Type: {exc_data.get('exception_type')}. Variance of INR {exc_data.get('difference_amount_inr'):,.2f} "
                f"detected between expected amount INR {exc_data.get('expected_amount_inr'):,.2f} and actual amount INR {exc_data.get('actual_amount_inr'):,.2f}."
            )

        return {
            "exception_id": exception_id,
            "exception_type": exc_data.get("exception_type"),
            "severity": exc_data.get("severity"),
            "mathematical_verification": math_check,
            "recommended_action": exc_data.get("ai_recommended_action", "MANUAL_REVIEW"),
            "investigation_analysis": reasoning
        }


class ReportAgent:
    """Agent that generates executive summaries, variance commentary, and regulatory audit notes for reports."""
    def __init__(self, db: AsyncSession, org_id: str, provider: Optional[LLMProvider] = None):
        self.db = db
        self.org_id = org_id
        self.provider = provider or get_llm_provider()

    async def generate_executive_narrative(self, batch_id: str) -> str:
        summary = await get_reconciliation_summary(self.db, batch_id)
        if "error" in summary:
            return "Unable to generate executive narrative: batch not found."

        system_prompt = (
            "You are the LedgerIQ Executive Report Agent. Write a professional, concise executive reconciliation summary "
            "suitable for the CFO and financial auditors. Highlight total processed volume, match rate %, statutory MDR/GST deductions, "
            "and unresolved variance exposure."
        )
        user_prompt = f"Batch Financial Metrics: {summary}"

        try:
            return await self.provider.chat_complete(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
        except Exception:
            return (
                f"Executive Financial Summary for {summary.get('name')}:\n"
                f"The platform reconciled {summary.get('total_records')} canonical records with a {summary.get('match_rate_pct')}% match rate. "
                f"Total gross volume stands at INR {summary.get('total_volume_inr'):,.2f} with total discrepancy of INR {summary.get('discrepancy_amount_inr'):,.2f}."
            )
