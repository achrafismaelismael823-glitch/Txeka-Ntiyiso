"""
Txeka Ntiyiso - Security Module
Módulo de segurança enterprise-grade para autenticação e autorização JWT.

   Contexto:
    Sistema nacional de certificação digital de Moçambique.
    Tokens JWT seguem RFC 7519 com claims customizadas para o ecossistema INAGE.

  Responsabilidades:
    - Geração de access tokens com claims padronizadas
    - Decodificação e validação de tokens
    - Verificação de roles e scopes (RBAC)
"""

import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Callable

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY or JWT_SECRET_KEY == "dev-secret-key":
    logger.warning("JWT_SECRET_KEY not configured or insecure. Using fallback.")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "txeka-fallback-secret-key-change-immediately")

JWT_EXPIRATION_HOURS = 24
ALLOW_ANONYMOUS = os.getenv("TXEKA_ALLOW_ANONYMOUS", "false").lower() == "true"


class AuthConfig:
    """Configurações centralizadas de autenticação."""
    ALGORITHM = JWT_ALGORITHM
    SECRET_KEY = JWT_SECRET_KEY
    EXPIRATION_HOURS = JWT_EXPIRATION_HOURS

    # Roles do ecossistema Txeka Ntiyiso
    ROLES = {
        "system": ["verify", "emit", "revoke"],
        "admin": ["verify", "emit", "revoke", "manage_institutions"],
        "institution": ["emit", "verify"],
        "citizen": ["verify"]
    }


def create_access_token(
    email: str,
    user_id: Optional[str] = None,
    role: str = "system",
    institution_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Gera um access token JWT com claims padronizadas.
    
      Claims do token:
        - sub: Email do utilizador (padrão OpenID)
        - email: Email duplicado para compatibilidade direta
        - id: UUID único do utilizador (para audit logs)
        - role: Papel no sistema (admin, institution, citizen, system)
        - institution: ID da instituição (quando aplicável)
        - exp: Timestamp de expiração
        - iat: Timestamp de emissão
        - type: Tipo do token (access)
    
    Args:
        email: Email do utilizador (usado como subject)
        user_id: UUID único do utilizador na base de dados
        role: Papel/função do utilizador
        institution_id: ID da instituição (INAGE, etc.)
        expires_delta: Tempo até expiração (padrão: 24h)
    
    Returns:
        String do token JWT assinado com HS256
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=AuthConfig.EXPIRATION_HOURS)
    
    expire = datetime.now(timezone.utc) + expires_delta
    now = datetime.now(timezone.utc)
    
    # Gera UUID se não fornecido (fallback para compatibilidade)
    token_id = user_id or str(uuid.uuid4())
    
    payload = {
        "sub": email,                    # Padrão JWT (subject)
        "email": email,                  # Claim explícita para fácil acesso
        "id": token_id,                  # UUID para rastreabilidade em audit logs
        "role": role,                    # RBAC role
        "institution": institution_id,   # Instituição vinculada
        "exp": expire,                   # Expiração
        "iat": now,                      # Emitido em
        "type": "access"                 # Tipo do token
    }
    
    return jwt.encode(payload, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)


def decode_token(token: str) -> Dict:
    """
    Decodifica e valida um token JWT.
    
    Args:
        token: String do token JWT
    
    Returns:
        Dict com as claims decodificadas
    
    Raises:
        HTTPException 401: Token expirado ou inválido
    """
    try:
        return jwt.decode(token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    """
    Verifica o token Bearer do header Authorization.
    
      Comportamento:
        - Com token válido: retorna claims do utilizador
        - Sem token + ALLOW_ANONYMOUS: retorna utilizador anónimo
        - Sem token + !ALLOW_ANONYMOUS: erro 401
    
    Args:
        credentials: Credenciais extraídas do header Authorization
    
    Returns:
        Dict com email, role, id, institution, authenticated
    
    Raises:
        HTTPException 401: Autenticação obrigatória e token ausente/inválido
    """
    try:
        if credentials is None:
            if ALLOW_ANONYMOUS:
                # Acesso público — utilizador anónimo (cidadão)
                return {
                    "email": "anonymous@txeka.co.mz",
                    "role": "citizen",
                    "id": "anonymous",
                    "institution": None,
                    "authenticated": False
                }
            raise HTTPException(status_code=401, detail="Autenticacao obrigatoria")

        token = credentials.credentials
        payload = decode_token(token)
        
        # Extrai claims com fallbacks para compatibilidade legada
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
    """
    Factory de dependência para verificação de role (RBAC).
    
    Args:
        required_role: Role mínima necessária para acessar o endpoint
    
    Returns:
        Callable que pode ser usado com Depends()
    """
    async def role_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and required_role != "citizen":
            raise HTTPException(status_code=401, detail="Autenticacao necessaria para esta operacao")
        if user["role"] not in [required_role, "admin"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return user
    return role_checker


def verify_scopes(required_scopes: list[str]) -> Callable:
    """
    Factory de dependência para verificação de scopes (permissões granulares).
    
    Args:
        required_scopes: Lista de scopes necessários
    
    Returns:
        Callable que pode ser usado com Depends()
    """
    async def scope_checker(user: Dict = Depends(verify_token)) -> Dict:
        if not user["authenticated"] and any(s != "verify" for s in required_scopes):
            raise HTTPException(status_code=401, detail="Token de seguranca ausente ou invalido")
        user_scopes = AuthConfig.ROLES.get(user["role"], [])
        for scope in required_scopes:
            if scope not in user_scopes:
                raise HTTPException(status_code=403, detail="Permissao insuficiente")
        return user
    return scope_checker


def is_authenticated(user: Dict) -> bool:
    """Verifica se o utilizador está autenticado."""
    return user.get("authenticated", False)


def get_user_email(user: Dict) -> str:
    """Extrai o email do utilizador do dict de claims."""
    return user.get("email", "anonymous@txeka.co.mz")


def get_user_id(user: Dict) -> str:
    """Extrai o ID único do utilizador do dict de claims."""
    return user.get("id", "unknown")


def get_user_role(user: Dict) -> str:
    """Extrai o role do utilizador do dict de claims."""
    return user.get("role", "citizen")

