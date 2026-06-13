"""
Models package - Core ORM definitions for the document management system.

Exports the primary database models and base declarative class.
"""


from .database import Base

from .models import Document, Institution

__all__ = ["Base", "Document", "Institution"]
