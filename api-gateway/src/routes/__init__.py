"""
Routes package - API endpoint definitions.

Aggregates all route modules for document emission, verification, and revocation.
"""

from . import emission_routes
from . import verify
from . import revocation

__all__ = ["emission_routes", "verify", "revocation"]
