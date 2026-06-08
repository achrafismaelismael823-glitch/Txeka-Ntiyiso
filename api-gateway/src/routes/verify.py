"""
Verification Routes - Endpoints for document verification.

This module provides endpoints to verify the authenticity and status
of certified documents via hash validation.
"""

import logging
import base64
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.models.database import get_db
from src.models.schemas import VerifyResponse
from src.security import verify_token
from src.models.schemas import VerifyRequest
from src.services.verification_service import VerificationService
from src.models.verification_repository import VerificationRepository
from src.models import Document
from src.core.qr_generator import gerar_qr_code

router = APIRouter(tags=["verification"])
logger = logging.getLogger(__name__)


class VerifyRequestModel(BaseModel):
    """Request model for document verification via POST.
    
    Attributes:
        doc_hash: SHA-256 hash of the document (exactly 64 hexadecimal characters)
        institution_id: Optional institution filter for verification
    """
    doc_hash: str = Field(
        ...,
        min_length=64,
        max_length=64,
        pattern=r'^[0-9a-fA-F]{64}$',
        description="SHA-256 hash (64 hex characters)"
    )
    institution_id: Optional[str] = Field(None, description="Optional institution filter")


def build_response(doc_entity: Document, qr_code: Optional[str] = None) -> VerifyResponse:
    """
    Construct verification response based on document status.
    
    Builds a VerifyResponse with public document data and appropriate
    status message depending on revocation status.
    
    Args:
        doc_entity: The Document database object
        qr_code: Optional base64-encoded QR code data
        
    Returns:
        VerifyResponse with document details and status
    """
    if doc_entity.revoked:
        logger.info(f"Verification returned: REVOKED doc_id={doc_entity.doc_id}")
        return VerifyResponse(
            status="revoked",
            dados_publicos={
                "doc_id": doc_entity.doc_id,
                "document_type": doc_entity.document_type,
                "institution_id": doc_entity.institution_id,
                "created_at": doc_entity.created_at.isoformat() if doc_entity.created_at else None,
                "revoked_at": doc_entity.revoked_at.isoformat() if doc_entity.revoked_at else None,
                "revoked_reason": doc_entity.revoked_reason
            },
            qr_code=qr_code,
            message="Este certificado foi revogado"
        )
    
    logger.info(f"Verification returned: VALID doc_id={doc_entity.doc_id}")
    return VerifyResponse(
        status="verified",
        dados_publicos={
            "doc_id": doc_entity.doc_id,
            "document_type": doc_entity.document_type,
            "institution_id": doc_entity.institution_id,
            "created_at": doc_entity.created_at.isoformat() if doc_entity.created_at else None,
            "revoked_at": None,
            "revoked_reason": None
        },
        qr_code=qr_code,
        message="Certificado válido"
    )


@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
async def verify_document(
    doc_hash: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """
    Verify document via GET request with hash in URL path.
    
    Validates the provided SHA-256 hash and returns the document's
    verification status. Suitable for browser-based verification and
    public APIs.
    
    Args:
        doc_hash: SHA-256 hash of the document (64 hex characters)
        db: Database session dependency
        current_user: Authenticated user context from verify_token
        
    Returns:
        VerifyResponse with document status and public data
        
    Raises:
        HTTPException 400: Invalid hash format
        HTTPException 404: Document not found
    """
    doc_hash_lower = doc_hash.lower()
    logger.info(
        f"GET /verify/{doc_hash_lower[:16]}... | "
        f"User: {current_user.get('institution')} | "
        f"User ID: {current_user.get('id')}"
    )

    repo = VerificationRepository(db)
    doc_entity = repo.get_by_hash(doc_hash_lower)

    if not doc_entity:
        logger.warning(f"Verification FAILED: Document not found for hash {doc_hash_lower[:16]}...")
        raise HTTPException(
            status_code=404,
            detail=f"Documento com hash {doc_hash_lower[:16]}... não encontrado"
        )

    # Retrieve QR code if available
    doc = db.query(Document).filter(Document.doc_hash == doc_hash_lower).first()
    qr = doc.qr_code if doc else None

    return build_response(doc_entity, qr)


@router.post("/verify", response_model=VerifyResponse)
async def verify_document_post(
    request: VerifyRequestModel,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """
    Verify document via POST request with JSON body.
    
    Validates the provided SHA-256 hash sent via JSON body.
    Suitable for B2B and B2G integrations with system-to-system
    verification.
    
    Args:
        request: VerifyRequest containing the doc_hash
        db: Database session dependency
        current_user: Authenticated user context from verify_token
        
    Returns:
        VerifyResponse with document status and public data
        
    Raises:
        HTTPException 404: Document not found
    """
    doc_hash = request.doc_hash.lower()
    logger.info(
        f"POST /verify | Hash: {doc_hash[:16]}... | "
        f"Institution: {current_user.get('institution')}"
    )

    repo = VerificationRepository(db)
    doc_entity = repo.get_by_hash(doc_hash)

    if not doc_entity:
        logger.warning(f"Verification FAILED: Document not found for hash {doc_hash[:16]}...")
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    doc = db.query(Document).filter(Document.doc_hash == doc_hash).first()
    qr = doc.qr_code if doc else None

    return build_response(doc_entity, qr)
