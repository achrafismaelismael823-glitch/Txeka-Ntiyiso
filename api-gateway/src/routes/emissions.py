from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from urllib.parse import unquote
from datetime import datetime

from src.models.database import get_db
from src.models import Document
from src.models.emission import EmissionsListResponse, EmittedDocument, RevokeRequest
from src.core.security import verify_token

router = APIRouter(tags=["emissions"])

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
        query = query.filter(Document.status == status_filter)

    docs = query.order_by(Document.created_at.desc()).all()

    documents = [
        EmittedDocument(
            doc_id=d.doc_id,
            document_type=d.document_type,
            institution_id=d.institution_id,
            hash_sha256=d.doc_hash,
            file_name=d.file_name if hasattr(d, 'file_name') else None,
            file_size=d.file_size if hasattr(d, 'file_size') else None,
            status=d.status if hasattr(d, 'status') else "active", # lê da BD agora
            issued_at=d.created_at,
            issued_by=d.issued_by if hasattr(d, 'issued_by') else current_user.get("institution", "system"),
            revoked_at=d.revoked_at if hasattr(d, 'revoked_at') else None,
            revocation_reason=d.revocation_reason if hasattr(d, 'revocation_reason') else None
        )
        for d in docs
    ]

    return EmissionsListResponse(
        total=len(documents),
        documents=documents
    )

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

    return {
        "doc_id": document.doc_id,
        "document_type": document.document_type,
        "institution_id": document.institution_id,
        "hash_sha256": document.doc_hash,
        "certificate_url": document.certificate_url if hasattr(document, 'certificate_url') else None,
        "status": document.status if hasattr(document, 'status') else "active",
        "issued_at": document.created_at.isoformat() if document.created_at else None,
        "revoked_at": document.revoked_at.isoformat() if hasattr(document, 'revoked_at') and document.revoked_at else None,
        "revocation_reason": document.revocation_reason if hasattr(document, 'revocation_reason') else None
    }

@router.delete("/emissions/{doc_id}", status_code=status.HTTP_200_OK)
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

    if hasattr(document, 'status') and document.status == "revoked":
        return {
            "status": "already_revoked",
            "doc_id": document.doc_id,
            "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
            "message": f"Documento já estava revogado. Motivo: {document.revocation_reason}"
        }

    # 3. Atualiza campos - só roda se existir na model
    if hasattr(document, 'status'):
        document.status = "revoked"
    if hasattr(document, 'revoked_at'):
        document.revoked_at = datetime.utcnow()
    if hasattr(document, 'revocation_reason'):
        document.revocation_reason = request.reason
    if hasattr(document, 'revoked_by'):
        document.revoked_by = current_user.get("institution", "system")

    
    try:
        db.commit()
        db.refresh(document)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao revogar: {str(e)}")

    return {
        "status": "revoked",
        "doc_id": document.doc_id,
        "revoked_at": document.revoked_at.isoformat() if hasattr(document, 'revoked_at') else None,
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

    is_revoked = hasattr(document, 'status') and document.status == "revoked"

    return {
        "certificate_id": doc_id,
        "document_type": document.document_type,
        "hash_sha256": document.doc_hash,
        "issued_at": document.created_at.isoformat() if document.created_at else None,
        "issued_by": document.issued_by if hasattr(document, 'issued_by') else current_user.get("institution", "system"),
        "status": "REVOGADO" if is_revoked else "VÁLIDO",
        "revoked_at": document.revoked_at.isoformat() if hasattr(document, 'revoked_at') and document.revoked_at else None,
        "revocation_reason": document.revocation_reason if hasattr(document, 'revocation_reason') else None
    }
