"""
Routes package - API endpoint definitions.
Aggregates all route modules for document emission, verification,
revocation, and audit.
"""

from src.routes.emission_routes import router as emission_router
from src.routes.verify import router as verify_router
from src.routes.revocation import router as revocation_router
from src.routes.audit_routes import router as audit_router

__all__ = ["emission_router", "verify_router", "revocation_router", "audit_router"]
