"""
Finance Copilot API Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.copilot import CopilotQuery, CopilotResponse
from app.agents.copilot_agent import FinanceCopilotAgent
from app.api.deps import get_current_user

router = APIRouter(prefix="/copilot", tags=["Finance Copilot"])


@router.post("/chat", response_model=CopilotResponse)
async def chat_with_copilot(
    query: CopilotQuery,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = FinanceCopilotAgent(db=db, org_id=current_user.org_id)
    response = await agent.process_query(query)
    return response
