"""
TXEKA NTIYISO API - DATABASE
Engine async com validação de URL e graceful fallback.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from src.settings import settings

logger = logging.getLogger("uvicorn")

def _create_engine_safe():
    db_url = settings.database_url_async
    if not db_url or db_url == "postgresql+asyncpg://":
        logger.warning("DATABASE_URL não configurada. Engine não inicializado.")
        return None
    return create_async_engine(
        db_url,
        echo=False,
        connect_args={"statement_cache_size": 0},
        pool_pre_ping=True,
        pool_recycle=3600,
    )

engine = _create_engine_safe()

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
) if engine else None

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

async def get_db():
    if AsyncSessionLocal is None:
        raise RuntimeError("Database não configurado. Verifique DATABASE_URL.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    if engine is None:
        logger.warning("init_db() chamado mas engine não está disponível.")
        return
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Base de dados conectada com sucesso.")
    except Exception as e:
        logger.error(f"Erro crítico ao testar ligação à Base de Dados: {e}")
        raise
