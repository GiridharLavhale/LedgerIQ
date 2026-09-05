"""
File Ingestion and Schema Mapping API Router
"""
import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.batch import Upload
from app.schemas.batch import UploadOut
from app.reconciliation.normalizer import FinancialDataNormalizer, map_columns
from app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/uploads", tags=["Uploads & Ingestion"])

UPLOAD_DIR = os.path.join(os.getcwd(), "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=UploadOut)
async def upload_file(
    file: UploadFile = File(...),
    source_type: str = Form("PAYMENT"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN.value, UserRole.FINANCE_MANAGER.value, UserRole.FINANCE_ANALYST.value]))
):
    """
    Accepts CSV, XLSX, or JSON file, parses schema, extracts metadata and saves upload record.
    """
    filename = file.filename or "unknown_file.csv"
    ext = filename.split(".")[-1].upper() if "." in filename else "CSV"

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    try:
        df = FinancialDataNormalizer.parse_file_content(content, filename)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse file: {str(e)}")

    headers = [str(c) for c in df.columns]
    mapping = map_columns(headers)

    # Save to disk for durability
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.org_id}_{filename}")
    with open(file_path, "wb") as f:
        f.write(content)

    upload_record = Upload(
        org_id=current_user.org_id,
        filename=filename,
        file_type=ext,
        source_type=source_type.upper(),
        row_count=len(df),
        raw_file_path=file_path,
        detected_columns=headers,
        mapping_applied=mapping
    )
    db.add(upload_record)
    await db.commit()
    await db.refresh(upload_record)

    await log_audit_event(
        db=db,
        user=current_user,
        action="FILE_UPLOADED",
        target_entity="UPLOAD",
        target_id=upload_record.id,
        new_state={"filename": filename, "row_count": len(df), "source_type": source_type},
        details=f"Uploaded {filename} with {len(df)} rows"
    )

    return upload_record
