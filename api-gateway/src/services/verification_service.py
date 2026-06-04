"""
Verification Service - Lógica de negócio para verificação de documentos
Padrão: Repository Pattern + Injeção de Dependência
"""

from datetime import datetime
from typing import Optional
import logging
from src.models.schemas import DadosPublicos, VerifyResponse
from src.models.verification_repository import VerificationRepository

logger = logging.getLogger(__name__)

class VerificationService:
    """Serviço centralizado de verificação com acesso ao DB real"""

    def __init__(self, repo: VerificationRepository):
        self.repo = repo

    def verify_document(self, doc_hash: str, institution_id: Optional[str] = None) -> VerifyResponse:
        """
        Verifica documento no banco real e retorna status correto.
        Retorna: verified | revoked | not_found
        """
        logger.info(f"[VERIFY] Hash: {doc_hash[:8]}...")

        doc = self.repo.get_by_hash(doc_hash)

        if not doc:
            logger.warning(f"[VERIFY] Documento não encontrado: {doc_hash[:8]}")
            return VerifyResponse(status="not_found", dados_publicos=None)

        # Txeka ntiyiso: checa revogação primeiro
        if doc.revoked:
            logger.info(f"[VERIFY] Documento revogado: {doc.doc_id} | Motivo: {doc.revoked_reason}")
            return VerifyResponse(
                status="revoked",
                dados_publicos=DadosPublicos(
                    doc_id=doc.doc_id,
                    document_type=doc.document_type,
                    institution_id=doc.institution_id,
                    created_at=doc.created_at,
                    revoked_at=doc.revoked_at,
                    revoked_reason=doc.revoked_reason
                )
            )

        # Documento válido
        logger.info(f"[VERIFY] Documento verificado: {doc.doc_id}")
        return VerifyResponse(
            status="verified",
            dados_publicos=DadosPublicos(
                doc_id=doc.doc_id,
                document_type=doc.document_type,
                institution_id=doc.institution_id,
                created_at=doc.created_at
            )
        )
