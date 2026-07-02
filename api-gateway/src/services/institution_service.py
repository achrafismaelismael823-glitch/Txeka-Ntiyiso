"""Institution Service — CRUD e gestão de créditos (manual)."""

import logging
import secrets
import string
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.models import Institution, CreditTransaction
from src.models.schemas import InstitutionCreate, InstitutionUpdate, CreditTransactionCreate
from src.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)):
            return password


def generate_api_key() -> str:
    return "txk_" + secrets.token_urlsafe(32)


class InstitutionService:
    
    @staticmethod
    async def create_institution(
        db: AsyncSession,
        data: InstitutionCreate,
        created_by: Optional[str] = None
    ) -> dict:
        existing = await db.get(Institution, data.id.upper())
        if existing:
            raise ValueError(f"Instituição '{data.id}' já existe")
        
        temp_password = generate_temp_password()
        password_hash = get_password_hash(temp_password)
        
        institution = Institution(
            id=data.id.upper(),
            name=data.name,
            contact_email=str(data.contact_email),
            password_hash=password_hash,
            role="institution",
            credits=data.credits,
            subscription_plan=data.subscription_plan,
            status="active",
            approved=True,
        )
        
        db.add(institution)
        await db.flush()
        
        if data.credits > 0:
            tx = CreditTransaction(
                institution_id=institution.id,
                amount=data.credits,
                type="bonus",
                description="Créditos iniciais atribuídos pelo administrador",
                payment_method="bonus",
                created_by=created_by or "system"
            )
            db.add(tx)
        
        await db.commit()
        await db.refresh(institution)
        
        return {
            "institution": institution,
            "temp_password": temp_password,
            "message": f"Instituição {institution.id} criada. Password temporária: {temp_password}"
        }
    
    @staticmethod
    async def get_institution(db: AsyncSession, institution_id: str) -> Optional[Institution]:
        return await db.get(Institution, institution_id.upper())
    
    @staticmethod
    async def list_institutions(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Institution]:
        query = select(Institution)
        if status:
            query = query.where(Institution.status == status)
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def count_institutions(db: AsyncSession, status: Optional[str] = None) -> int:
        query = select(func.count(Institution.id))
        if status:
            query = query.where(Institution.status == status)
        result = await db.execute(query)
        return result.scalar()
    
    @staticmethod
    async def update_institution(
        db: AsyncSession,
        institution_id: str,
        data: InstitutionUpdate
    ) -> Institution:
        institution = await db.get(Institution, institution_id.upper())
        if not institution:
            raise ValueError("Instituição não encontrada")
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(institution, field, value)
        
        institution.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(institution)
        return institution
    
    @staticmethod
    async def add_credits(
        db: AsyncSession,
        institution_id: str,
        data: CreditTransactionCreate,
        created_by: str
    ) -> Institution:
        institution = await db.get(Institution, institution_id.upper())
        if not institution:
            raise ValueError("Instituição não encontrada")
        
        institution.credits += data.amount
        
        tx = CreditTransaction(
            institution_id=institution.id,
            amount=data.amount,
            type=data.type,
            description=data.description or f"Adição manual de {data.amount} créditos",
            payment_method=data.payment_method or "none",
            payment_reference=data.payment_reference,
            notes=data.notes,
            created_by=created_by
        )
        db.add(tx)
        
        await db.commit()
        await db.refresh(institution)
        return institution
    
    @staticmethod
    async def consume_credit(
        db: AsyncSession,
        institution_id: str,
        description: str = "Emissão de documento"
    ) -> bool:
        institution = await db.get(Institution, institution_id.upper())
        if not institution:
            raise ValueError("Instituição não encontrada")
        
        if institution.credits <= 0:
            return False
        
        if not institution.approved or institution.status != "active":
            return False
        
        institution.credits -= 1
        institution.docs_emitted_month += 1
        
        tx = CreditTransaction(
            institution_id=institution.id,
            amount=-1,
            type="consumption",
            description=description,
            payment_method="none",
            created_by="system"
        )
        db.add(tx)
        
        await db.commit()
        await db.refresh(institution)
        return True
    
    @staticmethod
    async def get_credit_history(
        db: AsyncSession,
        institution_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[CreditTransaction]:
        query = (
            select(CreditTransaction)
            .where(CreditTransaction.institution_id == institution_id.upper())
            .order_by(CreditTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def authenticate_institution(
        db: AsyncSession,
        institution_id: str,
        password: str
    ) -> Optional[Institution]:
        institution = await db.get(Institution, institution_id.upper())
        if not institution:
            return None
        
        if not institution.password_hash:
            return None
        
        if not verify_password(password, institution.password_hash):
            return None
        
        if institution.status != "active" or not institution.approved:
            return None
        
        return institution
    
    @staticmethod
    async def reset_password(
        db: AsyncSession,
        institution_id: str
    ) -> dict:
        institution = await db.get(Institution, institution_id.upper())
        if not institution:
            raise ValueError("Instituição não encontrada")
        
        new_password = generate_temp_password()
        institution.password_hash = get_password_hash(new_password)
        institution.updated_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(institution)
        
        return {
            "institution": institution,
            "temp_password": new_password
        }
    
    @staticmethod
    async def regenerate_api_key(
        db: AsyncSession,
        institution_id: str
    ) -> str:
        institution = await db.get(Institution, institution_id.upper())
        if not institution:
            raise ValueError("Instituição não encontrada")
        
        new_key = generate_api_key()
        institution.api_key = new_key
        institution.updated_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(institution)
        return new_key
