"""
Verification Service - Business logic for document authentication and verification.
Refatorado para alta performance assíncrona e Structured Logging.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.logger import get_logger
from src.models.schemas import DadosPublicos, VerifyResponse
from src.models.models import Document

logger = get_logger(__name__)

class VerificationService:
    """
    Coordena os fluxos de validação de documentos diretamente na camada de persistência.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def verify_document(self, doc_hash: str) -> VerifyResponse:
        """
        Valida a assinatura (hash SHA-256) de um documento contra o banco de dados.
        """
        logger.info("Iniciando processamento de verificacao", doc_hash=doc_hash[:8])

        # Consulta assíncrona utilizando a engine configurado
        result = await self.db.execute(select(Document).where(Document.doc_hash == doc_hash))
        doc = result.scalar_one_or_none()

        if not doc:
            logger.warning("Documento nao localizado no registro ativo", doc_hash=doc_hash[:8])
            return VerifyResponse(status="INVALID", dados_publicos=None)

        # Regra de Negócio: Validar a revogação antes do estado ativo
        if doc.revoked:
            logger.info("Documento identificado como revogado", doc_id=doc.doc_id)
            return VerifyResponse(
                status="REVOKED",
                dados_publicos=DadosPublicos(
                    doc_id=doc.doc_id,
                    document_type=doc.document_type,
                    institution_id=doc.institution_id,
                    created_at=doc.created_at,
                    revoked=True,
                    revoked_at=doc.revoked_at,
                    revoked_reason=doc.revoked_reason
                )
            )

        logger.info("Documento autenticado com sucesso", doc_id=doc.doc_id)
        return VerifyResponse(
            status="VALID",
            dados_publicos=DadosPublicos(
                doc_id=doc.doc_id,
                document_type=doc.document_type,
                institution_id=doc.institution_id,
                created_at=doc.created_at,
                revoked=False,
                revoked_at=None,
                revoked_reason=None
            )
        )
