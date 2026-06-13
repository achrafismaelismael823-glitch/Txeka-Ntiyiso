import os
import logging
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("uvicorn")

# 1. Configuração da Connection String Assíncrona
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# 2. Criação do Engine e Gerador de Sessões
engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 3. Definição do Base ORM
Base = declarative_base()

class AuditBase(Base):
    __abstract__ = True
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

# 4. Dependency Injection para as rotas da API
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# 5. Função de Verificação de Conexão  main.py
async def init_db():
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        logger.info("Base de dados conectada com sucesso (Conexão Assíncrona OK).")
    except Exception as e:
        logger.error(f"Erro crítico ao testar ligação à Base de Dados: {e}")
        raise
