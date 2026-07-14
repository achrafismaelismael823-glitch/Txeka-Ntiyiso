import sys
from unittest.mock import MagicMock
sys.modules['src.database'] = MagicMock()
sys.modules['src.services.emission_service'] = MagicMock()
sys.modules['src.services.institution_service'] = MagicMock()
sys.modules['src.services.verification_service'] = MagicMock()
sys.modules['src.services.audit_service'] = MagicMock()

from fastapi.testclient import TestClient
from src.main import app

def test_health_check():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
