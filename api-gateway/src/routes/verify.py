"""
Verification Routes — Verificação pública de documentos via hash.
🇲🇿 Txeka Ntiyiso: GET para QR code/links, POST para B2B/B2G.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from src.core.rate_limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.models.schemas import VerifyResponse, VerifyRequest
from src.services.verification_service import VerificationService
from src.services.audit_service import AuditService

router = APIRouter(tags=["verification"])


@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
@limiter.limit("100/minute")
async def verify_document_get(
    request: Request,
    doc_hash: str,
    db: AsyncSession = Depends(get_db),
) -> VerifyResponse:
    """Verificação pública via URL (QR code, WhatsApp, etc.)."""
    if len(doc_hash) != 64:
        raise HTTPException(status_code=400, detail="Hash SHA-256 deve ter 64 caracteres.")

    service = VerificationService(db)
    result = await service.verify_document(doc_hash.lower())

    # Audit log
    await AuditService.log_verify(
        session=db,
        user_email="anonymous",
        doc_hash=doc_hash.lower(),
        institution_id=result.institution_id if hasattr(result, 'institution_id') else None,
        request=request,
        success=True,
        status_code=200,
        details={"method": "GET", "verified": result.status}
    )

    return result


@router.post("/verify", response_model=VerifyResponse)
@limiter.limit("100/minute")
async def verify_document_post(
    request: Request,
    payload: VerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> VerifyResponse:
    """Verificação B2B/B2G via JSON (bancos, portais gov, APIs)."""
    service = VerificationService(db)
    result = await service.verify_document(payload.hash.lower())

    # Audit log
    await AuditService.log_verify(
        session=db,
        user_email="anonymous",
        doc_hash=payload.hash.lower(),
        institution_id=result.institution_id if hasattr(result, 'institution_id') else None,
        request=request,
        success=True,
        status_code=200,
        details={"method": "POST", "verified": result.status}
    )

    return result
