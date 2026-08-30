"""Institution Routes — endpoints protegidos por role."""

import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models.schemas import (
    InstitutionCreate, InstitutionUpdate, InstitutionResponse,
    InstitutionListResponse, CreditTransactionCreate, CreditTransactionResponse,
    InstitutionCredits, InstitutionDashboard
)
from src.services.institution_service import InstitutionService
from src.security import verify_token, verify_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/institutions", tags=["Instituições"])


@router.post("", response_model=dict, dependencies=[Depends(verify_role("admin"))])
@limiter.limit("60/minute")
async def create_institution(request: Request, 
    data: InstitutionCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await InstitutionService.create_institution(
            db, data, created_by=current_user["email"]
        )
        return {
            "success": True,
            "institution": {
                "id": result["institution"].id,
                "name": result["institution"].name,
                "contact_email": result["institution"].contact_email,
                "credits": result["institution"].credits,
                "status": result["institution"].status,
            },
            "api_key": result["api_key"],
            "temp_password": result["temp_password"],
            "message": result["message"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Erro ao criar instituição: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao criar instituição")


@router.get("", response_model=InstitutionListResponse, dependencies=[Depends(verify_role("admin"))])
@limiter.limit("60/minute")
async def list_institutions(request: Request, 
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None, pattern="^(pending|active|suspended|inactive)$"),
    db: AsyncSession = Depends(get_db)
):
    institutions = await InstitutionService.list_institutions(db, skip, limit, status)
    total = await InstitutionService.count_institutions(db, status)
    return {"total": total, "institutions": institutions}


# ─── ROTA ESTÁTICA — DEVE vir antes de /{institution_id}/credit-history ───
# Sem isto, o FastAPI interpreta "me" como um institution_id e bloqueia
# instituições com 403, porque essa rota dinâmica exige role=admin.

@router.get("/me/credit-history", response_model=List[CreditTransactionResponse])
async def get_my_credit_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(verify_role("institution")),
    db: AsyncSession = Depends(get_db)
):
    # Esta rota é exclusiva para instituições. Administradores usam /{institution_id}/credit-history.
    institution_id = current_user.get("institution")
    if not institution_id:
        raise HTTPException(status_code=400, detail="Sem instituição associada")

    return await InstitutionService.get_credit_history(db, institution_id, skip, limit)


@router.get("/{institution_id}", response_model=InstitutionResponse, dependencies=[Depends(verify_role("admin"))])
async def get_institution(institution_id: str, db: AsyncSession = Depends(get_db)):
    institution = await InstitutionService.get_institution(db, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")
    return institution


@router.patch("/{institution_id}", response_model=InstitutionResponse, dependencies=[Depends(verify_role("admin"))])
async def update_institution(institution_id: str, data: InstitutionUpdate, db: AsyncSession = Depends(get_db)):
    try:
        # Validar status se fornecido
        if data.status and data.status not in ["pending", "active", "suspended", "inactive"]:
            raise HTTPException(status_code=400, detail=f"Status inválido: {data.status}. Valores permitidos: pending, active, suspended, inactive")

        institution = await InstitutionService.update_institution(db, institution_id, data)
        return institution
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{institution_id}/credits", response_model=InstitutionCredits, dependencies=[Depends(verify_role("admin"))])
async def add_credits(
    institution_id: str,
    data: CreditTransactionCreate,
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
):
    try:
        institution = await InstitutionService.add_credits(
            db, institution_id, data, created_by=current_user["email"]
        )
        return {
            "credits": institution.credits,
            "status": institution.status,
            "docs_emitted_month": institution.docs_emitted_month
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{institution_id}/credit-history", response_model=List[CreditTransactionResponse], dependencies=[Depends(verify_role("admin"))])
async def get_institution_credit_history(
    institution_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    institution = await InstitutionService.get_institution(db, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")
    return await InstitutionService.get_credit_history(db, institution_id, skip, limit)


@router.post("/{institution_id}/reset-password", response_model=dict, dependencies=[Depends(verify_role("admin"))])
async def reset_institution_password(institution_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await InstitutionService.reset_password(db, institution_id)
        # Senha NÃO é logada em texto puro — devolvida apenas uma vez na resposta HTTP ao admin autenticado
        logger.info(f"PASSWORD_RESET: institution={institution_id} by_admin=true")
        return {
            "success": True,
            "institution_id": result["institution"].id,
            "temp_password": result["temp_password"],
            "message": "Password resetada. Guarde esta senha temporária — não será mostrada novamente."
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{institution_id}/regenerate-api-key", response_model=dict, dependencies=[Depends(verify_role("admin"))])
async def regenerate_api_key(institution_id: str, db: AsyncSession = Depends(get_db)):
    try:
        new_key = await InstitutionService.regenerate_api_key(db, institution_id)
        return {
            "success": True,
            "api_key": new_key,
            "message": "Guarde esta chave — não será mostrada novamente!"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/me/dashboard", response_model=InstitutionDashboard)
@limiter.limit("60/minute")
async def get_my_dashboard(request: Request, 
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
):
    if current_user["role"] not in ["institution", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    institution_id = current_user.get("institution")
    if not institution_id:
        raise HTTPException(status_code=400, detail="Instituição não associada ao token")

    institution = await InstitutionService.get_institution(db, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")

    if current_user["role"] == "institution" and current_user.get("institution") != institution.id:
        raise HTTPException(status_code=403, detail="Só pode ver os seus dados")

    history = await InstitutionService.get_credit_history(db, institution.id, limit=20)

    return {
        "institution": institution,
        "credits_history": history,
        "total_emitted": institution.docs_emitted_month,
        "total_verifications": 0
    }


@router.get("/me/credits", response_model=InstitutionCredits)
@limiter.limit("60/minute")
async def get_my_credits(request: Request, 
    current_user: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
):
    if current_user["role"] not in ["institution", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    institution_id = current_user.get("institution")
    if not institution_id:
        raise HTTPException(status_code=400, detail="Sem instituição associada")

    institution = await InstitutionService.get_institution(db, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")

    return {
        "credits": institution.credits,
        "status": institution.status,
        "docs_emitted_month": institution.docs_emitted_month
        }
