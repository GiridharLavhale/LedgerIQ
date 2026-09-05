"""
Data Sources API Router: Manage Gateways, Bank Feeds, and ERP Connectors
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict
from app.core.database import get_db
from app.models.organization import DataSource, Organization
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


class DataSourceCreate(BaseModel):
    name: str
    source_type: str  # PAYMENT, SETTLEMENT, BANK_STATEMENT, INVOICE
    file_format: str = "CSV"
    schema_mapping: Optional[dict] = {}


class DataSourceResponse(BaseModel):
    id: str
    org_id: str
    name: str
    source_type: str
    file_format: str
    schema_mapping: dict
    is_active: bool
    created_at: str

    model_config = ConfigDict(from_attributes=True)


DEFAULT_PRESETS = [
    {
        "name": "Razorpay Payment Gateway",
        "source_type": "PAYMENT",
        "file_format": "CSV",
        "schema_mapping": {"external_id": "payment_id", "reference_id": "order_id", "amount": "amount", "fee": "fee", "tax": "tax", "date": "created_at"}
    },
    {
        "name": "Razorpay Settlement Batch Feed",
        "source_type": "SETTLEMENT",
        "file_format": "CSV",
        "schema_mapping": {"external_id": "settlement_id", "reference_id": "utr", "amount": "amount", "fee": "fee", "tax": "tax", "date": "settled_at"}
    },
    {
        "name": "HDFC Core Banking Account Statement",
        "source_type": "BANK_STATEMENT",
        "file_format": "CSV",
        "schema_mapping": {"external_id": "narration", "reference_id": "chq_ref_no", "amount": "credit_amount", "date": "value_date"}
    },
    {
        "name": "SAP S/4HANA / OMS Invoices",
        "source_type": "INVOICE",
        "file_format": "JSON",
        "schema_mapping": {"external_id": "invoice_no", "reference_id": "order_number", "amount": "grand_total", "date": "invoice_date"}
    }
]


@router.get("", response_model=List[DataSourceResponse])
async def list_data_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(DataSource).where(DataSource.org_id == current_user.org_id)
    res = await db.execute(stmt)
    sources = res.scalars().all()
    
    # If none exist yet for org, auto-seed default enterprise presets
    if not sources:
        for preset in DEFAULT_PRESETS:
            ds = DataSource(
                org_id=current_user.org_id,
                name=preset["name"],
                source_type=preset["source_type"],
                file_format=preset["file_format"],
                schema_mapping=preset["schema_mapping"],
                is_active=True
            )
            db.add(ds)
        await db.commit()
        res = await db.execute(stmt)
        sources = res.scalars().all()

    return [
        DataSourceResponse(
            id=s.id,
            org_id=s.org_id,
            name=s.name,
            source_type=s.source_type,
            file_format=s.file_format,
            schema_mapping=s.schema_mapping or {},
            is_active=s.is_active,
            created_at=s.created_at.isoformat()
        )
        for s in sources
    ]


@router.post("", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    payload: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ds = DataSource(
        org_id=current_user.org_id,
        name=payload.name,
        source_type=payload.source_type.upper(),
        file_format=payload.file_format.upper(),
        schema_mapping=payload.schema_mapping or {},
        is_active=True
    )
    db.add(ds)
    await db.commit()
    await db.refresh(ds)

    return DataSourceResponse(
        id=ds.id,
        org_id=ds.org_id,
        name=ds.name,
        source_type=ds.source_type,
        file_format=ds.file_format,
        schema_mapping=ds.schema_mapping or {},
        is_active=ds.is_active,
        created_at=ds.created_at.isoformat()
    )


@router.delete("/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    data_source_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(DataSource).where(DataSource.id == data_source_id, DataSource.org_id == current_user.org_id)
    res = await db.execute(stmt)
    ds = res.scalars().first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data Source not found.")
    await db.delete(ds)
    await db.commit()
