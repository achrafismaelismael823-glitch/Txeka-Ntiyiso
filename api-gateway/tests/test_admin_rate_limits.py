"""FASE 1.5 — Rate limiting administrativo."""

import os
import sys
from unittest.mock import AsyncMock, MagicMock

os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-long!!!")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-32-chars-long!!!")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/txeka_test")
os.environ.setdefault("ENVIRONMENT", "test")

sys.modules["src.services.institution_service"] = MagicMock()

from fastapi.testclient import TestClient

from src.core.rate_limiter import limiter
from src.database import get_db
from src.main import app
from src.security import verify_token


class FakeInstitution:
    def __init__(self):
        self.id = "INAGE"
        self.name = "INAGE"
        self.contact_email = "inage@example.com"
        self.role = "institution"
        self.subscription_plan = "free"
        self.credits = 10
        self.docs_emitted_month = 0
        self.status = "active"
        self.approved = True
        self.token_epoch = 1
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        self.created_at = now
        self.updated_at = now


async def _admin_user():
    return {
        "email": "admin@txeka.co.mz",
        "role": "admin",
        "id": "admin",
        "institution": None,
        "authenticated": True,
        "epoch": 1,
    }


async def _fake_db():
    yield MagicMock()


def _client():
    previous_enabled = limiter.enabled
    limiter.enabled = True
    limiter.reset()
    app.dependency_overrides[verify_token] = _admin_user
    app.dependency_overrides[get_db] = _fake_db
    return TestClient(app), previous_enabled


def _restore_limiter(previous_enabled):
    limiter.reset()
    limiter.enabled = previous_enabled
    app.dependency_overrides.pop(verify_token, None)
    app.dependency_overrides.pop(get_db, None)


def _assert_within_limit(client, method, path, json_body, allowed):
    from src.routes import institution_routes

    institution = FakeInstitution()
    institution_routes.InstitutionService.get_institution = AsyncMock(return_value=institution)
    institution_routes.InstitutionService.update_institution = AsyncMock(return_value=institution)
    institution_routes.InstitutionService.add_credits = AsyncMock(return_value=institution)
    institution_routes.InstitutionService.get_credit_history = AsyncMock(return_value=[])
    institution_routes.InstitutionService.reset_password = AsyncMock(
        return_value={"institution": institution, "temp_password": "TempPass1!"}
    )
    institution_routes.InstitutionService.regenerate_api_key = AsyncMock(return_value="txk_test_key")

    last_ok = None
    for i in range(allowed):
        if method == "GET":
            last_ok = client.get(path)
        elif method == "PATCH":
            last_ok = client.patch(path, json=json_body)
        else:
            last_ok = client.post(path, json=json_body)
        assert last_ok.status_code != 429, f"request {i + 1}/{allowed} got 429"
    assert last_ok.status_code != 429

    if method == "GET":
        blocked = client.get(path)
    elif method == "PATCH":
        blocked = client.patch(path, json=json_body)
    else:
        blocked = client.post(path, json=json_body)
    assert blocked.status_code == 429


def test_001_get_institution_30_then_429():
    client, previous_enabled = _client()
    try:
        _assert_within_limit(
            client,
            "GET",
            "/api/v1/institutions/INAGE",
            None,
            30,
        )
    finally:
        _restore_limiter(previous_enabled)


def test_002_patch_institution_15_then_429():
    client, previous_enabled = _client()
    try:
        _assert_within_limit(
            client,
            "PATCH",
            "/api/v1/institutions/INAGE",
            {"name": "INAGE"},
            15,
        )
    finally:
        _restore_limiter(previous_enabled)


def test_003_add_credits_10_then_429():
    client, previous_enabled = _client()
    try:
        _assert_within_limit(
            client,
            "POST",
            "/api/v1/institutions/INAGE/credits",
            {"amount": 1, "type": "manual_add"},
            10,
        )
    finally:
        _restore_limiter(previous_enabled)


def test_004_credit_history_30_then_429():
    client, previous_enabled = _client()
    try:
        _assert_within_limit(
            client,
            "GET",
            "/api/v1/institutions/INAGE/credit-history",
            None,
            30,
        )
    finally:
        _restore_limiter(previous_enabled)


def test_005_reset_password_5_then_429():
    client, previous_enabled = _client()
    try:
        _assert_within_limit(
            client,
            "POST",
            "/api/v1/institutions/INAGE/reset-password",
            None,
            5,
        )
    finally:
        _restore_limiter(previous_enabled)


def test_006_regenerate_api_key_5_then_429():
    client, previous_enabled = _client()
    try:
        _assert_within_limit(
            client,
            "POST",
            "/api/v1/institutions/INAGE/regenerate-api-key",
            None,
            5,
        )
    finally:
        _restore_limiter(previous_enabled)
