from fastapi.testclient import TestClient
from datetime import datetime, timezone
from uuid import uuid4

from app.main import app


def test_health() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_unconfigured_session_is_explicit() -> None:
    response = TestClient(app).get("/v1/session")
    assert response.status_code == 501
    assert response.json()["error"]["code"] == "AUTH_NOT_CONFIGURED"


def test_capture_returns_backend_calculated_score_and_new_pet() -> None:
    capture_id = uuid4()
    response = TestClient(app).post(
        f"/v1/captures/{capture_id}/submit",
        json={
            "image_uri": "camera://unique-capture",
            "captured_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["judgment"]["score"]["total"] == 85
    assert body["judgment"]["outcome"] == "new_pet"
    assert body["result"]["pet"]["status"] == "pending_mint"


def test_capture_rejects_duplicate_image() -> None:
    payload = {
        "image_uri": "camera://duplicate-capture",
        "captured_at": datetime.now(timezone.utc).isoformat(),
    }
    client = TestClient(app)
    assert client.post(f"/v1/captures/{uuid4()}/submit", json=payload).status_code == 200
    assert client.post(f"/v1/captures/{uuid4()}/submit", json=payload).status_code == 409
