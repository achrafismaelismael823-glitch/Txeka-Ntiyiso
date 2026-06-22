"""
Verification Routes - Unified endpoints for document authentication via Hash.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.models.schemas import VerifyResponse, VerifyRequest
from src.security import verify_token
from src.services.verification_service import VerificationService
from src.services.audit_service import AuditService

router = APIRouter(tags=["verification"])

@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
async def verify_document_get(
    doc_hash: str,
    req: Request,
    db: AsyncSession = Depends(get_db),  
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """Verifica a autenticidade de um documento através do parâmetro de URL (GET)."""
    if len(doc_hash) != 64:
        raise HTTPException(status_code=400, detail="O hash SHA-256 deve conter exatamente 64 caracteres.")
        
    service = VerificationService(db)
    result = await service.verify_document(doc_hash.lower())
    
    # ✅ REGISTRAR AUDITORIA — Verificação GET
    await AuditService.log_verify(
        session=db,
        user_email=current_user.get("sub", "unknown"),
        doc_hash=doc_hash.lower(),
        institution_id=result.institution_id if hasattr(result, 'institution_id') else None,
        request=req,
        success=True,
        status_code=200,
        details={"method": "GET", "verified": result.status if hasattr(result, 'status') else "unknown"}
    )
    
    return result


@router.post("/verify", response_model=VerifyResponse)
async def verify_document_post(
    request: VerifyRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),  
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """Verifica a autenticidade de um documento via payload JSON (Integrações B2B/B2G)."""
    service = VerificationService(db)
    result = await service.verify_document(request.hash.lower())
    
    # ✅ REGISTRAR AUDITORIA — Verificação POST
    await AuditService.log_verify(
        session=db,
        user_email=current_user.get("sub", "unknown"),
        doc_hash=request.hash.lower(),
        institution_id=result.institution_id if hasattr(result, 'institution_id') else None,
        request=req,
        success=True,
        status_code=200,
        details={"method": "POST", "verified": result.status if hasattr(result, 'status') else "unknown"}
    )
    
    return result
