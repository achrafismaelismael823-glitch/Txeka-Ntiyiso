"""
Emission Routes - Document certification and issuance endpoints.

This module provides endpoints for emitting new certified documents,
listing emissions, and retrieving certificate details with comprehensive
logging and error handling.
"""

import logging
import hashlib
import base64
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from urllib.parse import unquote

from src.models.models import Document, Institution
from src.models.database import get_db
from src.models.emission import EmitResponse, EmissionsListResponse, EmittedDocument, RevokeRequest
from src.core.qr_generator import gerar_qr_code
from src.security import verify_token
from src.services.emission_service import EmissionService

router = APIRouter(tags=["emission"])
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
PDF_MAGIC = b"%PDF-"


def validate_pdf(file: UploadFile, content: bytes) -> None:
    """
    Validate PDF file format with strict security checks.
    
    Performs multi-layer validation:
    - File extension must be .pdf
    - MIME type must be application/pdf
    - File content must start with PDF magic number (%PDF-)
    - File size must not exceed MAX_FILE_SIZE
    
    Args:
        file: Uploaded file object from FastAPI
        content: Raw file content as bytes
        
    Raises:
        HTTPException 415: Invalid extension or MIME type
        HTTPException 400: Invalid PDF format (magic number)
        HTTPException 413: File exceeds size limit
    """
    filename = file.filename.lower() if file.filename else ""

    logger.debug(f"Validating PDF: filename={file.filename}, size={len(content)} bytes")

    if not filename.endswith(".pdf"):
        logger.warning(f"PDF validation failed: Invalid extension - {file.filename}")
        raise HTTPException(
            status_code=415,
            detail="Extensão inválida. Aceita apenas .pdf"
        )

    if file.content_type != "application/pdf":
        logger.warning(f"PDF validation failed: Invalid MIME type - {file.content_type}")
        raise HTTPException(
            status_code=415,
            detail="Tipo MIME inválido. Deve ser application/pdf"
        )

    if not content.startswith(PDF_MAGIC):
        logger.warning("PDF validation failed: Invalid magic number (not a valid PDF)")
        raise HTTPException(
            status_code=400,
            detail="Falsificação de formato. Conteúdo não é PDF válido"
        )

    if len(content) > MAX_FILE_SIZE:
        logger.warning(f"PDF validation failed: File too large - {len(content)} bytes > {MAX_FILE_SIZE}")
        raise HTTPException(
            status_code=413,
            detail="Ficheiro excede 50MB"
        )

    logger.debug("PDF validation passed")


@router.post("/certify", response_model=EmitResponse)
async def emit_document(
    file: UploadFile = File(...),
    document_type: str = "DUAT",
    institution_id: str = "INAGE",
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> EmitResponse:
    """
    Emit and certify a new document.
    
    Creates a new certified document record with:
    - SHA-256 hash validation
    - QR code generation
    - Credit deduction
    - Comprehensive audit trail
    
    Args:
        file: PDF file to certify (multipart/form-data)
        document_type: Document classification (default: DUAT)
        institution_id: Issuing institution ID (default: INAGE)
        db: Database session
        current_user: Authenticated user context
        
    Returns:
        EmitResponse with doc_id, hash, QR code, and certificate URL
        
    Raises:
        HTTPException 400: No file provided or validation failed
        HTTPException 402: Insufficient credits or demo expired
        HTTPException 404: Institution not found
        HTTPException 409: Duplicate document hash
    """
    if not file:
        logger.error("Emission failed: No file provided")
        raise HTTPException(status_code=400, detail="Nenhum ficheiro fornecido")

    logger.info(
        f"Emission started | "
        f"file={file.filename} | "
        f"institution={institution_id} | "
        f"user={current_user.get('institution')}"
    )

    document_bytes = await file.read()
    
    # Validate PDF format
    try:
        validate_pdf(file, document_bytes)
    except HTTPException as e:
        logger.error(f"Emission failed: PDF validation error - {e.detail}")
        raise

    # Initialize emission service
    service = EmissionService(db)

    try:
        logger.debug(f"Processing emission with service.certify_document()")
        result = service.certify_document(
            institution_id=institution_id,
            document_type=document_type,
            file_name=file.filename,
            content=document_bytes.decode('latin-1'),  # Hash requires string content
            issued_by=current_user.get("institution", "system")
        )
        logger.info(f"Document certified: doc_id={result['doc_id']}")
    except HTTPException as e:
        # Re-raise HTTP exceptions from service (e.g., 402 payment required)
        logger.error(f"Emission service failed: {e.detail}", exc_info=True)
        raise

    # Retrieve document and generate QR code
    doc_record = db.query(Document).filter(Document.doc_id == result["doc_id"]).first()
    if not doc_record:
        logger.error(f"Emission failed: Document not found after creation - {result['doc_id']}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao recuperar documento após criação"
        )

    try:
        logger.debug(f"Generating QR code for doc_id={doc_record.doc_id}")
        qr_code_bytes = gerar_qr_code(doc_record.doc_hash, doc_record.doc_id)
        qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"

        doc_record.qr_code = qr_code_base64
        doc_record.file_name = file.filename
        doc_record.file_size = len(document_bytes)
        db.commit()
        logger.info(f"QR code generated and saved: doc_id={doc_record.doc_id}")
    except Exception as e:
        db.rollback()
        logger.error(
            f"Failed to generate/save QR code for doc_id={doc_record.doc_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Erro ao gerar QR code")

    return EmitResponse(
        status="emitted",
        doc_id=doc_record.doc_id,
        hash_sha256=doc_record.doc_hash,
        qr_code=qr_code_base64,
        certificate_url=doc_record.certificate_url,
        timestamp=doc_record.created_at.isoformat(),
        message=f"Documento {doc_record.doc_id} emitido. Créditos restantes: {result['credits_remaining']}"
    )


def doc_to_schema(d: Document, issued_by: str) -> EmittedDocument:
    """
    Convert Document ORM object to EmittedDocument schema.
    
    Args:
        d: Document database object
        issued_by: Institution that issued the document
        
    Returns:
        EmittedDocument schema with all relevant fields
    """
    status_str = "revoked" if d.revoked else "active"
    return EmittedDocument(
        doc_id=d.doc_id,
        document_type=d.document_type,
        institution_id=d.institution_id,
        hash_sha256=d.doc_hash,
        file_name=d.file_name,
        file_size=d.file_size,
        status=status_str,
        issued_at=d.created_at,
        issued_by=issued_by,
        revoked_at=d.revoked_at,
        revocation_reason=d.revoked_reason
    )


@router.get("/emissions", response_model=EmissionsListResponse)
async def list_emissions(
    institution_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> EmissionsListResponse:
    """
    List all emitted documents with optional filtering.
    
    Retrieves documents with optional filters by institution
    and/or revocation status. Results are ordered by creation date
    in descending order (newest first).
    
    Args:
        institution_id: Filter by issuing institution (optional)
        status_filter: Filter by status - "active", "revoked", or None for all
        db: Database session
        current_user: Authenticated user context
        
    Returns:
        EmissionsListResponse containing document list and total count
    """
    logger.info(
        f"Listing emissions | "
        f"institution_filter={institution_id} | "
        f"status_filter={status_filter} | "
        f"requested_by={current_user.get('institution')}"
    )

    query = db.query(Document)
    
    if institution_id:
        query = query.filter(Document.institution_id == institution_id)
        logger.debug(f"Filtered by institution: {institution_id}")
    
    if status_filter == "revoked":
        query = query.filter(Document.revoked == True)
        logger.debug("Filtered to revoked documents only")
    elif status_filter == "active":
        query = query.filter(Document.revoked == False)
        logger.debug("Filtered to active documents only")

    docs = query.order_by(Document.created_at.desc()).all()
    issued_by = current_user.get("institution", "system")
    documents = [doc_to_schema(d, issued_by) for d in docs]

    logger.info(f"Emissions list returned: {len(documents)} documents")
    return EmissionsListResponse(total=len(documents), documents=documents)


@router.get("/emissions/{doc_id}")
async def get_emission(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> EmittedDocument:
    """
    Retrieve details of a specific emitted document.
    
    Args:
        doc_id: URL-encoded document ID
        db: Database session
        current_user: Authenticated user context
        
    Returns:
        EmittedDocument schema with complete document details
        
    Raises:
        HTTPException 404: Document not found
    """
    doc_id_decoded = unquote(doc_id)
    logger.info(f"Fetching emission: doc_id={doc_id_decoded}")

    document = db.query(Document).filter(Document.doc_id == doc_id_decoded).first()
    if not document:
        logger.warning(f"Emission fetch failed: doc_id {doc_id_decoded} not found")
        raise HTTPException(status_code=404, detail=f"Documento {doc_id_decoded} não encontrado")

    issued_by = current_user.get("institution", "system")
    return doc_to_schema(document, issued_by)


@router.get("/certificate/{doc_id}")
async def get_certificate(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> dict:
    """
    Retrieve full certificate details including public verification data.
    
    Returns all non-sensitive certificate information including
    hash, timestamps, status, and QR code for public sharing.
    
    Args:
        doc_id: URL-encoded document ID
        db: Database session
        current_user: Authenticated user context
        
    Returns:
        Dictionary containing certificate details
        
    Raises:
        HTTPException 404: Certificate not found
    """
    doc_id_decoded = unquote(doc_id)
    logger.info(f"Fetching certificate: doc_id={doc_id_decoded}")

    document = db.query(Document).filter(Document.doc_id == doc_id_decoded).first()
    if not document:
        logger.warning(f"Certificate fetch failed: doc_id {doc_id_decoded} not found")
        raise HTTPException(status_code=404, detail="Certificado não encontrado")

    logger.debug(f"Certificate retrieved: {doc_id_decoded} | status={'REVOGADO' if document.revoked else 'VÁLIDO'}")
    
    return {
        "certificate_id": doc_id_decoded,
        "document_type": document.document_type,
        "hash_sha256": document.doc_hash,
        "issued_at": document.created_at.isoformat() if document.created_at else None,
        "issued_by": current_user.get("institution", "system"),
        "status": "REVOGADO" if document.revoked else "VÁLIDO",
        "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
        "revocation_reason": document.revoked_reason,
        "qr_code": document.qr_code
    }
