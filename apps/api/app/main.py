from datetime import datetime, timezone
from hashlib import sha256
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config import get_settings

settings = get_settings()
app = FastAPI(title="PawVerse API", version="0.1.0")
accepted_hashes: set[str] = set()


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
            }
            if outcome == "new_pet"
            else None,
        },
    }
    return response
