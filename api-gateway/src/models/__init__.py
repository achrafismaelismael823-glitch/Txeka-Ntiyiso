"""Models — definições ORM core."""

from src.database import Base
from .models import Document, Institution

__all__ = ["Base", "Document", "Institution"]
