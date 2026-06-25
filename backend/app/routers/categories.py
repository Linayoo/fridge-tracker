from fastapi import APIRouter

from app.categories import CATEGORIES

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories():
    """Return the static list of item categories."""
    return CATEGORIES
