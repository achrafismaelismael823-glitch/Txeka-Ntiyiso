"""FASE 1.4 — Audit LOGIN."""

import asyncio
import inspect
import json
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-long!!!")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-32-chars-long!!!")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/txeka_test")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("ADMIN_EMAIL", "admin@txeka.co.mz")

sys.modules["src.services.institution_service"] = MagicMock()

import pytest
from fastapi import HTTPException
from pydantic import SecretStr
from starlette.requests import Request

from src.core.password import get_password_hash
from src.core.rate_limiter import limiter
from src.models.schemas import AdminLoginRequest, InstitutionLoginRequest
from src.routes import auth_routes
from src.settings import settings

limiter.enabled = False

ADMIN_PASSWORD = "AdminTestPass1"
ADMIN_PASSWORD_HASH = get_password_hash(ADMIN_PASSWORD)
INSTITUTION_PASSWORD = "InstTestPass1"

FORBIDDEN_DETAIL_KEYS = {
    "password",
    "password_hash",
    "jwt",
    "access_token",
    "refresh_token",
    "authorization",
    "api_key",
    "api_key_hash",
    "secret",
    "secrets",
    "token_epoch",
    "ADMIN_PASSWORD_HASH",
    "token",
}


class FakeInstitution:
    def __init__(self):
        self.id = "INAGE"
        self.contact_email = "inage@example.com"
        self.name = "INAGE"
        self.status = "active"
        self.approved = True
        self.token_epoch = 1


def _request(path: str) -> Request:
    return Request({
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [(b"user-agent", b"pytest-agent"), (b"host", b"testserver")],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    })


def _flatten(value):
    if value is None:
        return []
    if isinstance(value, (str, int, float, bool)):
        return [value]
    if isinstance(value, dict):
        items = []
        for key, item in value.items():
            items.append(key)
            items.extend(_flatten(item))
        return items
    if isinstance(value, (list, tuple, set)):
        items = []
        for item in value:
            items.extend(_flatten(item))
        return items
    return [str(value)]


def assert_audit_safe(kwargs, secret_values):
    details = kwargs.get("details") or {}
    assert isinstance(details, dict)
    for key in details:
        assert key not in FORBIDDEN_DETAIL_KEYS
    blob = json.dumps(kwargs, default=str)
    for secret in secret_values:
        assert secret not in blob
    joined = " ".join(str(item) for item in _flatten(kwargs))
    for secret in secret_values:
        assert secret not in joined


def assert_single_login(mock_log_login):
    assert mock_log_login.await_count == 1
    kwargs = mock_log_login.await_args.kwargs
    assert kwargs["resource_type"] in ("INSTITUTION", "ADMIN")
    return kwargs


@pytest.fixture
def log_login_mock():
    mock = AsyncMock()
    original = auth_routes.AuditService.log_login
    auth_routes.AuditService.log_login = mock
    yield mock
    auth_routes.AuditService.log_login = original


@pytest.fixture(autouse=True)
def configure_admin_settings():
    settings.ADMIN_EMAIL = "admin@txeka.co.mz"
    settings.ADMIN_PASSWORD_HASH = SecretStr(ADMIN_PASSWORD_HASH)


def test_t1_institutional_login_success(log_login_mock):
    institution = FakeInstitution()
    data = InstitutionLoginRequest(institution_id="INAGE", password=INSTITUTION_PASSWORD)
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=institution),
        ):
            return await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    result = asyncio.run(run())
    assert "access_token" in result
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is True
    assert kwargs["status_code"] == 200
    assert kwargs["resource_type"] == "INSTITUTION"
    assert kwargs["resource_id"] == "INAGE"
    assert kwargs["institution_id"] == "INAGE"
    assert kwargs["user_email"] == "inage@example.com"
    assert kwargs["details"] == {"actor_type": "institution"}
    assert_audit_safe(kwargs, [INSTITUTION_PASSWORD, result["access_token"]])


def test_t2_institutional_wrong_password(log_login_mock):
    data = InstitutionLoginRequest(institution_id="INAGE", password="wrong-password")
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=None),
        ):
            await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Credenciais inválidas"
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is False
    assert kwargs["status_code"] == 401
    assert kwargs["resource_type"] == "INSTITUTION"
    assert kwargs["user_email"] == "unknown"
    assert_audit_safe(kwargs, ["wrong-password"])


def test_t3_institutional_unknown_institution(log_login_mock):
    data = InstitutionLoginRequest(institution_id="UNKNOWNORG", password=INSTITUTION_PASSWORD)
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=None),
        ):
            await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is False
    assert kwargs["resource_id"] == "UNKNOWNORG"
    assert kwargs["user_email"] == "unknown"
    assert_audit_safe(kwargs, [INSTITUTION_PASSWORD])


def test_t4_institutional_inactive(log_login_mock):
    data = InstitutionLoginRequest(institution_id="INACTIVE1", password=INSTITUTION_PASSWORD)
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=None),
        ):
            await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Credenciais inválidas"
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is False
    assert kwargs["status_code"] == 401
    assert kwargs["details"] == {"actor_type": "institution"}
    assert_audit_safe(kwargs, [INSTITUTION_PASSWORD])


def test_t5_institutional_unapproved(log_login_mock):
    data = InstitutionLoginRequest(institution_id="PENDING1", password=INSTITUTION_PASSWORD)
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=None),
        ):
            await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Credenciais inválidas"
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is False
    assert kwargs["details"] == {"actor_type": "institution"}
    assert_audit_safe(kwargs, [INSTITUTION_PASSWORD])


def test_t6_admin_login_success(log_login_mock):
    data = AdminLoginRequest(email="admin@txeka.co.mz", password=ADMIN_PASSWORD)

    async def run():
        return await auth_routes.login_admin(
            data=data,
            request=_request("/api/v1/auth/admin/login"),
        )

    result = asyncio.run(run())
    assert result["role"] == "admin"
    assert "access_token" in result
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is True
    assert kwargs["status_code"] == 200
    assert kwargs["resource_type"] == "ADMIN"
    assert kwargs["resource_id"] == "admin"
    assert kwargs["user_email"] == "admin@txeka.co.mz"
    assert kwargs["details"] == {"actor_type": "admin"}
    assert_audit_safe(
        kwargs,
        [ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, result["access_token"]],
    )


def test_t7_admin_invalid_email(log_login_mock):
    data = AdminLoginRequest(email="other@example.com", password=ADMIN_PASSWORD)

    async def run():
        await auth_routes.login_admin(
            data=data,
            request=_request("/api/v1/auth/admin/login"),
        )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Credenciais invalidas"
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is False
    assert kwargs["status_code"] == 401
    assert kwargs["resource_type"] == "ADMIN"
    assert kwargs["user_email"] == "other@example.com"
    assert kwargs["details"] == {"reason": "email"}
    assert_audit_safe(kwargs, [ADMIN_PASSWORD, ADMIN_PASSWORD_HASH])


def test_t8_admin_invalid_password(log_login_mock):
    data = AdminLoginRequest(email="admin@txeka.co.mz", password="bad-admin-pass")

    async def run():
        await auth_routes.login_admin(
            data=data,
            request=_request("/api/v1/auth/admin/login"),
        )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401
    assert exc.value.detail == "Credenciais invalidas"
    kwargs = assert_single_login(log_login_mock)
    assert kwargs["success"] is False
    assert kwargs["status_code"] == 401
    assert kwargs["resource_type"] == "ADMIN"
    assert kwargs["details"] == {"reason": "password"}
    assert_audit_safe(kwargs, ["bad-admin-pass", ADMIN_PASSWORD, ADMIN_PASSWORD_HASH])


def test_audit_payload_has_no_secrets_or_tokens(log_login_mock):
    institution = FakeInstitution()
    data = InstitutionLoginRequest(institution_id="INAGE", password=INSTITUTION_PASSWORD)
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=institution),
        ):
            return await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    result = asyncio.run(run())
    kwargs = assert_single_login(log_login_mock)
    assert_audit_safe(
        kwargs,
        [
            INSTITUTION_PASSWORD,
            result["access_token"],
            ADMIN_PASSWORD_HASH,
            "Bearer",
            "token_epoch",
        ],
    )
    assert "password" not in kwargs
    assert kwargs.get("details") == {"actor_type": "institution"}


def test_one_login_event_per_attempt(log_login_mock):
    data = InstitutionLoginRequest(institution_id="INAGE", password="x")
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=None),
        ):
            await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    with pytest.raises(HTTPException):
        asyncio.run(run())
    assert log_login_mock.await_count == 1


def test_audit_failure_does_not_break_institutional_success(log_login_mock):
    log_login_mock.side_effect = RuntimeError("audit down")
    institution = FakeInstitution()
    data = InstitutionLoginRequest(institution_id="INAGE", password=INSTITUTION_PASSWORD)
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=institution),
        ):
            return await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    result = asyncio.run(run())
    assert "access_token" in result


def test_audit_failure_does_not_break_institutional_failure(log_login_mock):
    log_login_mock.side_effect = RuntimeError("audit down")
    data = InstitutionLoginRequest(institution_id="INAGE", password="x")
    db = MagicMock()

    async def run():
        with patch.object(
            auth_routes.InstitutionService,
            "authenticate_institution",
            new=AsyncMock(return_value=None),
        ):
            await auth_routes.login_institution(
                request=_request("/api/v1/auth/login"),
                data=data,
                db=db,
            )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401


def test_audit_failure_does_not_break_admin_success(log_login_mock):
    log_login_mock.side_effect = RuntimeError("audit down")
    data = AdminLoginRequest(email="admin@txeka.co.mz", password=ADMIN_PASSWORD)

    async def run():
        return await auth_routes.login_admin(
            data=data,
            request=_request("/api/v1/auth/admin/login"),
        )

    result = asyncio.run(run())
    assert result["role"] == "admin"
    assert "access_token" in result


def test_audit_failure_does_not_break_admin_failure(log_login_mock):
    log_login_mock.side_effect = RuntimeError("audit down")
    data = AdminLoginRequest(email="other@example.com", password=ADMIN_PASSWORD)

    async def run():
        await auth_routes.login_admin(
            data=data,
            request=_request("/api/v1/auth/admin/login"),
        )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 401


def test_admin_login_independent_from_postgres(log_login_mock):
    source = inspect.getsource(auth_routes.login_admin)
    assert "Depends(get_db)" not in source
    signature = inspect.signature(auth_routes.login_admin)
    assert "db" not in signature.parameters

    data = AdminLoginRequest(email="admin@txeka.co.mz", password=ADMIN_PASSWORD)

    async def run():
        with patch("src.database.AsyncSessionLocal", None):
            return await auth_routes.login_admin(
                data=data,
                request=_request("/api/v1/auth/admin/login"),
            )

    result = asyncio.run(run())
    assert result["role"] == "admin"
    assert "access_token" in result
    assert log_login_mock.await_count == 0
