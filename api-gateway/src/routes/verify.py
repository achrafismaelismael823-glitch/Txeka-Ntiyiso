"""
Verify Routes - Endpoints para verificação de documentos
"""

from fastapi import APIRouter, HTTPException, status
import logging
import base64
from src.core import gerar_qr_code

from src.models.schemas import VerifyRequest, VerifyResponse
from src.services.verification_service import VerificationService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/verify",
    tags=["verification"],
    responses={404: {"description": "Documento não encontrado"}},
)


@router.post(
    "",
    response_model=VerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Verificar documento pelo hash",
    description="Verifica a autenticidade de um documento através do seu hash SHA-256"
)
async def verify_document(request: VerifyRequest) -> VerifyResponse:
    """
    Endpoint principal de verificação de documentos.
    
    Recebe um hash SHA-256 de um documento e retorna os dados públicos
    se o documento estiver registrado no ledger.
    """
    try:
        resultado = VerificationService.verify_document(
            doc_hash=request.doc_hash,
            institution_id=request.institution_id
        )
        
        if resultado.status == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Documento com hash {request.doc_hash} não encontrado no ledger"
            )
        
        return resultado
        
    except Exception as e:
        logger.error(f"Erro ao verificar documento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao verificar documento"
        )


@router.get(
    "/{doc_hash}",
    response_model=VerifyResponse,
    summary="Verificar documento pelo hash (GET)",
    description="Forma alternativa de verificação usando método GET"
)
async def verify_document_get(doc_hash: str) -> VerifyResponse:
    """
    Endpoint alternativo que permite verificação através de GET request.
    Útil para QR codes e URLs diretas.
    """
    if len(doc_hash) != 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hash SHA-256 deve ter exactamente 64 caracteres hexadecimais"
        )
    
    resultado = VerificationService.verify_document(doc_hash)
    
    if resultado.status == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento com hash {doc_hash} não encontrado"
        )
    
    #  NOVO: Gerar QR code se documento foi encontrado
    if resultado.status == "success" and resultado.dados_publicos:
        try:
            qr_bytes = gerar_qr_code(
                doc_hash=doc_hash,
                doc_id=resultado.dados_publicos.doc_id
            )
            # Converter para base64
            qr_base64 = base64.b64encode(qr_bytes).decode('utf-8')
            resultado.qr_code = f"data:image/png;base64,{qr_base64}"
            logger.info(f"QR code gerado para documento {doc_hash}")
        except Exception as e:
            logger.warning(f"Erro ao gerar QR code: {str(e)}")
            # Continua mesmo sem QR code (não quebra o fluxo)
    
    return resultado
