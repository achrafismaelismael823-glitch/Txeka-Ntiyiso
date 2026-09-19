"""FASE 1.2 — CORS Restrict."""

import os
import sys
from unittest.mock import MagicMock

os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-long!!!")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-32-chars-long!!!")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/txeka_test")
os.environ.setdefault("ENVIRONMENT", "test")

sys.modules["src.services.institution_service"] = MagicMock()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

from src.main import (
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    parse_allowed_origins,
    resolve_cors_origins,
)

PORTAL = "https://txeka-ntiyiso-portal.onrender.com"
PORTAL_STAGING = "https://txeka-ntiyiso-portal-staging.onrender.com"
LOCAL_3000 = "http://localhost:3000"
LOCAL_5173 = "http://localhost:5173"
ARBITRARY = "https://evil.example.com"


def make_client(origins):
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=CORS_ALLOW_METHODS,
        allow_headers=CORS_ALLOW_HEADERS,
    )

    @app.get("/health")
    def health():
        return {"status": "online"}

    @app.post("/api/v1/auth/login")
    def login():
        return {"ok": True}

    return TestClient(app)


def cors_origin(response):
    return response.headers.get("access-control-allow-origin")


class TestParseAllowedOrigins:
    def test_json_list(self):
        origins, error = parse_allowed_origins('["https://txeka-ntiyiso-portal.onrender.com"]')
        assert error is None
        assert origins == [PORTAL]

    def test_python_list_single_quotes(self):
        origins, error = parse_allowed_origins("['https://txeka-ntiyiso-portal.onrender.com']")
        assert error is None
        assert origins == [PORTAL]

    def test_csv(self):
        origins, error = parse_allowed_origins(f"{LOCAL_3000},{LOCAL_5173}")
        assert error is None
        assert origins == [LOCAL_3000, LOCAL_5173]

    def test_absent(self):
        origins, error = parse_allowed_origins(None)
        assert origins is None
        assert error == "absent"

    def test_empty(self):
        origins, error = parse_allowed_origins("   ")
        assert origins == []
        assert error == "empty"

    def test_wildcard_rejected(self):
        origins, error = parse_allowed_origins('["*"]')
        assert origins == []
        assert error == "wildcard"

    def test_malformed_rejected(self):
        origins, error = parse_allowed_origins("[not-json")
        assert origins == []
        assert error == "malformed"


class TestResolveCorsOrigins:
    def test_production_uses_env(self):
        origins = resolve_cors_origins(
            environment="production",
            raw='["https://txeka-ntiyiso-portal.onrender.com"]',
        )
        assert origins == [PORTAL]
        assert PORTAL_STAGING not in origins
        assert LOCAL_3000 not in origins

    def test_production_absent_fail_closed(self):
        assert resolve_cors_origins(environment="production", raw=None) == []

    def test_production_empty_fail_closed(self):
        assert resolve_cors_origins(environment="production", raw="") == []

    def test_production_wildcard_fail_closed(self):
        assert resolve_cors_origins(environment="production", raw="*") == []

    def test_non_production_absent_localhost_only(self, monkeypatch):
        monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
        origins = resolve_cors_origins(environment="development")
        assert origins == [LOCAL_3000, LOCAL_5173]

    def test_non_production_explicit_env(self):
        origins = resolve_cors_origins(
            environment="development",
            raw=f"{LOCAL_3000},{LOCAL_5173}",
        )
        assert origins == [LOCAL_3000, LOCAL_5173]
        assert PORTAL_STAGING not in origins


class TestProductionCorsHttp:
    def setup_method(self):
        self.client = make_client([PORTAL])

    def test_portal_allowed(self):
        response = self.client.get("/health", headers={"Origin": PORTAL})
        assert response.status_code == 200
        assert cors_origin(response) == PORTAL

    def test_portal_staging_rejected(self):
        response = self.client.get("/health", headers={"Origin": PORTAL_STAGING})
        assert response.status_code == 200
        assert cors_origin(response) != PORTAL_STAGING

    def test_localhost_3000_rejected(self):
        response = self.client.get("/health", headers={"Origin": LOCAL_3000})
        assert response.status_code == 200
        assert cors_origin(response) != LOCAL_3000

    def test_localhost_5173_rejected(self):
        response = self.client.get("/health", headers={"Origin": LOCAL_5173})
        assert response.status_code == 200
        assert cors_origin(response) != LOCAL_5173

    def test_arbitrary_rejected(self):
        response = self.client.get("/health", headers={"Origin": ARBITRARY})
        assert response.status_code == 200
        assert cors_origin(response) != ARBITRARY


class TestNonProductionCorsHttp:
    def setup_method(self):
        self.client = make_client([LOCAL_3000, LOCAL_5173])

    def test_localhost_3000_allowed(self):
        response = self.client.get("/health", headers={"Origin": LOCAL_3000})
        assert response.status_code == 200
        assert cors_origin(response) == LOCAL_3000

    def test_localhost_5173_allowed(self):
        response = self.client.get("/health", headers={"Origin": LOCAL_5173})
        assert response.status_code == 200
        assert cors_origin(response) == LOCAL_5173

    def test_arbitrary_rejected(self):
        response = self.client.get("/health", headers={"Origin": ARBITRARY})
        assert response.status_code == 200
        assert cors_origin(response) != ARBITRARY

    def test_portal_staging_not_automatic(self):
        response = self.client.get("/health", headers={"Origin": PORTAL_STAGING})
        assert cors_origin(response) != PORTAL_STAGING


class TestPreflight:
    def setup_method(self):
        self.client = make_client([PORTAL])

    def test_preflight_allowed_origin(self):
        response = self.client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": PORTAL,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization,Content-Type,X-API-Key,Accept",
            },
        )
        assert response.status_code in (200, 204)
        assert cors_origin(response) == PORTAL
        allow_headers = response.headers.get("access-control-allow-headers", "").lower()
        for header in ("authorization", "content-type", "x-api-key", "accept"):
            assert header in allow_headers
        allow_methods = response.headers.get("access-control-allow-methods", "").upper()
        for method in ("GET", "POST", "PATCH"):
            assert method in allow_methods

    def test_preflight_rejected_origin(self):
        response = self.client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": PORTAL_STAGING,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization",
            },
        )
        assert cors_origin(response) != PORTAL_STAGING


def test_cors_policy_constants_preserved():
    assert CORS_ALLOW_METHODS == ["GET", "POST", "OPTIONS", "PATCH"]
    assert CORS_ALLOW_HEADERS == ["Authorization", "Content-Type", "X-API-Key", "Accept"]
