"""
Module: verification_service.py
Description: Business logic for document authentication and verification.
Pattern: Repository Pattern with Dependency Injection.
"""

import logging
from typing import Final
from src.models.schemas import DadosPublicos, VerifyResponse
from src.models.verification_repository import VerificationRepository

logger = logging.getLogger("uvicorn")


class VerificationService:
    """
    Coordinates core document validation workflows against the persistence layer.
    """

    def __init__(self, repo: VerificationRepository) -> None:
        """
        Initializes the service with an injected repository instance.
        """
        self.repo: Final[VerificationRepository] = repo

    async def verify_document(self, doc_hash: str) -> VerifyResponse:
        """
        Validates a document signature against the database registry.

        Args:
            doc_hash (str): The SHA-256 signature of the target document.

        Returns:
            VerifyResponse: Object containing the resolution status and public metadata.
        """
        logger.info(
            f"[INFO] TXEKA NTIYISO: Iniciando processamento de verificacao. Hash={doc_hash[:8]}"
        )

        # A execucao assincrona impede o bloqueio da event loop no gateway
        doc = await self.repo.get_by_hash(doc_hash)

        if not doc:
            logger.warning(
                f"[WARN] TXEKA NTIYISO: Documento nao localizado no registro ativo. Hash={doc_hash[:8]}"
            )
            return VerifyResponse(status="not_found", dados_publicos=None)

        # Prioridade arquitetural: Validar a revogacao antes do estado ativo
        if doc.revoked:
            logger.info(
                f"[INFO] TXEKA NTIYISO: Documento identificado como revogado. ID={doc.doc_id}"
            )
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

        logger.info(
            f"[INFO] TXEKA NTIYISO: Documento autenticado com sucesso. ID={doc.doc_id}"
        )
        return VerifyResponse(
            status="verified",
            dados_publicos=DadosPublicos(
                doc_id=doc.doc_id,
                document_type=doc.document_type,
                institution_id=doc.institution_id,
                created_at=doc.created_at
            )
        )
