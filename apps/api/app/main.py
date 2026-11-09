from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .config import get_settings

settings = get_settings()
app = FastAPI(title="PawVerse API", version="0.1.0")


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

