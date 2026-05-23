"""
Verification Service - Lógica de negócio para verificação de documentos
"""

from datetime import datetime
from typing import Optional
import logging

from src.models.schemas import DadosPublicos, VerifyResponse
from src.config import settings

logger = logging.getLogger(__name__)


class VerificationService:
    """Serviço centralizado de verificação de documentos"""
    
    # Simulação de ledger distribuído (será substituído por base de dados real)
    MOCK_LEDGER = {
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": {
            "doc_id": "DUAT-INAGE-2026",
            "instituicao": "INAGE - Instituto Nacional de Gestão de Educação",
            "estado": "ativo",
            "revogado": False,
            "data_verificacao": datetime(2026, 5, 23, 15, 30, 0)
        }
    }
    
    @staticmethod
    def verify_document(doc_hash: str, institution_id: Optional[str] = None) -> VerifyResponse:
        """
        Verifica a autenticidade de um documento através do seu hash SHA-256.
        
        Args:
            doc_hash: Hash SHA-256 do documento (64 caracteres)
            institution_id: ID opcional da instituição
            
        Returns:
            VerifyResponse com status e dados públicos se encontrado
        """
        logger.info(f"Verificando documento com hash: {doc_hash[:8]}...")
        
        # Procura no ledger simulado
        if doc_hash in VerificationService.MOCK_LEDGER:
            dados = VerificationService.MOCK_LEDGER[doc_hash]
            dados_publicos = DadosPublicos(**dados)
            
            logger.info(f"Documento encontrado: {dados_publicos.doc_id}")
            
            return VerifyResponse(
                status="success",
                dados_publicos=dados_publicos
            )
        
        logger.warning(f"Documento não encontrado: {doc_hash}")
        
        return VerifyResponse(
            status="not_found",
            dados_publicos=None
        )
    
    @staticmethod
    def register_document(doc_hash: str, doc_id: str, instituicao: str) -> bool:
        """
        Registra um novo documento no ledger (placeholder para futuro).
        
        Args:
            doc_hash: Hash SHA-256 do documento
            doc_id: Identificador do documento
            instituicao: Nome da instituição
            
        Returns:
            True se registrado com sucesso
        """
        logger.info(f"Registrando documento {doc_id} com hash {doc_hash[:8]}...")
        # Implementação futura com persistência real
        return True
