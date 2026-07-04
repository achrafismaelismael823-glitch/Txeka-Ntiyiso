"""Auth Routes — login para instituições e admin."""

import logging
import os
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.schemas import InstitutionLoginRequest, InstitutionLoginResponse
from src.services.institution_service import InstitutionService
from src.security import create_access_token, verify_password, get_password_hash

from src.settings import settings
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/admin/login")
async def login_admin(email: str, password: str):
    admin_email = settings.ADMIN_EMAIL
    admin_password_hash = settings.ADMIN_PASSWORD_HASH.get_secret_value()
    
    if not admin_password_hash:
        logger.error("ADMIN_PASSWORD_HASH nao configurado")
        raise HTTPException(status_code=500, detail="Configuracao de admin incompleta")
    
    if email != admin_email:
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    if not verify_password(password, admin_password_hash):
        raise HTTPException(status_code=401, detail="Credenciais invalidas")
    
    token = create_access_token(
        email=admin_email,
        user_id="admin",
        role="admin",
        institution_id=None,
        expires_delta=timedelta(hours=24)
    )
    
    logger.info(f"Admin {admin_email} autenticado com sucesso")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "admin",
        "message": "Bem-vindo, Administrador Txeka Ntiyiso!"
    }


@router.post("/login", response_model=InstitutionLoginResponse)
async def login_institution(data: InstitutionLoginRequest, db: AsyncSession = Depends(get_db)):
    institution = await InstitutionService.authenticate_institution(
        db, data.institution_id, data.password
    )
    
    if not institution:
        raise HTTPException(status_code=401, detail="Credenciais inválidas ou conta inativa")
    
    token = create_access_token(
        email=institution.contact_email or f"{institution.id}@txeka.local",
        user_id=institution.id,
        role="institution",
        institution_id=institution.id,
        expires_delta=timedelta(hours=24)
    )
    
    logger.info(f"Instituição {institution.id} autenticada com sucesso")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "institution": institution,
        "message": f"Bem-vindo, {institution.name}!"
    }
