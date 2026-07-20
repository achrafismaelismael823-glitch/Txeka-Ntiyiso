"""
TXEKA NTIYISO API - SECURITY
Autenticação JWT com passlib (padronizado).
Scopes e RBAC para uso futuro ( preparado, não ativado).
"""

import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Callable, List

from jose import JWTError, jwt
from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ============================================================
# PASSLIB: Padroniza hash/verify bcrypt
# Resolve login 401 causado por mismatch bcrypt direto vs passlib
# ============================================================
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ──────────────────────────────────────────────
# SEGURANÇA: Falha hard se variáveis não configuradas
# ──────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required")

# Garantir que as chaves são diferentes (camadas de segurança)
if SECRET_KEY == JWT_SECRET_KEY:
    raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY must be different")

ALGORITHM = "HS256"

# Logger
logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# Expirações por perfil
JWT_EXPIRATION_HOURS = 24
JWT_EXPIRATION_DAYS_ADMIN = 90
JWT_EXPIRATION_DAYS_INSTITUTION = 30

ALLOW_ANONYMOUS = os.getenv("TXEKA_ALLOW_ANONYMOUS", "false").lower() == "true"


# ============================================================
# AUTH CONFIG: Roles e Scopes para RBAC
# Mantido para uso futuro de verify_scopes
# ============================================================
class AuthConfig:
    """
    Configuração de roles e scopes do Txeka Ntiyiso.
    Scopes granulares para permissões futuras (ex: emission, verify, audit).
    
    NOTA: verify_scopes está pronto mas NÃO está ativo nas rotas.
    Para ativar, substituir verify_role por verify_scopes nas rotas desejadas.
    """
    ROLES: Dict[str, List[str]] = {
        "citizen": ["verify"],           # Cidadão: apenas verificar documentos
        "institution": ["emission", "verify", "revoke"],  # Instituição: emitir, verificar, revogar
        "admin": ["emission", "verify", "revoke", "audit", "institution_manage", "credit_manage"],  # Admin: tudo
        "system": ["*"],                 # System: todas as permissões
    }
    
    @classmethod
    def get_scopes_for_role(cls, role: str) -> List[str]:
        """Retorna scopes permitidos para uma role."""
        return cls.ROLES.get(role, [])


# ============================================================
# PASSWORD HASHING: passlib (padronizado)
# ============================================================

def get_password_hash(password: str) -> str:
    """Gera hash bcrypt da password usando passlib."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password contra hash bcrypt usando passlib."""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================
# JWT: Usar JWT_SECRET_KEY (não SECRET_KEY)
# ============================================================

def create_access_token(
    email: str,
    user_id: Optional[str] = None,
    role: str = "system",
    institution_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Gera JWT com claims: sub, email, id, role."""
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
    """Decodifica JWT. Raises 401 se inválido/expirado."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Token inválido: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================
# TOKEN VERIFICATION
# ============================================================

async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict:
    """Verifica Bearer token. Retorna anonymous se ALLOW_ANONYMOUS=true."""
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


# ============================================================
# RBAC: verify_role (USADO ATIVAMENTE NAS ROTAS)
# ============================================================

def verify_role(required_role: str) -> Callable:
    """RBAC: verifica role mínima. USADO ATIVAMENTE NAS ROTAS."""
    async def role_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and required_role != "citizen":
            raise HTTPException(status_code=401, detail="Autenticacao necessaria")
        if user["role"] not in [required_role, "admin"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return user
    return role_checker


# ============================================================
# SCOPES: verify_scopes (PREPARADO, NÃO ATIVO)
# 
# Para ativar no futuro, substituir nas rotas:
#   @router.post("/certify", dependencies=[Depends(verify_role("institution"))])
# por:
#   @router.post("/certify", dependencies=[Depends(verify_scopes(["emission"]))])
# ============================================================

def verify_scopes(required_scopes: List[str]) -> Callable:
    """
    Verifica scopes (permissões granulares).
    
    PREPARADO PARA USO FUTURO. 
    Não está ativo em nenhuma rota atual.
    
    Uso futuro:
        @router.post("/certify", dependencies=[Depends(verify_scopes(["emission"]))])
    
    Permite acesso anônimo apenas para scope "verify" (consulta pública).
    """
    async def scope_checker(user: Dict = Depends(verify_token)) -> Dict:
        # Se não autenticado, permite apenas scope "verify" (consulta pública)
        if not user["authenticated"] and any(s != "verify" for s in required_scopes):
            raise HTTPException(status_code=401, detail="Token ausente ou invalido")
        
        # Admin e system têm acesso a tudo
        if user["role"] in ["admin", "system"]:
            return user
        
        # Verifica scopes do usuário
        user_scopes = AuthConfig.get_scopes_for_role(user["role"])
        
        for scope in required_scopes:
            if scope == "verify":
                # "verify" é público — permite mesmo sem autenticação
                continue
            if scope not in user_scopes and "*" not in user_scopes:
                raise HTTPException(status_code=403, detail="Permissao insuficiente")
        
        return user
    return scope_checker


# ============================================================
# HELPERS
# ============================================================

def is_authenticated(user: Dict) -> bool:
    return user.get("authenticated", False)


def get_user_email(user: Dict) -> str:
    return user.get("email", "anonymous@txeka.co.mz")


def get_user_id(user: Dict) -> str:
    return user.get("id", "unknown")


def get_user_role(user: Dict) -> str:
    return user.get("role", "citizen")

