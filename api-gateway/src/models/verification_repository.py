"""
Verification Repository - Acesso ao banco de dados real
"""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
import logging
from datetime import datetime

from src.models import Document

logger = logging.getLogger(__name__)

class DocumentEntity:
    def __init__(
        self,
        doc_id: str,
        document_type: str,
        institution_id: str,
        created_at: datetime,
        revoked: bool,
        revoked_at: Optional[datetime],
        revoked_reason: Optional[str]
    ):
        self.doc_id = doc_id
        self.document_type = document_type
        self.institution_id = institution_id
        self.created_at = created_at
        self.revoked = revoked
        self.revoked_at = revoked_at
        self.revoked_reason = revoked_reason

class VerificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_hash(self, doc_hash: str) -> Optional[DocumentEntity]:
        logger.info(f" Buscando hash: {doc_hash[:8]}...")
        try:
            stmt = select(Document).where(Document.doc_hash == doc_hash)
            result = self.db.execute(stmt).scalar_one_or_none()

            if not result:
                logger.warning(f" Hash não encontrado: {doc_hash[:8]}")
                return None

            return DocumentEntity(
                doc_id=result.doc_id,
                document_type=result.document_type,
                institution_id=result.institution_id,
                created_at=result.created_at,
                revoked=getattr(result, 'revoked', False),
                revoked_at=getattr(result, 'revoked_at', None),
                revoked_reason=getattr(result, 'revoked_reason', None)
            )
        except Exception as e:
            logger.error(f" Erro ao buscar hash: {e}")
            return None
