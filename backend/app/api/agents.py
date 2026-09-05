"""
Specialized Agents API Router: Direct trigger for Reconciliation, Exception, and Report Agents
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.agents.specialized_agents import (
    ReconciliationAgent,
    ExceptionInvestigationAgent,
    ReportAgent
)

router = APIRouter(prefix="/agents", tags=["Specialized AI Agents"])


class BatchAnalysisRequest(BaseModel):
    batch_id: str


class ExceptionInvestigationRequest(BaseModel):
    exception_id: str


class ReportNarrativeRequest(BaseModel):
    batch_id: str


@router.post("/reconciliation-agent/analyze")
async def run_reconciliation_agent(
    payload: BatchAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = ReconciliationAgent(db=db, org_id=current_user.org_id)
    res = await agent.analyze_batch(payload.batch_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/exception-agent/investigate")
async def run_exception_agent(
    payload: ExceptionInvestigationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = ExceptionInvestigationAgent(db=db, org_id=current_user.org_id)
    res = await agent.investigate_exception(payload.exception_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/report-agent/narrative")
async def run_report_agent(
    payload: ReportNarrativeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = ReportAgent(db=db, org_id=current_user.org_id)
    narrative = await agent.generate_executive_narrative(payload.batch_id)
    return {"batch_id": payload.batch_id, "executive_narrative": narrative}
