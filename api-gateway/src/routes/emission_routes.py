from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from urllib.parse import unquote
import hashlib
import base64

from src.models import Document
from src.models.database import get_db
from src.models.emission import EmitResponse, EmissionsListResponse, EmittedDocument, RevokeRequest
from src.core.qr_generator import gerar_qr_code
from src.core.security import verify_token

router = APIRouter(tags=["emission"])

MAX_FILE_SIZE = 50 * 1024 * 1024 # 50MB
PDF_MAGIC = b"%PDF-"

def validate_pdf(file: UploadFile, content: bytes) -> None:
    """Validação estrita PDF: extensão, MIME e magic number"""
    filename = file.filename.lower() if file.filename else ""

    if not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Extensão inválida. Aceita apenas.pdf"
        )

    if file.content_type!= "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Tipo MIME inválido. Deve ser application/pdf"
        )

    if not content.startswith(PDF_MAGIC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Falsificação de formato. Conteúdo não é PDF válido"
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ficheiro excede 50MB"
        )

@router.post("/certify", response_model=EmitResponse)
async def emit_document(
    file: UploadFile = File(...),
    document_type: str = "DUAT",
    institution_id: str = "INAGE",
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> EmitResponse:

    if not file:
        raise HTTPException(status_code=400, detail="Nenhum ficheiro fornecido")

    document_bytes = await file.read()

    # Validação estrita PDF
    validate_pdf(file, document_bytes)

    hash_sha256 = hashlib.sha256(document_bytes).hexdigest()

    existing = db.query(Document).filter(Document.doc_hash == hash_sha256).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Documento já emitido: {existing.doc_id}")

    timestamp = datetime.utcnow().strftime("%Y%m%d")
    doc_id = f"{document_type}-{institution_id}-{timestamp}-{hash_sha256[:8].upper()}"

    qr_code_bytes = gerar_qr_code(hash_sha256, doc_id)
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"

    certificate_url = f"/certificate/{doc_id}"

    doc_record = Document(
        doc_id=doc_id,
        doc_hash=hash_sha256,
        document_type=document_type,
        institution_id=institution_id,
        certificate_url=certificate_url,
        qr_code=qr_code_base64
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    return EmitResponse(
        status="emitted",
        doc_id=doc_id,
        hash_sha256=hash_sha256,
        qr_code=qr_code_base64,
        certificate_url=certificate_url,
        timestamp=doc_record.created_at.isoformat(),
        message=f"Documento {doc_id} emitido com sucesso"
    )

def doc_to_schema(d: Document, issued_by: str) -> EmittedDocument:
    status_str = "revoked" if d.revoked else "active"
    return EmittedDocument(
        doc_id=d.doc_id,
        document_type=d.document_type,
        institution_id=d.institution_id,
        hash_sha256=d.doc_hash,
        file_name=None,
        file_size=None,
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

    query = db.query(Document)
    if institution_id:
        query = query.filter(Document.institution_id == institution_id)
    if status_filter:
        if status_filter == "revoked":
            query = query.filter(Document.revoked == True)
        elif status_filter == "active":
            query = query.filter(Document.revoked == False)

    docs = query.order_by(Document.created_at.desc()).all()
    issued_by = current_user.get("institution", "system")

    documents = [doc_to_schema(d, issued_by) for d in docs]

    return EmissionsListResponse(total=len(documents), documents=documents)

@router.get("/emissions/{doc_id}")
async def get_emission(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    doc_id = unquote(doc_id)
    document = db.query(Document).filter(Document.doc_id == doc_id).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id} não encontrado")

    issued_by = current_user.get("institution", "system")
    return doc_to_schema(document, issued_by).dict()

@router.post("/emissions/{doc_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    doc_id = unquote(doc_id)
    document = db.query(Document).filter(Document.doc_id == doc_id).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id} não encontrado")

    if document.revoked:
        return {
            "status": "already_revoked",
            "doc_id": document.doc_id,
            "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
            "message": f"Documento já estava revogado. Motivo: {document.revoked_reason}"
        }

    document.revoked = True
    document.revoked_at = datetime.utcnow()
    document.revoked_reason = request.reason

    try:
        db.commit()
        db.refresh(document)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao revogar: {str(e)}")

    return {
        "status": "revoked",
        "doc_id": document.doc_id,
        "revoked_at": document.revoked_at.isoformat(),
        "message": f"Documento revogado: {request.reason}"
    }

@router.get("/certificate/{doc_id}")
async def get_certificate(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    doc_id = unquote(doc_id)
    document = db.query(Document).filter(Document.doc_id == doc_id).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"Certificado não encontrado")

    return {
        "certificate_id": doc_id,
        "document_type": document.document_type,
        "hash_sha256": document.doc_hash,
        "issued_at": document.created_at.isoformat() if document.created_at else None,
        "issued_by": current_user.get("institution", "system"),
        "status": "REVOGADO" if document.revoked else "VÁLIDO",
        "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
        "revocation_reason": document.revoked_reason
    }
