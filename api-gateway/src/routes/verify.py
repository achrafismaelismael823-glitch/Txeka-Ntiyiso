"""
Verify Routes - Endpoints para verificação de documentos
"""
import logging
import base64
from fastapi import APIRouter, HTTPException, status, Depends

from src.core.qr_generator import gerar_qr_code
from src.security import verify_token, verify_scopes
from src.models.schemas import VerifyRequest, VerifyResponse
from src.services.verification_service import VerificationService

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["verification"],
    responses={404: {"description": "Documento não encontrado"}},
)

verification_service = VerificationService()

@router.get("/verify/{doc_hash}", response_model=VerifyResponse, status_code=status.HTTP_200_OK)
async def verify_document_get(
    doc_hash: str,
    user: dict = Depends(verify_token)
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
    
    result = verification_service.verify_document(doc_hash)
    
    if result.get("status") == "not_found":
        logger.warning(f"Documento não encontrado: {doc_hash[:16]}...")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento com hash {doc_hash[:16]}... não encontrado"
        )
    
    qr_code_bytes = gerar_qr_code(doc_hash, result.get("dados_publicos", {}).get("doc_id", "UNKNOWN"))
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
    
    logger.info(f"Documento verificado com sucesso: {result.get('dados_publicos', {}).get('doc_id')}")
    
    return VerifyResponse(
        status="success",
        dados_publicos=result.get("dados_publicos"),
        qr_code=qr_code_base64
    )

@router.post("/verify", response_model=VerifyResponse, status_code=status.HTTP_200_OK)
async def verify_document(
    request: VerifyRequest,
    user: dict = Depends(verify_token)
) -> VerifyResponse:
    
    if len(request.doc_hash) != 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash SHA-256 deve ter exactamente 64 caracteres hexadecimais"
        )
    
    if not all(c in '0123456789abcdefABCDEF' for c in request.doc_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash deve conter apenas caracteres hexadecimais"
        )
    
    doc_hash = request.doc_hash.lower()
    
    logger.info(f"Verificação POST: {doc_hash[:16]}... por {user.get('email')}")
    
    result = verification_service.verify_document(doc_hash, request.institution_id)
    
    if result.get("status") == "not_found":
        logger.warning(f"Documento POST não encontrado: {doc_hash[:16]}...")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento com hash {doc_hash[:16]}... não encontrado"
        )
    
    qr_code_bytes = gerar_qr_code(doc_hash, result.get("dados_publicos", {}).get("doc_id", "UNKNOWN"))
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
    
    logger.info(f"Documento POST verificado: {result.get('dados_publicos', {}).get('doc_id')}")
    
    return VerifyResponse(
        status="success",
        dados_publicos=result.get("dados_publicos"),
        qr_code=qr_code_base64
    )
