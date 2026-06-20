"""
Endpoint temporario para resetar o banco de dados.
REMOVER ESTE FICHEIRO APOS USO.
"""

from fastapi import APIRouter
from sqlalchemy import text
from src.database import engine

router = APIRouter(tags=["admin"])

@router.post("/admin/reset-db")
async def reset_db():
    """Reset total do schema. Recria tudo do zero no proximo deploy."""
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS documents CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS institutions CASCADE"))
    return {
        "status": "success",
        "message": "Tabelas removidas. Faca novo deploy para recriar schema com alembic upgrade head."
    }
