from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.models.database import get_db
from src.models import Document
from src.core.security import verify_token

router = APIRouter(tags=["emissions"])


@router.get("/emissions")
async def list_emissions(
    institution_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Lista todos os documentos emitidos."""
    query = db.query(Document)

    if institution_id:
        query = query.filter(Document.institution_id == institution_id)

    documents = query.order_by(Document.created_at.desc()).all()

    return {
        "total": len(documents),
        "emissions": [
            {
                "doc_id": d.doc_id,
                "doc_hash": d.doc_hash,
                "document_type": d.document_type,
                "institution_id": d.institution_id,
                "certificate_url": d.certificate_url,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in documents
        ]
    }

