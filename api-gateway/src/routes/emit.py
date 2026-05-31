from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from datetime import datetime
import hashlib
import base64
from typing import Optional

from ..models.emission import (
    EmitRequest, EmitResponse, RevokeRequest, 
    EmissionsListResponse, EmittedDocument
)
from ..services.emission_service import EmissionService
from ..core.qr_generator import gerar_qr_code
from core.security import verify_token

router = APIRouter(tags=["emission"])

emission_service = EmissionService()

@router.post("/emit", response_model=EmitResponse)
async def emit_document(
    file: UploadFile = File(...),
    document_type: str = "DUAT",
    institution_id: str = "INAGE",
    current_user: dict = Depends(verify_token)
) -> EmitResponse:
    
    if not file:
        raise HTTPException(status_code=400, detail="Nenhum ficheiro fornecido")
    
    if file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ficheiro excede 50MB")
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de ficheiro não permitido")
    
    document_bytes = await file.read()
    
    hash_sha256 = hashlib.sha256(document_bytes).hexdigest()
    
    existing = emission_service.get_document_by_hash(hash_sha256)
    if existing:
        raise HTTPException(status_code=409, detail=f"Documento já emitido: {existing.doc_id}")
    
    doc_id = emission_service.generate_doc_id(institution_id, document_type)
    
    qr_code_bytes = gerar_qr_code(hash_sha256, doc_id)
    qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
    
    saved_document = emission_service.save_document(
        doc_id=doc_id,
        hash_sha256=hash_sha256,
        institution_id=institution_id,
        document_type=document_type,
        file_name=file.filename,
        file_size=len(document_bytes),
        issued_by=current_user.get("email", "system")
    )
    
    certificate_url = f"/certificate/{doc_id}"
    
    return EmitResponse(
        status="emitted",
        doc_id=doc_id,
        hash_sha256=hash_sha256,
        qr_code=qr_code_base64,
        certificate_url=certificate_url,
        timestamp=saved_document.issued_at.isoformat(),
        message=f"Documento {doc_id} emitido com sucesso"
    )

@router.get("/emissions", response_model=EmissionsListResponse)
async def list_emissions(
    institution_id: Optional[str] = None,
    current_user: dict = Depends(verify_token)
) -> EmissionsListResponse:
    
    if institution_id:
        documents = emission_service.get_documents_by_institution(institution_id)
    else:
        documents = emission_service.list_all()
    
    return EmissionsListResponse(
        total=len(documents),
        documents=documents
    )

@router.get("/emissions/{doc_id}")
async def get_emission(
    doc_id: str,
    current_user: dict = Depends(verify_token)
):
    document = emission_service.get_document_by_id(doc_id)
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id} não encontrado")
    
    return document

@router.delete("/emissions/{doc_id}")
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    current_user: dict = Depends(verify_token)
):
    document = emission_service.revoke_document(doc_id, request.reason)
    
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
    current_user: dict = Depends(verify_token)
):
    document = emission_service.get_document_by_id(doc_id)
    
    if not document:
        raise HTTPException(status_code=404, detail=f"Certificado não encontrado")
    
    status_display = "VÁLIDO" if document.status == "active" else "REVOGADO"
    
    return {
        "certificate_id": doc_id,
        "document_type": document.document_type,
        "hash_sha256": document.hash_sha256,
        "issued_at": document.issued_at.isoformat(),
        "issued_by": document.issued_by,
        "status": status_display,
        "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
        "revocation_reason": document.revocation_reason
    }
