"""
Emission Routes - Endpoints para certificação/emoção de documentos digitais.

  Contexto Txeka Ntiyiso:
    Emissão de documentos oficiais moçambicanos (DUAT, certidões, etc.)
    com hashing SHA-256, QR code e rastro de auditoria imutável.

  Fluxo:
    1. Upload de PDF → validação de formato
    2. Cálculo de hash SHA-256 → fingerprint único
    3. Persistência na base de dados → registro imutável
    4. Geração de QR code → verificação offline
    5. Registro de auditoria → conformidade legal
"""

import logging
import base64
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.models.models import Document
from src.database import get_db
from src.models.emission import EmitResponse
from src.models.audit_log import now_cat
from src.core.qr_generator import gerar_qr_code
from src.security import verify_token
from src.services.emission_service import EmissionService
from src.services.audit_service import AuditService
from src.exceptions import TxekaNtiyisoException

router = APIRouter(tags=["emission"])
logger = logging.getLogger(__name__)

#  Constantes de validação
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB — limite seguro para PDFs
PDF_MAGIC = b"%PDF-"               # Magic bytes de ficheiros PDF


class BulkDocumentItem(BaseModel):
    """Item individual para emissão em massa (bulk)."""
    document_type: str = Field(..., example="DUAT")
    file_name: str = Field(..., example="documento.pdf")
    content: str = Field(..., description="Conteúdo em base64 ou texto")


class BulkEmissionInput(BaseModel):
    """Payload para emissão em massa de documentos."""
    institution_id: str = Field(..., example="INAGE")
    documents: List[BulkDocumentItem]


def validate_pdf(file: UploadFile, content: bytes) -> None:
    """
    Valida integridade e formato de um ficheiro PDF.
    
      Regras de segurança:
        - Extensão deve ser .pdf
        - MIME type deve ser application/pdf
        - Magic bytes devem corresponder a %PDF-
        - Tamanho não pode exceder 50MB
    
    Args:
        file: Objeto UploadFile do FastAPI
        content: Bytes brutos do ficheiro
    
    Raises:
        HTTPException 415: Formato inválido
        HTTPException 400: Falsificação de formato detectada
        HTTPException 413: Ficheiro excede limite
    """
    filename = file.filename.lower() if file.filename else ""
    if not filename.endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Extensao ou Tipo MIME invalido. Aceita apenas .pdf")
    if not content.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="Falsificacao de formato. Conteudo nao e PDF valido")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Ficheiro excede o limite de 50MB")


@router.post("/certify", response_model=EmitResponse)
async def emit_document(
    req: Request,
    file: UploadFile = File(...),
    document_type: str = "DUAT",
    institution_id: str = "INAGE",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> EmitResponse:
    """
    Emite um novo documento digital com certificação SHA-256.
    
      Regra de negócio:
        Cada documento recebe um doc_id único e um hash SHA-256
        que serve como fingerprint criptográfico. O documento
        original NUNCA é armazenado — apenas o hash e metadados.
    
    Args:
        req: Request object para metadados (IP, User-Agent)
        file: Ficheiro PDF a certificar
        document_type: Tipo do documento (DUAT, certidão, etc.)
        institution_id: Instituição emissora (INAGE, etc.)
        db: Sessão async do SQLAlchemy
        current_user: Utilizador autenticado via JWT
    
    Returns:
        EmitResponse com doc_id, hash, QR code e URL de certificado
    
    Raises:
        HTTPException 400: PDF inválido ou corrompido
        HTTPException 409: Documento já certificado (duplicado)
        HTTPException 500: Erro interno na persistência
    """
    if not file:
        raise HTTPException(status_code=400, detail="Nenhum ficheiro fornecido")
    
    document_bytes = await file.read()
    validate_pdf(file, document_bytes)
    
    service = EmissionService(db)
    try:
        #  Certificação — calcula hash e persiste metadados
        result = await service.certify_document(
            institution_id=institution_id,
            document_type=document_type,
            file_name=file.filename,
            content=document_bytes.decode('latin-1'),
            issued_by=current_user.get("institution", "system")
        )
        
        #  Recupera o registro recém-criado para enriquecer resposta
        db_result = await db.execute(select(Document).where(Document.doc_id == result["doc_id"]))
        doc_record = db_result.scalar_one_or_none()
        if not doc_record:
            raise HTTPException(status_code=500, detail="Documento nao encontrado apos emissao")
        
        #  Gera QR code para verificação offline
        qr_code_bytes = gerar_qr_code(doc_record.doc_hash, doc_record.doc_id)
        qr_code_base64 = f"data:image/png;base64,{base64.b64encode(qr_code_bytes).decode()}"
        doc_record.qr_code = qr_code_base64
        doc_record.file_size = len(document_bytes)
        
        #  REGISTRAR AUDITORIA — Emissão bem-sucedida
        await AuditService.log_emit(
            session=db,
            user_email=current_user.get("email", "unknown"),
            doc_hash=doc_record.doc_hash,
            institution_id=institution_id,
            request=req,
            success=True,
            status_code=200,
            details={
                "document_type": document_type,
                "file_name": file.filename,
                "file_size": len(document_bytes),
                "doc_id": doc_record.doc_id
            }
        )
        
        return EmitResponse(
            status="emitted",
            doc_id=doc_record.doc_id,
            hash_sha256=doc_record.doc_hash,
            qr_code=qr_code_base64,
            certificate_url=result["certificate_url"],
            timestamp=now_cat().isoformat(),
            message=f"Documento emitido com sucesso. Creditos restantes: {result['credits_remaining']}"
        )
    except TxekaNtiyisoException as e:
        #  Registrar falha de emissão na auditoria
        await AuditService.log_emit(
            session=db,
            user_email=current_user.get("email", "unknown"),
            doc_hash="unknown",
            institution_id=institution_id,
            request=req,
            success=False,
            status_code=e.status_code,
            details={"error": e.message, "document_type": document_type}
        )
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/certify/bulk", status_code=status.HTTP_201_CREATED)
async def emit_document_bulk(
    req: Request,
    payload: BulkEmissionInput,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Emite múltiplos documentos em lote (operação B2B/B2G).
    
      Casos de uso:
        - Instituições governamentais com alto volume
        - Integrações com sistemas legados
        - Migração de documentos históricos
    
    Args:
        req: Request object para metadados
        payload: Lista de documentos a certificar
        db: Sessão async do SQLAlchemy
        current_user: Utilizador autenticado via JWT
    
    Returns:
        Dict com lista de documentos emitidos e estatísticas
    """
    service = EmissionService(db)
    try:
        documents_list = [doc.model_dump() for doc in payload.documents]
        result = await service.certify_bulk_documents(
            institution_id=payload.institution_id,
            documents_list=documents_list,
            issued_by=current_user.get("institution", "system")
        )
        
        #  REGISTRAR AUDITORIA — Bulk emission bem-sucedida
        for doc in result.get("documents", []):
            await AuditService.log_emit(
                session=db,
                user_email=current_user.get("email", "unknown"),
                doc_hash=doc.get("hash_sha256", "unknown"),
                institution_id=payload.institution_id,
                request=req,
                success=True,
                status_code=201,
                details={
                    "document_type": doc.get("document_type", "unknown"),
                    "bulk": True,
                    "total_documents": len(documents_list)
                }
            )
        
        return result
    except TxekaNtiyisoException as e:
        #  Registrar falha de bulk emission na auditoria
        await AuditService.log_emit(
            session=db,
            user_email=current_user.get("email", "unknown"),
            doc_hash="unknown",
            institution_id=payload.institution_id,
            request=req,
            success=False,
            status_code=e.status_code,
            details={"error": e.message, "bulk": True, "total_documents": len(payload.documents)}
        )
        raise HTTPException(status_code=e.status_code, detail=e.message)
