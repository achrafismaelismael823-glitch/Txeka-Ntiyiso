"""Security — JWT authentication & RBAC."""

import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Callable, List

import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# ── Environment ───────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required")

if SECRET_KEY == JWT_SECRET_KEY:
    raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY must be different")

ALGORITHM = "HS256"

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

JWT_EXPIRATION_HOURS = 24
JWT_EXPIRATION_DAYS_ADMIN = 90
JWT_EXPIRATION_DAYS_INSTITUTION = 30

ALLOW_ANONYMOUS = os.getenv("TXEKA_ALLOW_ANONYMOUS", "false").lower() == "true"


# ── Password hashing (bcrypt nativo) ──────────

def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_bytes = plain_password.encode("utf-8")
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_bytes, hash_bytes)


# ── JWT ───────────────────────────────────────

def create_access_token(
    email: str,
    user_id: Optional[str] = None,
    role: str = "system",
    institution_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(hours=JWT_EXPIRATION_HOURS)
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
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        logger.warning(f"Token inválido: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict:
    try:
        if credentials is None:
            if ALLOW_ANONYMOUS:
                return {
                    "email": "anonymous@txeka.co.mz",
                    "role": "citizen",
                    "id": "anonymous",
                    "institution": None,
                    "authenticated": False
                }
            raise HTTPException(status_code=401, detail="Autenticação obrigatória")

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
        raise HTTPException(status_code=401, detail="Falha na autenticação")


# ── RBAC (active) ─────────────────────────────

def verify_role(required_role: str) -> Callable:
    async def role_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and required_role != "citizen":
            raise HTTPException(status_code=401, detail="Autenticação necessária")
        if user["role"] not in [required_role, "admin"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return user
    return role_checker


# ── Scopes (prepared, not active) ─────────────

class AuthConfig:
    ROLES: Dict[str, List[str]] = {
        "citizen": ["verify"],
        "institution": ["emission", "verify", "revoke"],
        "admin": ["emission", "verify", "revoke", "audit", "institution_manage", "credit_manage"],
        "system": ["*"],
    }

    @classmethod
    def get_scopes_for_role(cls, role: str) -> List[str]:
        return cls.ROLES.get(role, [])


def verify_scopes(required_scopes: List[str]) -> Callable:
    async def scope_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and any(s != "verify" for s in required_scopes):
            raise HTTPException(status_code=401, detail="Token ausente ou inválido")

        if user["role"] in ["admin", "system"]:
            return user

        user_scopes = AuthConfig.get_scopes_for_role(user["role"])

        for scope in required_scopes:
            if scope == "verify":
                continue
            if scope not in user_scopes and "*" not in user_scopes:
                raise HTTPException(status_code=403, detail="Permissão insuficiente")

        return user
    return scope_checker


# ── Helpers ───────────────────────────────────

def is_authenticated(user: Dict) -> bool:
    return user.get("authenticated", False)


def get_user_email(user: Dict) -> str:
    return user.get("email", "anonymous@txeka.co.mz")


def get_user_id(user: Dict) -> str:
    return user.get("id", "unknown")


def get_user_role(user: Dict) -> str:
    return user.get("role", "citizen")
