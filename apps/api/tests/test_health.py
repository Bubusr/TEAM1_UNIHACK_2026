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


def test_garden_exposes_server_fence_and_interaction_caps() -> None:
    response = TestClient(app).get("/v1/garden")
    assert response.status_code == 200
    body = response.json()
    assert body["pet"]["fence_state"] == "SECURE"
    assert body["pet"]["action_limits"] == {"feed": 3, "pet": 5, "play": 2}


def test_interaction_updates_exp_and_enforces_daily_cap() -> None:
    client = TestClient(app)
    first = client.post("/v1/pets/pet-mochi/interactions/feed")
    assert first.status_code == 200
    assert first.json()["exp_gained"] == 5
    for _ in range(2):
        assert client.post("/v1/pets/pet-mochi/interactions/feed").status_code == 200
    assert client.post("/v1/pets/pet-mochi/interactions/feed").status_code == 409


def test_interaction_rewards_kibble_and_garden_purchase() -> None:
    client = TestClient(app)
    response = client.post("/v1/pets/pet-mochi/interactions/play")
    assert response.status_code == 200
    assert response.json()["kibble_gained"] == 4
    purchase = client.post("/v1/garden/purchase", params={"item": "crop"})
    assert purchase.status_code == 200
    assert purchase.json()["item"] == "crop"


def test_pet_can_drink_at_lake() -> None:
    response = TestClient(app).post("/v1/pets/pet-mochi/drink")
    assert response.status_code == 200
    assert "refreshing drink" in response.json()["message"]


def test_crop_can_grow_into_food() -> None:
    client = TestClient(app)
    client.post("/v1/garden/purchase", params={"item": "crop"})
    response = client.post("/v1/garden/grow")
    assert response.status_code == 200
    assert "grew into food" in response.json()["message"]
