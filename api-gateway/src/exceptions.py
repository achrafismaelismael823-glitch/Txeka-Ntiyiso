from fastapi import Request, status
from fastapi.responses import JSONResponse

class TxekaNtiyisoException(Exception):
    """Classe base para todas as exceções customizadas da API."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code

class DocumentNotFoundError(TxekaNtiyisoException):
    """Lançada quando um documento não é encontrado via hash ou ID."""
    def __init__(self, identifier: str):
        super().__init__(
            message=f"O documento '{identifier}' não foi encontrado na nossa base de dados.",
            status_code=status.HTTP_404_NOT_FOUND
        )

class InsufficientCreditsError(TxekaNtiyisoException):
    """Lançada quando a instituição tenta emitir um documento sem créditos."""
    def __init__(self, institution_id: str):
        super().__init__(
            message=f"A instituição '{institution_id}' não possui créditos suficientes para esta emissão.",
            status_code=status.HTTP_402_PAYMENT_REQUIRED
        )

class InvalidDocumentContentError(TxekaNtiyisoException):
    """Lançada quando a validação do PDF ou dados falha."""
    def __init__(self, detail: str):
        super().__init__(
            message=f"Conteúdo do documento inválido: {detail}",
            status_code=status.HTTP_400_BAD_REQUEST
        )

class RevocationError(TxekaNtiyisoException):
    """Lançada quando há uma tentativa inválida de revogar um documento."""
    def __init__(self, detail: str):
        super().__init__(
            message=detail,
            status_code=status.HTTP_403_FORBIDDEN
        )

# -------------------------------------------------------------------
# GLOBAL EXCEPTION HANDLER 

async def txeka_exception_handler(request: Request, exc: TxekaNtiyisoException):
    """
    Captura todas as exceções customizadas e retorna um JSON padronizado.
    Isso evita vazamento de stack traces e garante consistência no Frontend.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_type": exc.__class__.__name__,
            "message": exc.message,
            "path": request.url.path
        }
  )
