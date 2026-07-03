"""Logging — configuração do logger estruturado (JSON) com correlation ID."""

import logging
import structlog
from contextvars import ContextVar

# Correlation ID para rastreabilidade entre requests
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="system")


def setup_logger():
    """Configura logger JSON. Chamar uma vez no startup."""
    
    # Python logging base
    logging.basicConfig(
        format="%(message)s",
        level=logging.INFO,
    )

    # Structlog pipeline
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,      # correlation_id
            structlog.processors.add_log_level,           # INFO, ERROR, WARNING
            structlog.processors.TimeStamper(fmt="iso"),  # timestamp ISO 8601
            structlog.processors.JSONRenderer()           # saída JSON
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(module_name: str):
    """Retorna logger configurado. Uso: logger = get_logger(__name__)"""
    return structlog.get_logger(module_name)
