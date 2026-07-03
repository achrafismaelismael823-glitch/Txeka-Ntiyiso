"""Security — autenticação JWT."""

import os
import uuid
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
security = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY or JWT_SECRET_KEY == "dev-secret-key":
    logger.warning("JWT_SECRET_KEY not configured or insecure. Using fallback.")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "txeka-fallback-secret-key-change-immediately")

JWT_EXPIRATION_HOURS = 24
ALLOW_ANONYMOUS = os.getenv("TXEKA_ALLOW_ANONYMOUS", "false").lower() == "true"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password contra hash bcrypt."""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(
    email: str,
    user_id: Optional[str] = None,
    role: str = "system",
    institution_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Gera JWT com claims: sub, email, id, role."""
    if expires_delta is None:
        expires_delta = timedelta(hours=AuthConfig.EXPIRATION_HOURS)
    expire = datetime.now(timezone.utc) + expires_delta
    now = datetime.now(timezone.utc)
    token_id = user_id or str(uuid.uuid4())
    
    payload = {
        "sub": email,
        "email": email,
        "id": token_id,
        "role": role,
        "institution": institution_id,
        "exp": expire,
        "iat": now,
        "type": "access"
    }
    return jwt.encode(payload, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)


def decode_token(token: str) -> Dict:
    """Decodifica JWT. Raises 401 se inválido/expirado."""
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


async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict:
    """Verifica Bearer token. Retorna anonymous se ALLOW_ANONYMOUS=true."""
    try:
        if credentials is None:
            if ALLOW_ANONYMOUS:
                return {"email": "anonymous@txeka.co.mz", "role": "citizen", "id": "anonymous", "institution": None, "authenticated": False}
            raise HTTPException(status_code=401, detail="Autenticacao obrigatoria")

        payload = decode_token(credentials.credentials)
        return {
            "email": payload.get("email") or payload.get("sub", "unknown"),
            "role": payload.get("role", "citizen"),
            "id": payload.get("id", "unknown"),
            "institution": payload.get("institution"),
            "authenticated": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Falha na autenticacao")


def verify_role(required_role: str) -> Callable:
    """RBAC: verifica role mínima."""
    async def role_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and required_role != "citizen":
            raise HTTPException(status_code=401, detail="Autenticacao necessaria")
        if user["role"] not in [required_role, "admin"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return user
    return role_checker


def verify_scopes(required_scopes: list[str]) -> Callable:
    """Verifica scopes (permissões granulares)."""
    async def scope_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and any(s != "verify" for s in required_scopes):
            raise HTTPException(status_code=401, detail="Token ausente ou invalido")
        user_scopes = AuthConfig.ROLES.get(user["role"], [])
        for scope in required_scopes:
            if scope not in user_scopes:
                raise HTTPException(status_code=403, detail="Permissao insuficiente")
        return user
    return scope_checker


def is_authenticated(user: Dict) -> bool:
    return user.get("authenticated", False)


def get_user_email(user: Dict) -> str:
    return user.get("email", "anonymous@txeka.co.mz")


def get_user_id(user: Dict) -> str:
    return user.get("id", "unknown")


def get_user_role(user: Dict) -> str:
    return user.get("role", "citizen")

