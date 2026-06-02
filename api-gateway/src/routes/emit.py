from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import base64
from typing import Optional

from src.models import Document
from src.models.database import get_db
from src.models.emission import (
    EmitRequest, EmitResponse, RevokeRequest,
    EmissionsListResponse, EmittedDocument
)
from src.core.qr_generator import gerar_qr_code
from src.core.security import verify_token

router = APIRouter(tags=["emission"])


@router.post("/emit", response_model=EmitResponse)
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
    
    # Validação de tamanho (UploadFile não tem .size fiável)
    if len(document_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ficheiro excede 50MB")
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de ficheiro não permitido")
    
    hash_sha256 = hashlib.sha256(document_bytes).hexdigest()
    
    # Verifica duplicado no banco
    existing = db.query(Document).filter(Document.doc_hash == hash_sha256).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Documento já emitido: {existing.doc_id}")
    
    # Gera ID único
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    doc_id = f"{document_type}-{institution_id}-{timestamp}-{hash_sha256[:8].upper()}"
    
    # Gera QR
    qr_code_bytes = gerar_qr_code(hash_sha256, doc_id)
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
    
    certificate_url = f"/certificate/{doc_id}"
    
    # SALVA NO BANCO
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
            status="active",  # ou lógica de revoke
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
    
    # Nota: se quiseres revoke real, adiciona campo "status" ao modelo Document
    # Por agora apenas retorna confirmação
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

