"""
Emission Service - Core business logic for document certification.

This service layer handles:
- Document ID generation
- Credit management and validation
- Document certification with hash validation
- Institution status checking
- Duplicate prevention
"""

import logging
import uuid
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models.models import Document, Institution

logger = logging.getLogger(__name__)


class EmissionService:
    """
    Service class for document emission and certification.
    
    Manages the complete workflow of certifying documents including
    validation, ID generation, credit deduction, and database persistence.
    """

    def __init__(self, db: Session):
        """
        Initialize EmissionService.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        logger.debug("EmissionService initialized")

    def generate_doc_id(self, institution_id: str, document_type: str) -> str:
        """
        Generate unique document identifier.
        
        Format: {DOCTYPE}-{INSTITUTION}-{YYYYMMDD}-{UUID6}
        Example: DUAT-INAGE-20250608-ABC123
        
        Args:
            institution_id: Issuing institution identifier
            document_type: Document type classification
            
        Returns:
            Formatted document ID string
        """
        timestamp = datetime.utcnow().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:6].upper()
        doc_id = f"{document_type}-{institution_id}-{timestamp}-{unique_id}"
        logger.debug(f"Generated doc_id: {doc_id}")
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
        Certify a document with complete validation and persistence.
        
        Performs the following steps:
        1. Validates institution exists and is active
        2. Checks institution has available credits
        3. Computes SHA-256 hash of document content
        4. Prevents duplicate documents via hash validation
        5. Generates unique document ID
        6. Deducts credit from institution
        7. Persists document to database
        
        Args:
            institution_id: Issuing institution ID
            document_type: Document type (e.g., DUAT, CERTIFICATE)
            file_name: Original filename for audit trail
            content: Document content as string (for hashing)
            issued_by: User/system that initiated certification
            
        Returns:
            Dictionary containing:
                - doc_id: Generated document identifier
                - certificate_url: Public verification URL
                - credits_remaining: Updated credit balance
                
        Raises:
            HTTPException 404: Institution not found
            HTTPException 403: Institution suspended or inactive
            HTTPException 402: Insufficient credits (payment required)
            HTTPException 409: Document already certified (duplicate hash)
        """
        logger.info(
            f"Certification starting | "
            f"institution={institution_id} | "
            f"type={document_type} | "
            f"file={file_name} | "
            f"issued_by={issued_by}"
        )

        # Step 1: Validate institution exists
        institution = self.db.query(Institution).filter(
            Institution.id == institution_id
        ).first()

        if not institution:
            logger.error(f"Certification failed: Institution {institution_id} not found")
            raise HTTPException(status_code=404, detail="Instituição não encontrada")

        # Step 2: Check institution status
        if institution.status != "active":
            logger.error(
                f"Certification failed: Institution {institution_id} status={institution.status}"
            )
            raise HTTPException(status_code=403, detail="Instituição suspensa")

        # Step 3: Validate credits available
        if institution.credits <= 0:
            logger.warning(
                f"Certification failed: Insufficient credits for {institution_id} | "
                f"plan={institution.subscription_plan} | credits={institution.credits}"
            )
            
            if institution.subscription_plan == "free":
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Demo expirada",
                        "message": "Créditos demo zerados. Contrate Starter 100 créditos MT 2.000"
                    }
                )
            else:
                raise HTTPException(
                    status_code=402,
                    detail=f"Pacote {institution.subscription_plan} esgotado. Recarregue"
                )

        # Step 4: Compute hash and check for duplicates
        logger.debug(f"Computing SHA-256 hash for {file_name}")
        hash_sha256 = hashlib.sha256(content.encode()).hexdigest()
        logger.debug(f"Hash computed: {hash_sha256[:16]}...")

        existing = self.db.query(Document).filter(
            Document.doc_hash == hash_sha256
        ).first()
        
        if existing:
            logger.error(
                f"Certification failed: Duplicate hash detected | "
                f"existing_doc_id={existing.doc_id} | new_file={file_name}"
            )
            raise HTTPException(status_code=409, detail="Documento já certificado")

        # Step 5-6: Generate ID and deduct credits
        doc_id = self.generate_doc_id(institution_id, document_type)
        institution.credits -= 1
        institution.docs_emitted_month += 1
        logger.info(
            f"Credits deducted | "
            f"institution={institution_id} | "
            f"remaining={institution.credits} | "
            f"emissions_this_month={institution.docs_emitted_month}"
        )

        # Step 7: Create and persist document
        try:
            document = Document(
                doc_id=doc_id,
                doc_hash=hash_sha256,
                document_type=document_type,
                institution_id=institution_id,
                file_name=file_name,
                issued_by=issued_by,
                certificate_url=f"https://verify.docutrust.co.mz/{doc_id}",
                qr_code=f"QR_{doc_id}"  # Placeholder, updated with actual QR later
            )

            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            logger.info(
                f"Document certified successfully | "
                f"doc_id={doc_id} | "
                f"hash={hash_sha256[:16]}... | "
                f"institution={institution_id}"
            )

            return {
                "doc_id": document.doc_id,
                "certificate_url": document.certificate_url,
                "credits_remaining": institution.credits
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Certification database error | "
                f"doc_id={doc_id} | "
                f"institution={institution_id} | "
                f"error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao certificar documento: {str(e)}"
            )

    def get_document_by_id(self, doc_id: str) -> Optional[Document]:
        """
        Retrieve document by ID.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            Document object if found, None otherwise
        """
        logger.debug(f"Querying document by id: {doc_id}")
        return self.db.query(Document).filter(Document.doc_id == doc_id).first()

    def get_document_by_hash(self, hash_sha256: str) -> Optional[Document]:
        """
        Retrieve document by SHA-256 hash.
        
        Args:
            hash_sha256: SHA-256 hash (64 hex characters)
            
        Returns:
            Document object if found, None otherwise
        """
        logger.debug(f"Querying document by hash: {hash_sha256[:16]}...")
        return self.db.query(Document).filter(Document.doc_hash == hash_sha256).first()

    def revoke_document(self, doc_id: str, reason: str) -> Optional[Document]:
        """
        Revoke a document with reason.
        
        **Deprecated**: Use revocation route instead for audit trail.
        
        Args:
            doc_id: Document identifier
            reason: Revocation reason
            
        Returns:
            Revoked Document object, or None if not found
        """
        logger.warning(
            f"Using deprecated revoke_document method | "
            f"doc_id={doc_id} | reason={reason}. "
            f"Should use revocation routes for audit trail."
        )
        
        doc = self.get_document_by_id(doc_id)
        if doc:
            doc.revoked = True
            doc.revoked_at = datetime.utcnow()
            doc.revoked_reason = reason
            self.db.commit()
            logger.info(f"Document revoked: {doc_id}")
            return doc
        return None
