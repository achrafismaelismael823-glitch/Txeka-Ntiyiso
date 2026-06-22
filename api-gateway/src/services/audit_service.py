"""
TXEKA NTIYISO API - AUDIT SERVICE
Servico de auditoria para conformidade legal.
"""

import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import Request

from src.models.audit_log import AuditLog, now_cat

logger = logging.getLogger("uvicorn")


class AuditService:
    """
    Servico responsavel por registrar todas as acoes auditaveis.
    
    Acoes auditaveis:
    - EMIT: Emissao de documento
    - VERIFY: Verificacao de documento
    - REVOKE: Revogacao de documento
    - LOGIN: Autenticacao bem-sucedida
    - LOGOUT: Encerramento de sessao
    - EXPORT: Exportacao de dados
    - DELETE: Eliminacao de dados
    - SYSTEM: Acoes do sistema
    
    Todos os timestamps em CAT (UTC+2) - horario de Mocambique.
    """
    
    @staticmethod
    async def log(
        session: AsyncSession,
        user_email: str,
        action: str,
        resource_type: str,
        resource_id: str,
        institution_id: Optional[str] = None,
        request: Optional[Request] = None,
        success: bool = True,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        try:
            ip_address = None
            user_agent = None
            request_path = None
            request_method = None
            
            if request is not None:
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
                request_path = str(request.url.path)
                request_method = request.method
            
            audit = AuditLog(
                user_email=user_email,
                action=action.upper(),
                resource_type=resource_type.upper(),
                resource_id=str(resource_id),
                institution_id=institution_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request_path=request_path,
                request_method=request_method,
                status_code=status_code,
                success=success,
                details=json.dumps(details) if details else None,
                timestamp=now_cat(),
                created_at=now_cat(),
            )
            
            session.add(audit)
            await session.commit()
            
            logger.info(f"[AUDIT] {action} by {user_email} on {resource_type}:{resource_id}")
            return audit
            
        except Exception as e:
            logger.error(f"[AUDIT ERROR] Falha ao registrar auditoria: {e}")
            await session.rollback()
            raise
    
    @staticmethod
    async def log_emit(session, user_email, doc_hash, institution_id, request=None, success=True, status_code=None, details=None):
        return await AuditService.log(session, user_email, "EMIT", "DOCUMENT", doc_hash, institution_id, request, success, status_code, details)
    
    @staticmethod
    async def log_verify(session, user_email, doc_hash, institution_id=None, request=None, success=True, status_code=None, details=None):
        return await AuditService.log(session, user_email, "VERIFY", "DOCUMENT", doc_hash, institution_id, request, success, status_code, details)
    
    @staticmethod
    async def log_revoke(session, user_email, doc_hash, institution_id, request=None, success=True, status_code=None, details=None):
        return await AuditService.log(session, user_email, "REVOKE", "DOCUMENT", doc_hash, institution_id, request, success, status_code, details)
    
    @staticmethod
    async def get_logs(session, action=None, resource_type=None, user_email=None, institution_id=None, start_date=None, end_date=None, limit=100, offset=0):
        query = select(AuditLog).order_by(desc(AuditLog.timestamp))
        if action: query = query.where(AuditLog.action == action.upper())
        if resource_type: query = query.where(AuditLog.resource_type == resource_type.upper())
        if user_email: query = query.where(AuditLog.user_email == user_email)
        if institution_id: query = query.where(AuditLog.institution_id == institution_id)
        if start_date: query = query.where(AuditLog.timestamp >= start_date)
        if end_date: query = query.where(AuditLog.timestamp <= end_date)
        query = query.limit(limit).offset(offset)
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_document_history(session, doc_hash):
        query = select(AuditLog).where(AuditLog.resource_id == doc_hash).order_by(desc(AuditLog.timestamp))
        result = await session.execute(query)
        return result.scalars().all()
