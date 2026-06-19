"""Emission Routes - Document certification endpoints."""
import logging
import base64
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.models.models import Document
from src.database import get_db
from src.models.emission import EmitResponse
from src.core.qr_generator import gerar_qr_code
from src.security import verify_token
from src.services.emission_service import EmissionService
from src.exceptions import TxekaNtiyisoException

router = APIRouter(tags=["emission"])
logger = logging.getLogger(__name__)
MAX_FILE_SIZE = 50 * 1024 * 1024
PDF_MAGIC = b"%PDF-"

class BulkDocumentItem(BaseModel):
    document_type: str = Field(..., example="DUAT")
    file_name: str = Field(..., example="documento.pdf")
    content: str = Field(..., description="Conteudo em texto ou string codificada")

class BulkEmissionInput(BaseModel):
    institution_id: str = Field(..., example="INAGE")
    documents: List[BulkDocumentItem]

def validate_pdf(file: UploadFile, content: bytes) -> None:
    filename = file.filename.lower() if file.filename else ""
    if not filename.endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Extensao ou Tipo MIME invalido. Aceita apenas .pdf")
    if not content.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="Falsificacao de formato. Conteudo nao e PDF valido")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Ficheiro excede o limite de 50MB")

@router.post("/certify", response_model=EmitResponse)
async def emit_document(file: UploadFile = File(...), document_type: str = "DUAT", institution_id: str = "INAGE", db: AsyncSession = Depends(get_db), current_user: dict = Depends(verify_token)) -> EmitResponse:
    if not file:
        raise HTTPException(status_code=400, detail="Nenhum ficheiro fornecido")
    document_bytes = await file.read()
    validate_pdf(file, document_bytes)
    service = EmissionService(db)
    try:
        result = await service.certify_document(institution_id=institution_id, document_type=document_type, file_name=file.filename, content=document_bytes.decode('latin-1'), issued_by=current_user.get("institution", "system"))
        db_result = await db.execute(select(Document).where(Document.doc_id == result["doc_id"]))
        doc_record = db_result.scalar_one_or_none()
        if not doc_record:
            raise HTTPException(status_code=500, detail="Documento nao encontrado apos emissao")
        qr_code_bytes = gerar_qr_code(doc_record.doc_hash, doc_record.doc_id)
        qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
        doc_record.qr_code = qr_code_base64
        doc_record.file_size = len(document_bytes)
        return EmitResponse(status="emitted", doc_id=doc_record.doc_id, hash_sha256=doc_record.doc_hash, qr_code=qr_code_base64, certificate_url=result["certificate_url"], message=f"Documento emitido com sucesso. Creditos restantes: {result['credits_remaining']}")
    except TxekaNtiyisoException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/certify/bulk", status_code=status.HTTP_201_CREATED)
async def emit_document_bulk(payload: BulkEmissionInput, db: AsyncSession = Depends(get_db), current_user: dict = Depends(verify_token)):
    service = EmissionService(db)
    try:
        documents_list = [doc.model_dump() for doc in payload.documents]
        result = await service.certify_bulk_documents(institution_id=payload.institution_id, documents_list=documents_list, issued_by=current_user.get("institution", "system"))
        return result
    except TxekaNtiyisoException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
