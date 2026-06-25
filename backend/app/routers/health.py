from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/healthz")
def health_check():
    """Health check used by AWS App Runner."""
    return {"status": "ok"}
