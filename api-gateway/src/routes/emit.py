from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import base64

from src.models import Document
from src.models.database import get_db
from src.models.emission import EmitResponse
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




    
    if len(document_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ficheiro excede 50MB")

    filename = file.filename.lower() if file.filename else ""

    # PDF pra certificados + JPG/PNG pra BI
    allowed_extensions = [".pdf", ".jpg", ".jpeg", ".png"]
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Extensão não permitida. Use: pdf, jpg, jpeg ou png")

    allowed_mimes = ["application/pdf", "image/jpeg", "image/png", "application/octet-stream"]
    if file.content_type not in allowed_mimes:
        raise HTTPException(status_code=400, detail="Tipo de ficheiro não permitido")

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
