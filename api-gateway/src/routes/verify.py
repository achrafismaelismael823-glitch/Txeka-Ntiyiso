"""
Verification Routes - Public endpoints for document authentication.
Qualquer cidadão pode verificar sem autenticação.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.models.schemas import VerifyResponse, VerifyRequest
from src.services.verification_service import VerificationService
from src.services.audit_service import AuditService

router = APIRouter(tags=["verification"])


@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
async def verify_document_get(
    doc_hash: str,
    req: Request,
    db: AsyncSession = Depends(get_db),
) -> VerifyResponse:
    """Verifica a autenticidade de um documento via URL (público)."""
    if len(doc_hash) != 64:
        raise HTTPException(status_code=400, detail="Hash SHA-256 deve ter 64 caracteres.")
        
    service = VerificationService(db)
    result = await service.verify_document(doc_hash.lower())
    
    await AuditService.log_verify(
        session=db,
        user_email="anonymous",
        doc_hash=doc_hash.lower(),
        institution_id=result.institution_id if hasattr(result, 'institution_id') else None,
        request=req,
        success=True,
        status_code=200,
        details={"method": "GET", "verified": result.status}
    )
    
    return result


@router.post("/verify", response_model=VerifyResponse)
async def verify_document_post(
    request: VerifyRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
) -> VerifyResponse:
    """Verifica a autenticidade via JSON (público)."""
    service = VerificationService(db)
    result = await service.verify_document(request.hash.lower())
    
    await AuditService.log_verify(
        session=db,
        user_email="anonymous",
        doc_hash=request.hash.lower(),
        institution_id=result.institution_id if hasattr(result, 'institution_id') else None,
        request=req,
        success=True,
        status_code=200,
        details={"method": "POST", "verified": result.status}
    )
    
    return result
