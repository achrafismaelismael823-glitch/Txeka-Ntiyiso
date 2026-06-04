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

def doc_to_schema(d: Document, issued_by: str) -> EmittedDocument:
    """Converte model SQLAlchemy pra schema Pydantic"""
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
