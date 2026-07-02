"""Emission Service - Core business logic for document certification."""

import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.logger import get_logger
from src.exceptions import TxekaNtiyisoException, InsufficientCreditsError
from src.models.models import Document, Institution
from src.services.institution_service import InstitutionService

logger = get_logger(__name__)


class EmissionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        logger.debug("EmissionService initialized")

    def generate_doc_id(self, institution_id: str, document_type: str) -> str:
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:6].upper()
        return f"{document_type.upper()}-{institution_id.upper()}-{timestamp}-{unique_id}"

    async def _get_institution_with_lock(self, institution_id: str) -> Institution:
        result = await self.db.execute(
            select(Institution).where(Institution.id == institution_id).with_for_update()
        )
        institution = result.scalar_one_or_none()
        if not institution:
            raise TxekaNtiyisoException(message=f"Instituicao '{institution_id}' nao encontrada.", status_code=404)
        if institution.status != "active":
            raise TxekaNtiyisoException(message="Instituicao suspensa ou inativa.", status_code=403)
        if not institution.approved:
            raise TxekaNtiyisoException(message="Instituicao ainda nao aprovada.", status_code=403)
        return institution

    async def _check_duplicate(self, hash_sha256: str) -> None:
        dup_check = await self.db.execute(select(Document).where(Document.doc_hash == hash_sha256))
        if dup_check.scalar_one_or_none():
            raise TxekaNtiyisoException(message="Este documento ja se encontra certificado no sistema.", status_code=409)

    async def certify_document(self, institution_id: str, document_type: str, file_name: str, content: str, issued_by: str) -> Dict[str, Any]:
        logger.info("Certification starting", institution_id=institution_id, document_type=document_type, file_name=file_name)
        
        credit_ok = await InstitutionService.consume_credit(
            self.db, 
            institution_id, 
            description=f"Emissao de {document_type}"
        )
        if not credit_ok:
            raise InsufficientCreditsError(institution_id=institution_id)
        
        institution = await self._get_institution_with_lock(institution_id)
        
        hash_sha256 = hashlib.sha256(content.encode()).hexdigest()
        await self._check_duplicate(hash_sha256)
        
        doc_id = self.generate_doc_id(institution_id, document_type)
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
        await self.db.flush()
        
        return {
            "doc_id": document.doc_id,
            "certificate_url": document.certificate_url,
            "credits_remaining": institution.credits,
            "hash_sha256": hash_sha256
        }

    async def certify_bulk_documents(self, institution_id: str, documents_list: List[Dict[str, Any]], issued_by: str) -> Dict[str, Any]:
        total_docs = len(documents_list)
        if total_docs == 0:
            raise TxekaNtiyisoException(message="A lista para emissao em lote nao pode estar vazia.", status_code=400)
        
        logger.info("Bulk certification initiated", institution_id=institution_id, count=total_docs)
        
        institution = await self._get_institution_with_lock(institution_id)
        if institution.credits < total_docs:
            raise TxekaNtiyisoException(
                message=f"Creditos insuficientes para lote. Necessita de {total_docs}, mas possui {institution.credits}.",
                status_code=402
            )
        
        for _ in range(total_docs):
            credit_ok = await InstitutionService.consume_credit(
                self.db,
                institution_id,
                description="Emissao em lote"
            )
            if not credit_ok:
                raise InsufficientCreditsError(institution_id=institution_id)
        
        processed_docs = []
        for doc_data in documents_list:
            content = doc_data.get("content", "")
            hash_sha256 = hashlib.sha256(content.encode()).hexdigest()
            await self._check_duplicate(hash_sha256)
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
            processed_docs.append({
                "doc_id": doc_id,
                "certificate_url": new_doc.certificate_url,
                "hash_sha256": hash_sha256
            })
        
        await self.db.refresh(institution)
        logger.info("Bulk certification success", institution_id=institution_id, total=total_docs)
        
        return {
            "message": f"Lote de {total_docs} documentos processado com sucesso.",
            "documents": processed_docs,
            "credits_remaining": institution.credits
        }
