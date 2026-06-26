"""
Audit Routes — Consulta de logs de auditoria.
🇲🇿 Txeka Ntiyiso: acesso restrito a administradores.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.security import verify_role
from src.services.audit_service import AuditService

router = APIRouter(
    prefix="/audit",
    tags=["audit"],
    responses={
        401: {"description": "Autenticacao obrigatoria"},
        403: {"description": "Acesso negado - requer permissao de administrador"},
        500: {"description": "Erro interno"},
    }
)


@router.get("/logs", dependencies=[Depends(verify_role("admin"))])
async def get_audit_logs(
    action: Optional[str] = Query(None, description="Filtrar por acao: EMIT, VERIFY, REVOKE, LOGIN, EXPORT"),
    resource_type: Optional[str] = Query(None, description="Filtrar por tipo: DOCUMENT, CERTIFICATE, INSTITUTION"),
    user_email: Optional[str] = Query(None, description="Filtrar por email do utilizador"),
    institution_id: Optional[str] = Query(None, description="Filtrar por instituicao"),
    start_date: Optional[str] = Query(None, description="Data inicio (ISO 8601): 2026-01-01T00:00:00"),
    end_date: Optional[str] = Query(None, description="Data fim (ISO 8601): 2026-12-31T23:59:59"),
    limit: int = Query(100, ge=1, le=1000, description="Maximo de registros (1-1000)"),
    offset: int = Query(0, ge=0, description="Offset para paginacao"),
    db: AsyncSession = Depends(get_db),
):
    """Consulta logs de auditoria com filtros. Acesso admin."""
    logs = await AuditService.get_logs(
        session=db,
        action=action,
        resource_type=resource_type,
        user_email=user_email,
        institution_id=institution_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    
    return {
        "success": True,
        "count": len(logs),
        "limit": limit,
        "offset": offset,
        "timezone": "CAT (UTC+2)",
        "logs": [log.to_dict() for log in logs],
    }


@router.get("/document/{doc_hash}/history", dependencies=[Depends(verify_role("admin"))])
async def get_document_audit_history(
    doc_hash: str,
    db: AsyncSession = Depends(get_db),
):
    """Histórico completo de auditoria de um documento. Acesso admin."""
    logs = await AuditService.get_document_history(
        session=db,
        doc_hash=doc_hash,
    )
    
    return {
        "success": True,
        "doc_hash": doc_hash,
        "total_actions": len(logs),
        "timezone": "CAT (UTC+2)",
        "history": [log.to_dict() for log in logs],
    }


@router.get("/stats", dependencies=[Depends(verify_role("admin"))])
async def get_audit_stats(
    institution_id: Optional[str] = Query(None, description="Filtrar por instituicao"),
    start_date: Optional[str] = Query(None, description="Data inicio (ISO 8601)"),
    end_date: Optional[str] = Query(None, description="Data fim (ISO 8601)"),
    db: AsyncSession = Depends(get_db),
):
    """Estatísticas de auditoria para dashboards. Acesso admin."""
    return {
        "success": True,
        "period": {
            "start": start_date,
            "end": end_date,
        },
        "institution_id": institution_id,
        "timezone": "CAT (UTC+2)",
        "stats": {
            "note": "Implementar queries agregadas no proximo sprint",
        },
    }
