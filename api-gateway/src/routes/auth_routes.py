"""Auth Routes — login para instituições e admin."""

import logging
import os
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from src.core.rate_limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.schemas import InstitutionLoginRequest, InstitutionLoginResponse, AdminLoginRequest
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
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    if not verify_password(data.password, admin_password_hash):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    # Admin = 90 dias
    token = create_access_token(
        email=admin_email,
        user_id="admin",
        role="admin",
        institution_id=None,
        expires_delta=timedelta(days=JWT_EXPIRATION_DAYS_ADMIN)
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
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar se a conta está inativa (403 Forbidden)
    if hasattr(institution, '_inactive_reason'):
        raise HTTPException(status_code=403, detail=institution._inactive_reason)
    
    # Institution = 30 dias (mais seguro)
    token = create_access_token(
        email=institution.contact_email or f"{institution.id}@txeka.local",
        user_id=institution.id,
        role="institution",
        institution_id=institution.id,
        expires_delta=timedelta(days=JWT_EXPIRATION_DAYS_INSTITUTION)
    )
    
    logger.info(f"Instituição {institution.id} autenticada com sucesso (token: {JWT_EXPIRATION_DAYS_INSTITUTION} dias)")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "institution": institution,
        "expires_in_days": JWT_EXPIRATION_DAYS_INSTITUTION,
        "message": f"Bem-vindo, {institution.name}!"
    }
