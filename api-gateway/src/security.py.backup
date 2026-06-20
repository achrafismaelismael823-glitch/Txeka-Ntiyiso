import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
JWT_EXPIRATION_HOURS = 24
ALLOW_ANONYMOUS = True

class AuthConfig:
    ALGORITHM = JWT_ALGORITHM
    SECRET_KEY = JWT_SECRET_KEY
    EXPIRATION_HOURS = JWT_EXPIRATION_HOURS

    ROLES = {
        "system": ["verify", "emit", "revoke"],
        "admin": ["verify", "emit", "revoke", "manage_institutions"],
        "institution": ["emit", "verify"],
        "citizen": ["verify"]  
    }

def create_access_token(email: str, role: str = "system", expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(hours=AuthConfig.EXPIRATION_HOURS)
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": email, "role": role, "exp": expire, "iat": datetime.now(timezone.utc), "type": "access"}
    return jwt.encode(payload, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)

def decode_token(token: str) -> Dict:
    try:
        return jwt.decode(token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict:
    if credentials is None:
        if ALLOW_ANONYMOUS:
            
            return {"email": "anonymous@txeka.co.mz", "role": "citizen", "authenticated": False}
        raise HTTPException(status_code=401, detail="Autenticação obrigatória")
    
    token = credentials.credentials
    payload = decode_token(token)
    return {"email": payload.get("sub"), "role": payload.get("role", "citizen"), "authenticated": True}

def verify_role(required_role: str) -> Callable:
    async def role_checker(user: Dict = Depends(verify_token)) -> Dict:
       
        if not user["authenticated"] and required_role != "citizen":
            raise HTTPException(status_code=401, detail="Autenticação necessária para esta operação")
            
        if user["role"] not in [required_role, "admin"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return user
    return role_checker

def verify_scopes(required_scopes: list[str]) -> Callable:
    async def scope_checker(user: Dict = Depends(verify_token)) -> Dict:
        
        if not user["authenticated"] and any(s != "verify" for s in required_scopes):
            raise HTTPException(status_code=401, detail="Token de segurança ausente ou inválido")
            
        user_scopes = AuthConfig.ROLES.get(user["role"], [])
        for scope in required_scopes:
            if scope not in user_scopes:
                raise HTTPException(status_code=403, detail="Permissão insuficiente")
        return user
    return scope_checker

def is_authenticated(user: Dict) -> bool:
    return user.get("authenticated", False)

def get_user_email(user: Dict) -> str:
    return user.get("email", "anonymous@txeka.co.mz")

def get_user_role(user: Dict) -> str:
    return user.get("role", "citizen")
