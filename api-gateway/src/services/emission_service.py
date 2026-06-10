"""
Emission Service - Core business logic for document certification.
Refatorado para Padrões Enterprise: Transações ACID, Structured Logging e Custom Exceptions.
"""

import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.logger import get_logger
from src.exceptions import (
    TxekaNtiyisoException,
    InsufficientCreditsError,
    DocumentNotFoundError
)
from src.models.models import Document, Institution
from src.settings import settings

# Logger estruturado configurado na Fase 1
logger = get_logger(__name__)

class EmissionService:
    def __init__(self, db: Session):
        self.db = db
        logger.debug("EmissionService initialized")

    def generate_doc_id(self, institution_id: str, document_type: str) -> str:
        """Gera um identificador único de documento."""
        # Uso atualizado de timezone UTC 
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:6].upper()
        doc_id = f"{document_type}-{institution_id}-{timestamp}-{unique_id}"
        logger.debug("Generated doc_id", doc_id=doc_id)
        return doc_id

    def certify_document(
        self,
        institution_id: str,
        document_type: str,
        file_name: str,
        content: str,
        issued_by: str
    ) -> Dict[str, Any]:
        """
        Certifica um documento com validação completa e persistência ACID.
        """
        # Logging Estruturado 
        logger.info(
            "Certification starting",
            institution_id=institution_id,
            document_type=document_type,
            file_name=file_name,
            issued_by=issued_by
        )

        try:
            # ACID: with_for_update() bloqueia a linha da instituição até o fim da transação.
            .
            institution = self.db.query(Institution).with_for_update().filter(
                Institution.id == institution_id
            ).first()

            if not institution:
                logger.error("Institution not found", institution_id=institution_id)
                raise TxekaNtiyisoException(
                    message=f"Instituição '{institution_id}' não encontrada.", 
                    status_code=404
                )

            if institution.status != "active":
                logger.error("Institution suspended", institution_id=institution_id, status=institution.status)
                raise TxekaNtiyisoException(
                    message="Instituição suspensa ou inativa.", 
                    status_code=403
                )

            if institution.credits <= 0:
                logger.warning("Insufficient credits", institution_id=institution_id, credits=institution.credits)
                raise InsufficientCreditsError(institution_id=institution_id)

            # Cálculo de Hash SHA-256
            hash_sha256 = hashlib.sha256(content.encode()).hexdigest()

            # Prevenção de duplicatas
            existing = self.db.query(Document).filter(Document.doc_hash == hash_sha256).first()
            if existing:
                logger.error("Duplicate hash detected", existing_doc_id=existing.doc_id, new_file=file_name)
                raise TxekaNtiyisoException(
                    message="Este documento já se encontra certificado no sistema.", 
                    status_code=409
                )

            # Dedução atômica de créditos
            doc_id = self.generate_doc_id(institution_id, document_type)
            institution.credits -= 1
            institution.docs_emitted_month += 1
            
            logger.info(
                "Credits deducted", 
                institution_id=institution_id, 
                remaining=institution.credits
            )

            # Criação do Registro
            document = Document(
                doc_id=doc_id,
                doc_hash=hash_sha256,
                document_type=document_type,
                institution_id=institution_id,
                file_name=file_name,
                issued_by=issued_by,
                certificate_url=f"https://verify.txekantiyiso.gov.mz/{doc_id}",
                qr_code=f"QR_{doc_id}"
            )

            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            logger.info(
                "Document certified successfully",
                doc_id=doc_id,
                institution_id=institution_id
            )

            return {
                "doc_id": document.doc_id,
                "certificate_url": document.certificate_url,
                "credits_remaining": institution.credits
            }
            
        except TxekaNtiyisoException:
            
            self.db.rollback()
            raise
        except SQLAlchemyError as e:
            # Exceções críticas de banco de dados
            self.db.rollback()
            logger.error("Database integrity error", error=str(e), exc_info=True)
            raise TxekaNtiyisoException(
                message="Erro de integridade na base de dados durante a emissão.", 
                status_code=500
            )
        except Exception as e:
            self.db.rollback()
            logger.error("Unexpected certification error", error=str(e), exc_info=True)
            raise TxekaNtiyisoException(
                message="Ocorreu um erro interno inesperado ao certificar o documento.", 
                status_code=500
            )

    def get_document_by_id(self, doc_id: str) -> Optional[Document]:
        logger.debug("Querying document by id", doc_id=doc_id)
        return self.db.query(Document).filter(Document.doc_id == doc_id).first()

    def get_document_by_hash(self, hash_sha256: str) -> Optional[Document]:
        logger.debug("Querying document by hash", hash_sha256=hash_sha256[:16])
        return self.db.query(Document).filter(Document.doc_hash == hash_sha256).first()
