from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_unconfigured_session_is_explicit() -> None:
    response = TestClient(app).get("/v1/session")
    assert response.status_code == 501
    assert response.json()["error"]["code"] == "AUTH_NOT_CONFIGURED"

