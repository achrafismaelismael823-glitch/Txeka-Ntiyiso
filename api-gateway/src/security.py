"""
Txeka Ntiyiso - Security Module
Enterprise-grade JWT authentication and authorization.
"""

import os
import logging
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Callable

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuração
SECRET_KEY = os.getenv("SECRET_KEY", "txeka-dev-secret-change-in-production")
ALGORITHM = "HS256"

# Contexto para hash de passwords (legado - mantido para compatibilidade)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Logger
logger = logging.getLogger(__name__)


def get_password_hash(password: str) -> str:
    """Gera hash bcrypt da password."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password contra hash bcrypt."""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria token JWT com claims e expiração."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Dict:
    """Verifica e decodifica token JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Token inválido: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


class TokenBearer(HTTPBearer):
    """Bearer token personalizado para Txeka Ntiyiso."""
    
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        credentials = await super().__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Esquema de autenticação inválido."
                )
            return credentials
        return None


# Instância reutilizável
token_bearer = TokenBearer()



def verify_role(required_role: str):
    """Factory que retorna uma funcao de dependencia para verificar roles."""
    def role_checker(token: str = Depends(token_bearer)):
        payload = verify_token(token.credentials if hasattr(token, "credentials") else token)
        user_role = payload.get("role", "public")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Role necessario: {required_role}"
            )
        return payload
    return role_checker
