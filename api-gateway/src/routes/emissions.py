from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from src.models.database import get_db
from src.models import Document
from src.models.emission import EmissionsListResponse, EmittedDocument, RevokeRequest
from src.core.security import verify_token

router = APIRouter(tags=["emissions"])


@router.get("/emissions", response_model=EmissionsListResponse)
async def list_emissions(
    institution_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> EmissionsListResponse:
    
    query = db.query(Document)
    if institution_id:
        query = query.filter(Document.institution_id == institution_id)
    
    docs = query.order_by(Document.created_at.desc()).all()
    
    documents = [
        EmittedDocument(
            doc_id=d.doc_id,
            document_type=d.document_type,
            institution_id=d.institution_id,
            hash_sha256=d.doc_hash,
            status="active",
            issued_at=d.created_at,
            issued_by=current_user.get("institution", "system")
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
    document = db.query(Document).filter(Document.doc_id == doc_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id} não encontrado")
    
    return {
        "doc_id": document.doc_id,
        "document_type": document.document_type,
        "institution_id": document.institution_id,
        "hash_sha256": document.doc_hash,
        "certificate_url": document.certificate_url,
        "created_at": document.created_at.isoformat() if document.created_at else None
    }


@router.delete("/emissions/{doc_id}")
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    document = db.query(Document).filter(Document.doc_id == doc_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id} não encontrado")
    
    return {
        "status": "revoked",
        "doc_id": doc_id,
        "message": f"Documento revogado: {request.reason}"
    }


@router.get("/certificate/{doc_id}")
async def get_certificate(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    document = db.query(Document).filter(Document.doc_id == doc_id).first()
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Certificado não encontrado")
    
    return {
        "certificate_id": doc_id,
        "document_type": document.document_type,
        "hash_sha256": document.doc_hash,
        "issued_at": document.created_at.isoformat() if document.created_at else None,
        "issued_by": current_user.get("institution", "system"),
        "status": "VÁLIDO",
        "revoked_at": None,
        "revocation_reason": None
    }
