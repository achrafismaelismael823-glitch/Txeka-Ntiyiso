"""
Revocation Routes - Endpoints for document revocation and audit logging.

This module handles document revocation with comprehensive audit trails,
including IP logging, user tracking, and secure request handling.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from src.models.database import get_db
from src.models import Document
from src.models.emission import RevokeRequest
from src.security import verify_token

router = APIRouter(tags=["revocation"])
logger = logging.getLogger(__name__)


def safe_get_client_host(request: Optional[Request]) -> str:
    """
    Safely retrieve client IP address from request.
    
    Handles cases where request is None or client information is unavailable.
    
    Args:
        request: FastAPI Request object or None
        
    Returns:
        Client IP address string, or "unknown" if unavailable
    """
    try:
        if request and request.client:
            return request.client.host
        return "unknown"
    except Exception as e:
        logger.warning(f"Failed to extract client IP: {str(e)}")
        return "unknown"


@router.post("/emissions/{doc_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token),
    req: Optional[Request] = None
) -> Dict[str, Any]:
    """
    Revoke an issued document with audit trail.
    
    Revokes a certificate document and records comprehensive audit information
    including IP address, user ID, timestamp, and revocation reason.
    Only the issuing institution or admins can revoke documents.
    
    Args:
        doc_id: URL-encoded document ID to revoke
        request: RevokeRequest containing revocation reason
        db: Database session
        current_user: Authenticated user context (must include institution, role, id)
        req: FastAPI Request for IP extraction
        
    Returns:
        Dictionary with revocation status, doc_id, timestamp, and message
        
    Raises:
        HTTPException 404: Document not found
        HTTPException 403: User lacks permission to revoke
        HTTPException 500: Database operation failed
    """
    doc_id_decoded = unquote(doc_id)
    logger.info(f"Revocation initiated for doc_id={doc_id_decoded}")
    
    document: Optional[Document] = db.query(Document).filter(
        Document.doc_id == doc_id_decoded
    ).first()

    if not document:
        logger.error(f"Revocation FAILED: Document {doc_id_decoded} not found")
        raise HTTPException(
            status_code=404,
            detail=f"Documento {doc_id_decoded} não encontrado"
        )

    # Check if already revoked
    if document.revoked:
        logger.info(f"Revocation skipped: Document {doc_id_decoded} already revoked")
        return {
            "status": "already_revoked",
            "doc_id": document.doc_id,
            "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
            "message": f"Documento já estava revogado. Motivo: {document.revoked_reason}"
        }

    # Compliance check: Only issuing institution or admins can revoke
    is_owner = current_user.get("institution") == document.institution_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_admin):
        logger.warning(
            f"Revocation DENIED: Insufficient permissions | "
            f"User: {current_user.get('id')} | "
            f"Institution: {current_user.get('institution')} | "
            f"Doc Institution: {document.institution_id}"
        )
        raise HTTPException(
            status_code=403,
            detail="Sem permissão pra revogar este documento"
        )

    # Perform revocation
    document.revoked = True
    document.revoked_at = datetime.utcnow()
    document.revoked_reason = request.reason
    document.revoked_by = current_user.get("id")

    try:
        db.commit()
        db.refresh(document)
        
        # Audit logging with comprehensive context
        client_ip = safe_get_client_host(req)
        logger.info(
            f"REVOCATION_SUCCESS | "
            f"doc_id={doc_id_decoded} | "
            f"ip={client_ip} | "
            f"user_id={current_user.get('id')} | "
            f"institution={current_user.get('institution')} | "
            f"reason={request.reason} | "
            f"timestamp={document.revoked_at.isoformat()}"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(
            f"REVOCATION_ERROR | doc_id={doc_id_decoded} | error={str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao revogar: {str(e)}"
        )

    return {
        "status": "revoked",
        "doc_id": document.doc_id,
        "revoked_at": document.revoked_at.isoformat(),
        "revoked_by": current_user.get("institution"),
        "message": f"Documento revogado: {request.reason}"
    }
