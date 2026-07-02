"""Credit Check Middleware."""

import logging
from fastapi import HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.services.institution_service import InstitutionService

logger = logging.getLogger(__name__)


async def check_credits(institution_id: str, db: AsyncSession = Depends(get_db)) -> bool:
    institution = await InstitutionService.get_institution(db, institution_id)
    
    if not institution:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")
    
    if not institution.approved:
        raise HTTPException(status_code=403, detail="Instituição ainda não aprovada")
    
    if institution.status != "active":
        raise HTTPException(status_code=403, detail=f"Instituição {institution.status}")
    
    if institution.credits <= 0:
        raise HTTPException(
            status_code=402,
            detail="Créditos esgotados. Contacte o administrador (admin@txeka.co.mz) para recarga."
        )
    
    return True
