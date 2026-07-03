"""Exceptions — exceções customizadas da API Txeka Ntiyiso."""

from fastapi import Request, status
from fastapi.responses import JSONResponse


class TxekaNtiyisoException(Exception):
    """Base para exceções customizadas."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code


class DocumentNotFoundError(TxekaNtiyisoException):
    """Documento não encontrado."""
    def __init__(self, identifier: str):
        super().__init__(
            message=f"O documento '{identifier}' não foi encontrado.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class InsufficientCreditsError(TxekaNtiyisoException):
    """Créditos insuficientes."""
    def __init__(self, institution_id: str):
        super().__init__(
            message=f"Instituição '{institution_id}' sem créditos.",
            status_code=status.HTTP_402_PAYMENT_REQUIRED
        )


class InvalidDocumentContentError(TxekaNtiyisoException):
    """Conteúdo do documento inválido."""
    def __init__(self, detail: str):
        super().__init__(
            message=f"Conteúdo inválido: {detail}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class RevocationError(TxekaNtiyisoException):
    """Tentativa inválida de revogação."""
    def __init__(self, detail: str):
        super().__init__(
            message=detail,
            status_code=status.HTTP_403_FORBIDDEN
        )


# Global exception handler
async def txeka_exception_handler(request: Request, exc: TxekaNtiyisoException):
    """Retorna JSON padronizado para exceções customizadas."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_type": exc.__class__.__name__,
            "message": exc.message,
            "path": request.url.path
        }
    )
