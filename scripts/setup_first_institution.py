"""
Setup First Institution — cria a primeira instituição.
Usage: python scripts/setup_first_institution.py --id INAGE --name "..." --email ... --credits 500
"""

import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api-gateway'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.models.schemas import InstitutionCreate
from src.services.institution_service import InstitutionService


async def main():
    parser = argparse.ArgumentParser(description="Cria primeira instituição no Txeka Ntiyiso")
    parser.add_argument("--id", required=True, help="Código da instituição (ex: INAGE)")
    parser.add_argument("--name", required=True, help="Nome completo")
    parser.add_argument("--email", required=True, help="Email de contacto")
    parser.add_argument("--credits", type=int, default=100, help="Créditos iniciais")
    parser.add_argument("--plan", default="standard", help="Plano de subscrição")
    
    args = parser.parse_args()
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL não definida")
        sys.exit(1)
    
    if db_url.startswith("postgresql://") and "asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # ✅ FIX CRITICO: Desativa prepared statements para compatibilidade com PgBouncer
    # Render atualizou para pool_mode=transaction, que descarta statements a cada transação
    # statement_cache_size=0 previne DuplicatePreparedStatementError
    engine = create_async_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "command_timeout": 60,
        },
    )
    AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        try:
            data = InstitutionCreate(
                id=args.id.upper(),
                name=args.name,
                contact_email=args.email,
                credits=args.credits,
                subscription_plan=args.plan
            )
            
            result = await InstitutionService.create_institution(db, data, created_by="system_setup")
            
            print(f"\n{'='*60}")
            print(f"✅ INSTITUIÇÃO CRIADA COM SUCESSO")
            print(f"{'='*60}")
            print(f"   ID:        {result['institution'].id}")
            print(f"   Nome:      {result['institution'].name}")
            print(f"   Email:     {result['institution'].contact_email}")
            print(f"   Créditos:  {result['institution'].credits}")
            print(f"   Status:    {result['institution'].status}")
            print(f"   Aprovada:  {result['institution'].approved}")
            print(f"\n{'='*60}")
            print(f"🔐 CREDENCIAIS TEMPORÁRIAS")
            print(f"{'='*60}")
            print(f"   Institution ID: {result['institution'].id}")
            print(f"   Password:       {result['temp_password']}")
            print(f"\n⚠️  GUARDE ESTA PASSWORD — não será mostrada novamente!")
            print(f"   Enviar para: {result['institution'].contact_email}")
            print(f"{'='*60}\n")
            
        except ValueError as e:
            print(f"❌ Erro: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")
            sys.exit(1)
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
