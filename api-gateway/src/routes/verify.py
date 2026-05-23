"""
Verify Routes Module - DocVerify MZ

Define os endpoints da API (FastAPI) para submissão e verificação de documentos.
Mapeia as requisições HTTP para os serviços da camada de negócio.
"""

from fastapi import APIRouter, HTTPException, status
from src.models.schemas import (
    DocumentUploadRequest,
    DocumentResponse,
    VerificationResponse
)
from src.services.verification_service import VerificationService

# Instância do router principal para o domínio de verificação
router = APIRouter(prefix="/verify", tags=["Document Verification"])

@router.post(
    "/custody", 
    response_model=DocumentResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Registar Novo Documento",
    description="Recebe os dados de um documento (BI, NUIT, etc.), gera a assinatura SHA-256 e guarda na custódia."
)
async def create_document_custody(request: DocumentUploadRequest):
    """Endpoint para submeter um novo documento à plataforma."""
    try:
        # O Pydantic já validou o 'request' na entrada.
        # Passamos diretamente para a camada de serviço (O Cérebro).
        response = VerificationService.process_new_document(request)
        return response
    except Exception as e:
        # Captura falhas inesperadas para não expor a stack trace ao cliente
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar o documento: {str(e)}"
        )

@router.get(
    "/{document_hash}", 
    response_model=VerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Verificar Autenticidade",
    description="Verifica se um hash criptográfico existe e é válido na plataforma DocVerify MZ."
)
async def verify_document(document_hash: str):
    """Endpoint público para verificação de um hash SHA-256 (via QR Code ou Manual)."""
    # Validação básica de segurança na entrada da rota
    if len(document_hash) != 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de Hash inválido. Um hash SHA-256 deve conter exatamente 64 caracteres."
        )
        
    response = VerificationService.verify_document_hash(document_hash)
    
    # Se a verificação falhar (ex: hash adulterado), retornamos um Erro 404 estruturado
    if not response.verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=response.message
        )
        
    return response
