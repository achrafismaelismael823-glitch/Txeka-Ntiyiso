"""
TXEKA NTIYISO API - DATABASE
"""

import asyncio
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
        logger.warning("DATABASE_URL nao configurada. Engine nao inicializado.")
        return None
    return create_async_engine(
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
        raise RuntimeError("Database nao configurado. Verifique DATABASE_URL.")
    max_retries = 3
    for attempt in range(max_retries):
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
                return
            except Exception as e:
                await session.rollback()
                if attempt < max_retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f"DB retry {attempt+1}/{max_retries} em {wait}s: {e}")
                    await asyncio.sleep(wait)
                else:
                    raise
            finally:
                await session.close()

async def init_db():
    if engine is None:
        logger.warning("init_db() chamado mas engine nao esta disponivel.")
        return False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Base de dados conectada com sucesso.")
        return True
    except Exception as e:
        logger.warning(f"init_db() falhou (PgBouncer warm-up?): {e}")
        return False
