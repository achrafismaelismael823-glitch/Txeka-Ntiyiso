import logging
import structlog
from contextvars import ContextVar

# Context Variable para armazenar um ID único para cada requisição (Correlation ID)
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="system")

def setup_logger():
    """
    Configura o logger estruturado (JSON) para toda a aplicação.
    Deve ser chamado uma única vez no evento de startup do FastAPI.
    """
    
    # Configuração base do Python logging
    logging.basicConfig(
        format="%(message)s",
        level=logging.INFO,
    )

    # Configuração do Structlog (Pipeline de processamento do log)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,      # Injeta variáveis de contexto (ex: correlation_id)
            structlog.processors.add_log_level,           # Adiciona o nível do log (INFO, ERROR, WARNING)
            structlog.processors.TimeStamper(fmt="iso"),  # Adiciona timestamp no formato ISO 8601
            structlog.processors.JSONRenderer()           # Renderiza a saída final em formato JSON
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

def get_logger(module_name: str):
    """
    Retorna uma instância do logger configurado para ser usado nos arquivos.
    Exemplo de uso: logger = get_logger(__name__)
    """
    return structlog.get_logger(module_name)
