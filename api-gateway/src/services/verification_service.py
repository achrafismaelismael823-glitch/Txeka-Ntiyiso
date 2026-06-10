"""
Verification Service - Business logic for document authentication and verification.
Refatorado para integração de Logging Estruturado.
Pattern: Repository Pattern with Dependency Injection.
"""

from typing import Final
from src.logger import get_logger
from src.models.schemas import DadosPublicos, VerifyResponse
from src.models.verification_repository import VerificationRepository

# Integrando o Logger Estruturado Global
logger = get_logger(__name__)

class VerificationService:
    """
    Coordinates core document validation workflows against the persistence layer.
    """

    def __init__(self, repo: VerificationRepository) -> None:
        self.repo: Final[VerificationRepository] = repo

    async def verify_document(self, doc_hash: str) -> VerifyResponse:
        """
        Validates a document signature against the database registry.
        """
        logger.info("Iniciando processamento de verificacao", doc_hash=doc_hash[:8])

        # Execução assíncrona para não bloquear o Event Loop
        doc = await self.repo.get_by_hash(doc_hash)

        if not doc:
            logger.warning("Documento nao localizado no registro ativo", doc_hash=doc_hash[:8])
            return VerifyResponse(status="not_found", dados_publicos=None)

        # Prioridade arquitetural: Validar a revogação antes do estado ativo
        if doc.revoked:
            logger.info("Documento identificado como revogado", doc_id=doc.doc_id)
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

        logger.info("Documento autenticado com sucesso", doc_id=doc.doc_id)
        return VerifyResponse(
            status="verified",
            dados_publicos=DadosPublicos(
                doc_id=doc.doc_id,
                document_type=doc.document_type,
                institution_id=doc.institution_id,
                created_at=doc.created_at
            )
        )
