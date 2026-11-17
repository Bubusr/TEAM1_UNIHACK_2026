from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config import get_settings

settings = get_settings()
app = FastAPI(title="PawVerse API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
accepted_hashes: set[str] = set()
demo_user_id = UUID("00000000-0000-0000-0000-000000000001")
demo_pet = {
    "id": "pet-mochi",
    "owner_id": str(demo_user_id),
    "name": "Mochi",
    "species": "cat",
    "coat": "orange and white",
    "exp": 125,
    "exp_to_next": 200,
    "affection": 64,
    "last_checkin_at": datetime.now(timezone.utc),
    "shield_expires_at": None,
    "actions": {"feed": 0, "pet": 0, "play": 0},
    "image_uri": None,
    "kibble": 25,
    "crops": 0,
    "food": 0,
}
interaction_limits = {"feed": 3, "pet": 5, "play": 2}
interaction_rewards = {"feed": (5, 6), "pet": (3, 4), "play": (8, 8)}


class CaptureSubmit(BaseModel):
    user_id: UUID = Field(default=UUID("00000000-0000-0000-0000-000000000001"))
    image_uri: str = Field(min_length=1, max_length=2048)
    captured_at: datetime
    gps_lat: float | None = Field(default=None, ge=-90, le=90)
    gps_lng: float | None = Field(default=None, ge=-180, le=180)
    device_attestation: str = Field(default="local-demo", min_length=1, max_length=128)


def calculate_score() -> dict[str, int]:
    parts = {"sharpness_lighting": 32, "cuteness_action": 31, "theme_match": 22}
    parts["total"] = sum(parts.values())
    return parts


def outcome_for_score(total: int) -> str:
    if total < 50:
        return "rejected"
    if total < 70:
        return "exp"
    if total < 80:
        return "fragment"
    return "new_pet"


def fence_state(now: datetime) -> str:
    shield_expires_at = demo_pet["shield_expires_at"]
    if shield_expires_at and shield_expires_at > now:
        return "SHIELDED"
    if now - demo_pet["last_checkin_at"] >= timedelta(hours=24):
        return "VULNERABLE"
    return "SECURE"


def serialize_pet(now: datetime) -> dict:
    expires_at = demo_pet["shield_expires_at"] or demo_pet["last_checkin_at"] + timedelta(hours=24)
    remaining = max(0, int((expires_at - now).total_seconds()))
    return {
        "id": demo_pet["id"],
        "name": demo_pet["name"],
        "species": demo_pet["species"],
        "coat": demo_pet["coat"],
        "exp": demo_pet["exp"],
        "exp_to_next": demo_pet["exp_to_next"],
        "affection": demo_pet["affection"],
        "fence_state": fence_state(now),
        "last_checkin_at": demo_pet["last_checkin_at"].isoformat(),
        "fence_expires_at": expires_at.isoformat(),
        "fence_seconds_remaining": remaining,
        "actions_today": demo_pet["actions"],
        "action_limits": interaction_limits,
        "image_uri": demo_pet["image_uri"],
        "kibble": demo_pet["kibble"],
        "crops": demo_pet["crops"],
        "food": demo_pet["food"],
    }


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "local-request")
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


@app.get("/v1/session")
def session_placeholder() -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "error": {
                "code": "AUTH_NOT_CONFIGURED",
                "message": "Social login is not configured in this local slice.",
                "retryable": False,
                "request_id": "local-request",
            }
        },
    )


@app.post("/v1/captures/{capture_id}/submit")
def submit_capture(capture_id: UUID, payload: CaptureSubmit) -> dict:
    now = datetime.now(timezone.utc)
    captured_at = payload.captured_at
    if captured_at.tzinfo is None:
        captured_at = captured_at.replace(tzinfo=timezone.utc)
    if abs((now - captured_at).total_seconds()) > 300:
        raise HTTPException(status_code=422, detail="Capture timestamp is outside the five-minute demo window.")

    content_hash = sha256(payload.image_uri.encode("utf-8")).hexdigest()
    if content_hash in accepted_hashes:
        raise HTTPException(status_code=409, detail="This capture has already been submitted.")
    accepted_hashes.add(content_hash)

    score = calculate_score()
    outcome = outcome_for_score(score["total"])
    if outcome == "new_pet":
        demo_pet["last_checkin_at"] = now
        demo_pet["actions"] = {"feed": 0, "pet": 0, "play": 0}
        demo_pet["image_uri"] = payload.image_uri
    response = {
        "capture_id": str(capture_id),
        "judgment": {
            "model": "stub-judge-v1",
            "is_live_capture": True,
            "contains_person_face": False,
            "subject": {"kind": "animal", "species": "cat", "breed": "Domestic Shorthair", "coat": "orange and white"},
            "score": score,
            "outcome": outcome,
        },
        "result": {
            "exp_gained": 25 if outcome in {"exp", "fragment", "new_pet"} else 0,
            "item_fragment": "toy_fragment" if outcome == "fragment" else None,
            "pet": {
                "id": str(uuid4()),
                "name": "Mochi",
                "species": "cat",
                "status": "pending_mint",
                "image_uri": payload.image_uri,
            }
            if outcome == "new_pet"
            else None,
        },
    }
    return response


@app.get("/v1/garden")
def garden() -> dict:
    now = datetime.now(timezone.utc)
    state = serialize_pet(now)
    notifications = []
    if state["fence_state"] == "VULNERABLE":
        notifications.append({"type": "fence_vulnerable", "message": "Mochi's fence needs a fresh check-in."})
    elif state["fence_seconds_remaining"] <= 4 * 3600:
        notifications.append({"type": "fence_expiring", "message": "Mochi's fence expires soon."})
    return {"server_time": now.isoformat(), "streak_days": 1, "pet": state, "notifications": notifications}


@app.post("/v1/pets/{pet_id}/interactions/{action}")
def interact(pet_id: str, action: str) -> dict:
    if pet_id != demo_pet["id"] or action not in interaction_limits:
        raise HTTPException(status_code=404, detail="Pet or interaction not found.")
    if demo_pet["actions"][action] >= interaction_limits[action]:
        raise HTTPException(status_code=409, detail=f"Daily {action} cap reached.")
    demo_pet["actions"][action] += 1
    exp, affection = interaction_rewards[action]
    demo_pet["exp"] += exp
    demo_pet["affection"] = min(100, demo_pet["affection"] + affection)
    kibble = 2 if action == "pet" else 4
    demo_pet["kibble"] += kibble
    return {"action": action, "exp_gained": exp, "affection_gained": affection, "kibble_gained": kibble, "pet": serialize_pet(datetime.now(timezone.utc))}


@app.post("/v1/pets/{pet_id}/drink")
def drink(pet_id: str) -> dict:
    if pet_id != demo_pet["id"]:
        raise HTTPException(status_code=404, detail="Pet not found.")
    demo_pet["affection"] = min(100, demo_pet["affection"] + 2)
    return {"message": "Mochi had a refreshing drink.", "pet": serialize_pet(datetime.now(timezone.utc))}


@app.post("/v1/garden/purchase")
def purchase(item: str) -> dict:
    prices = {"crop": 5, "food": 8}
    if item not in prices:
        raise HTTPException(status_code=400, detail="Unknown garden item.")
    if demo_pet["kibble"] < prices[item]:
        raise HTTPException(status_code=409, detail="Not enough Kibble.")
    demo_pet["kibble"] -= prices[item]
    demo_pet["crops" if item == "crop" else "food"] += 1
    return {"item": item, "price": prices[item], "pet": serialize_pet(datetime.now(timezone.utc))}


@app.post("/v1/garden/grow")
def grow_crop() -> dict:
    if demo_pet["crops"] < 1:
        raise HTTPException(status_code=409, detail="Buy a crop seed before growing food.")
    demo_pet["crops"] -= 1
    demo_pet["food"] += 1
    return {"message": "Your crop grew into food.", "pet": serialize_pet(datetime.now(timezone.utc))}
