import os
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_optional_current_user
from app.core.database import get_db
from app.models.incident import Incident, IncidentEvidence
from app.models.user import User
from app.schemas.incident import IncidentEvidenceResponse
from app.services.storage import storage_service

router = APIRouter(prefix="/evidence", tags=["Evidence & File Storage"])

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/presigned-url")
async def get_presigned_upload_url(
    file_name: str,
    mime_type: str,
    incident_id: str,
    evidence_type: str = "CITIZEN_SUBMISSION",
):
    """Generate secure temporary presigned upload URL for direct client upload to S3

    or local fallback endpoint.
    """
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{mime_type}'. Allowed types: {ALLOWED_MIME_TYPES}",
        )

    s3_key, upload_url, error = storage_service.generate_upload_url(file_name, mime_type, prefix=f"incidents/{incident_id}")
    return {
        "s3_key": s3_key,
        "upload_url": upload_url,
        "mime_type": mime_type,
    }


@router.post("/upload/{file_path:path}", response_model=IncidentEvidenceResponse)
async def upload_evidence_file(
    file_path: str,
    file: UploadFile = File(...),
    incident_id: str = Form(...),
    evidence_type: str = Form("CITIZEN_SUBMISSION"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Direct file upload handler for development, testing, and backend-mediated storage.

    Enforces file size and MIME type validation, saves bytes, and registers metadata in PostgreSQL.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid MIME type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 5MB limit.")

    # Check incident exists
    inc_res = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = inc_res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Save to storage backend
    s3_key = file_path
    storage_service.save_local_file(s3_key, content)

    # Public download / view URL
    file_url = storage_service.generate_download_url(s3_key)

    evidence = IncidentEvidence(
        incident_id=incident.id,
        uploader_id=current_user.id if current_user else None,
        evidence_type=evidence_type,
        s3_key=s3_key,
        file_name=file.filename or os.path.basename(s3_key),
        file_size=len(content),
        mime_type=file.content_type,
        file_url=file_url,
    )
    db.add(evidence)
    await db.commit()
    await db.refresh(evidence)
    return evidence


@router.get("/file/{file_path:path}")
async def get_evidence_file(file_path: str):
    """Retrieve evidence binary file for viewing."""
    local_path = storage_service.get_local_file(file_path)
    if not local_path or not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Evidence file not found.")

    return FileResponse(local_path)

