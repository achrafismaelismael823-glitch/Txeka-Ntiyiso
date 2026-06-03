"""
Verify Routes - Endpoints para verificação de documentos
"""
import logging
import base64
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from src.core.qr_generator import gerar_qr_code
from src.security import verify_token
from src.models.schemas import VerifyRequest, VerifyResponse
from src.models.verification_service import VerificationService
from src.models.verification_repository import VerificationRepository
from src.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["verification"],
    responses={404: {"description": "Documento não encontrado"}},
)

@router.get("/verify/{doc_hash}", response_model=VerifyResponse, status_code=status.HTTP_200_OK)
async def verify_document_get(
    doc_hash: str,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> VerifyResponse:
    
    if len(doc_hash) != 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash SHA-256 deve ter exactamente 64 caracteres hexadecimais"
        )
    
    if not all(c in '0123456789abcdefABCDEF' for c in doc_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash deve conter apenas caracteres hexadecimais (0-9, a-f)"
        )
    
    doc_hash = doc_hash.lower()
    logger.info(f"Verificação solicitada: {doc_hash[:16]}... por {user.get('email')}")
    
    # Txeka ntiyiso: Injeção de dependência profissional
    repo = VerificationRepository(db)
    service = VerificationService(repo)
    result = service.verify_document(doc_hash)
    
    if result.status == "not_found":
        logger.warning(f"Documento não encontrado: {doc_hash[:16]}...")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento com hash {doc_hash[:16]}... não encontrado"
        )
    
    qr_code_bytes = gerar_qr_code(doc_hash, result.dados_publicos.doc_id if result.dados_publicos else "UNKNOWN")
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
    
    logger.info(f"Documento verificado: {result.status} | {result.dados_publicos.doc_id if result.dados_publicos else 'N/A'}")
    
    return VerifyResponse(
        status=result.status,  # agora retorna "verified" ou "revoked"
        dados_publicos=result.dados_publicos,
        qr_code=qr_code_base64
    )

@router.post("/verify", response_model=VerifyResponse, status_code=status.HTTP_200_OK)
async def verify_document(
    request: VerifyRequest,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> VerifyResponse:
    
    doc_hash = request.doc_hash.lower()
    logger.info(f"Verificação POST: {doc_hash[:16]}... por {user.get('email')}")
    
    # Txeka ntiyiso: Injeção de dependência profissional
    repo = VerificationRepository(db)
    service = VerificationService(repo)
    result = service.verify_document(doc_hash, request.institution_id)
    
    if result.status == "not_found":
        logger.warning(f"Documento POST não encontrado: {doc_hash[:16]}...")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento com hash {doc_hash[:16]}... não encontrado"
        )
    
    qr_code_bytes = gerar_qr_code(doc_hash, result.dados_publicos.doc_id if result.dados_publicos else "UNKNOWN")
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
    
    logger.info(f"Documento POST verificado: {result.status}")
    
    return VerifyResponse(
        status=result.status,
        dados_publicos=result.dados_publicos,
        qr_code=qr_code_base64
    )
