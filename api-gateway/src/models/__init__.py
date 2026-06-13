"""
Models package - Core ORM definitions for the document management system.
"""

from src.database import Base
from .models import Document, Institution

__all__ = ["Base", "Document", "Institution"]
