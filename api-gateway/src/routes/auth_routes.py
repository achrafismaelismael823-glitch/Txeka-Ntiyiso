"""Auth Routes — login para instituições e admin."""

import inspect
import logging
import os
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from src.core.rate_limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.schemas import InstitutionLoginRequest, InstitutionLoginResponse, AdminLoginRequest
from src.services.audit_service import AuditService
from src.services.institution_service import InstitutionService
from src.security import (
    create_access_token, 
    verify_password, 
    get_password_hash,
    JWT_EXPIRATION_DAYS_ADMIN,        
    JWT_EXPIRATION_DAYS_INSTITUTION   
)

from src.settings import settings
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

UNKNOWN_LOGIN_EMAIL = "unknown"


async def _safe_log_login(session, **kwargs):
    try:
        await AuditService.log_login(session=session, **kwargs)
    except Exception as e:
        logger.error("[AUDIT ERROR] Falha ao registrar LOGIN: %s", e)


async def _safe_log_login_isolated(**kwargs):
    try:
        from src.database import AsyncSessionLocal
        if AsyncSessionLocal is None:
            logger.error("[AUDIT ERROR] Database nao configurado. LOGIN nao persistido.")
            return
        session = AsyncSessionLocal()
        try:
            await AuditService.log_login(session=session, **kwargs)
        finally:
            close_result = session.close()
            if inspect.isawaitable(close_result):
                await close_result
    except Exception as e:
        logger.error("[AUDIT ERROR] Falha ao registrar LOGIN: %s", e)


@router.post("/admin/login")
@limiter.limit("5/minute")
async def login_admin(data: AdminLoginRequest, request: Request):
    """Login para administradores com acesso full. V3: credenciais via JSON body."""
    admin_email = settings.ADMIN_EMAIL
    admin_password_hash = settings.ADMIN_PASSWORD_HASH.get_secret_value()
    
    if not admin_password_hash:
        logger.error("ADMIN_PASSWORD_HASH nao configurado")
        raise HTTPException(status_code=500, detail="Configuracao de admin incompleta")
    
    if data.email != admin_email:
        await _safe_log_login_isolated(
            user_email=data.email,
            resource_type="ADMIN",
            resource_id="admin",
            institution_id=None,
            request=request,
            success=False,
            status_code=401,
            details={"reason": "email"},
        )
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    if not verify_password(data.password, admin_password_hash):
        await _safe_log_login_isolated(
            user_email=data.email,
            resource_type="ADMIN",
            resource_id="admin",
            institution_id=None,
            request=request,
            success=False,
            status_code=401,
            details={"reason": "password"},
        )
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    # Admin = 90 dias
    token = create_access_token(
        email=admin_email,
        user_id="admin",
        role="admin",
        institution_id=None,
        expires_delta=timedelta(days=JWT_EXPIRATION_DAYS_ADMIN)
    )
    
    await _safe_log_login_isolated(
        user_email=admin_email,
        resource_type="ADMIN",
        resource_id="admin",
        institution_id=None,
        request=request,
        success=True,
        status_code=200,
        details={"actor_type": "admin"},
    )

    logger.info(f"Admin {admin_email} autenticado com sucesso (token: 90 dias)")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "admin",
        "expires_in_days": JWT_EXPIRATION_DAYS_ADMIN,
        "message": "Bem-vindo, Administrador Txeka Ntiyiso!"
    }


@router.post("/login", response_model=InstitutionLoginResponse)
@limiter.limit("5/minute")
async def login_institution(request: Request, data: InstitutionLoginRequest, db: AsyncSession = Depends(get_db)):
    institution = await InstitutionService.authenticate_institution(
        db, data.institution_id, data.password
    )
    
    if not institution:
        await _safe_log_login(
            db,
            user_email=UNKNOWN_LOGIN_EMAIL,
            resource_type="INSTITUTION",
            resource_id=data.institution_id,
            institution_id=data.institution_id,
            request=request,
            success=False,
            status_code=401,
            details={"actor_type": "institution"},
        )
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar se a conta está inativa (403 Forbidden)
    if hasattr(institution, '_inactive_reason'):
        raise HTTPException(status_code=403, detail=institution._inactive_reason)

    # Verificar se instituição está ativa e aprovada
    if institution.status != "active":
        raise HTTPException(status_code=403, detail="Instituição desativada. Contacte o administrador.")

    if not institution.approved:
        raise HTTPException(status_code=403, detail="Instituição pendente de aprovação. Aguarde validação do administrador.")
    
    # Institution = 30 dias (mais seguro)
    token = create_access_token(
        email=institution.contact_email or f"{institution.id}@txeka.local",
        user_id=institution.id,
        role="institution",
        institution_id=institution.id,
        expires_delta=timedelta(days=JWT_EXPIRATION_DAYS_INSTITUTION),
        institution_epoch=institution.token_epoch
    )

    await _safe_log_login(
        db,
        user_email=institution.contact_email or UNKNOWN_LOGIN_EMAIL,
        resource_type="INSTITUTION",
        resource_id=institution.id,
        institution_id=institution.id,
        request=request,
        success=True,
        status_code=200,
        details={"actor_type": "institution"},
    )
    
    logger.info(f"Instituição {institution.id} autenticada com sucesso (token: {JWT_EXPIRATION_DAYS_INSTITUTION} dias)")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "institution": institution,
        "expires_in_days": JWT_EXPIRATION_DAYS_INSTITUTION,
        "message": f"Bem-vindo, {institution.name}!"
    }
