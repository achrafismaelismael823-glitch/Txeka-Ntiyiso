"""
Emission Service - Core business logic for document certification.
Refatorado para Padrões Enterprise: Transações Assíncronas ACID e Emissão em Massa (Bulk).
"""

import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError

from src.logger import get_logger
from src.exceptions import TxekaNtiyisoException, InsufficientCreditsError
from src.models.models import Document, Institution

logger = get_logger(__name__)

class EmissionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        logger.debug("EmissionService initialized")

    def generate_doc_id(self, institution_id: str, document_type: str) -> str:
        """Gera um identificador único de documento no padrão do ecossistema."""
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:6].upper()
        return f"{document_type.upper()}-{institution_id.upper()}-{timestamp}-{unique_id}"

    async def certify_document(
        self,
        institution_id: str,
        document_type: str,
        file_name: str,
        content: str,
        issued_by: str
    ) -> Dict[str, Any]:
        """
        Certifica um único documento com validação completa e persistência assíncrona ACID.
        """
        logger.info("Certification starting", institution_id=institution_id, document_type=document_type, file_name=file_name)

        try:
            # Bloqueio pessimista (with_for_update) assíncrono para garantir consistência de créditos
            result = await self.db.execute(
                select(Institution).where(Institution.id == institution_id).with_for_update()
            )
            institution = result.scalar_one_or_none()

            if not institution:
                raise TxekaNtiyisoException(message=f"Instituição '{institution_id}' não encontrada.", status_code=404)

            if institution.status != "active":
                raise TxekaNtiyisoException(message="Instituição suspensa ou inativa.", status_code=403)

            if institution.credits <= 0:
                raise InsufficientCreditsError(institution_id=institution_id)

            # Geração de Hash Único
            hash_sha256 = hashlib.sha256(content.encode()).hexdigest()

            # Evita Duplicados
            dup_check = await self.db.execute(select(Document).where(Document.doc_hash == hash_sha256))
            if dup_check.scalar_one_or_none():
                raise TxekaNtiyisoException(message="Este documento já se encontra certificado no sistema.", status_code=409)

            doc_id = self.generate_doc_id(institution_id, document_type)
            
            # Atualização Atómica de Créditos
            institution.credits -= 1
            institution.docs_emitted_month += 1

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
            await self.db.commit()
            
            return {
                "doc_id": document.doc_id,
                "certificate_url": document.certificate_url,
                "credits_remaining": institution.credits
            }
            
        except (TxekaNtiyisoException, InsufficientCreditsError):
            await self.db.rollback()
            raise
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("Database integrity error", error=str(e), exc_info=True)
            raise TxekaNtiyisoException(message="Erro de integridade na base de dados durante a emissão.", status_code=500)

    async def certify_bulk_documents(
        self,
        institution_id: str,
        documents_list: List[Dict[str, Any]],
        issued_by: str
    ) -> Dict[str, Any]:
        """
        [BULK EMISSION] Emite uma lista de documentos de forma 100% transacional.
        Se houver falha em qualquer documento ou falta de créditos, a operação sofre Rollback total.
        """
        total_docs = len(documents_list)
        if total_docs == 0:
            raise TxekaNtiyisoException(message="A lista para emissão em lote não pode estar vazia.", status_code=400)

        logger.info("Bulk certification initiated", institution_id=institution_id, count=total_docs)

        try:
            result = await self.db.execute(
                select(Institution).where(Institution.id == institution_id).with_for_update()
            )
            institution = result.scalar_one_or_none()

            if not institution:
                raise TxekaNtiyisoException(message="Instituição não encontrada.", status_code=404)

            if institution.credits < total_docs:
                raise TxekaNtiyisoException(
                    message=f"Créditos insuficientes para lote. Necessita de {total_docs}, mas possui {institution.credits}.",
                    status_code=402
                )

            processed_docs = []

            for doc_data in documents_list:
                content = doc_data.get("content", "")
                hash_sha256 = hashlib.sha256(content.encode()).hexdigest()

                # Validação de integridade interna do lote contra o banco
                dup_check = await self.db.execute(select(Document).where(Document.doc_hash == hash_sha256))
                if dup_check.scalar_one_or_none():
                    raise TxekaNtiyisoException(
                        message=f"Falha no lote: O documento '{doc_data.get('file_name')}' já está certificado.",
                        status_code=409
                    )

                doc_id = self.generate_doc_id(institution_id, doc_data.get("document_type", "DOC"))
                
                new_doc = Document(
                    doc_id=doc_id,
                    doc_hash=hash_sha256,
                    document_type=doc_data.get("document_type", "DOC"),
                    institution_id=institution_id,
                    file_name=doc_data.get("file_name"),
                    issued_by=issued_by,
                    certificate_url=f"https://verify.txekantiyiso.gov.mz/{doc_id}",
                    qr_code=f"QR_{doc_id}"
                )
                self.db.add(new_doc)
                processed_docs.append({"doc_id": doc_id, "certificate_url": new_doc.certificate_url})

            # Atualização em bloco do saldo
            institution.credits -= total_docs
            institution.docs_emitted_month += total_docs

            await self.db.commit()
            logger.info("Bulk certification success", institution_id=institution_id, total=total_docs)

            return {
                "message": f"Lote de {total_docs} documentos processado com sucesso.",
                "documents": processed_docs,
                "credits_remaining": institution.credits
            }

        except TxekaNtiyisoException:
            await self.db.rollback()
            raise
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("Database bulk execution error", error=str(e), exc_info=True)
            raise TxekaNtiyisoException(message="Erro crítico de banco de dados durante a emissão em lote.", status_code=500)
