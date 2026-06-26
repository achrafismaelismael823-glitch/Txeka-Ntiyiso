"""
Verification Routes - Endpoints públicos para autenticação de documentos via Hash.

  Contexto Txeka Ntiyiso:
    Qualquer cidadão pode verificar a autenticidade de um documento
    sem necessidade de autenticação. Este é um dos pilares da
    transparência e confiança no sistema nacional de certificação.

  Endpoints:
    - GET /verify/{doc_hash}: Verificação via URL (QR code, links)
    - POST /verify: Verificação via JSON (integrações B2B/B2G)
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
    """
    Verifica a autenticidade de um documento via URL (público).
    
     Casos de uso:
        - Cidadão escaneia QR code no documento físico
        - Link compartilhado via WhatsApp/email
        - Verificação em portal público do INAGE
    
    Args:
        doc_hash: Hash SHA-256 do documento (64 caracteres hex)
        req: Request object para metadados (IP, User-Agent)
        db: Sessão async do SQLAlchemy
    
    Returns:
        VerifyResponse com status (VALID/INVALID/REVOKED) e dados públicos
    
    Raises:
        HTTPException 400: Hash com formato inválido
    """
    #  Validação do hash — deve ter exatamente 64 caracteres hex
    if len(doc_hash) != 64:
        raise HTTPException(status_code=400, detail="Hash SHA-256 deve ter 64 caracteres.")
    
    #  Verificação no serviço de negócio
    service = VerificationService(db)
    result = await service.verify_document(doc_hash.lower())
    
    # REGISTRAR AUDITORIA — Verificação pública GET
    # Nota: Acesso anónimo por design (transparência governamental)
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
    """
    Verifica a autenticidade de um documento via JSON (B2B/B2G).
    
     Casos de uso:
        - Integração com sistemas bancários (KYC)
        - Validação em portais governamentais
        - APIs de terceiros autorizados
    
    Args:
        request: Payload JSON com o hash do documento
        req: Request object para metadados
        db: Sessão async do SQLAlchemy
    
    Returns:
        VerifyResponse com status e dados públicos do documento
    """
    service = VerificationService(db)
    result = await service.verify_document(request.hash.lower())
    
    #  REGISTRAR AUDITORIA — Verificação B2B/B2G POST
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
