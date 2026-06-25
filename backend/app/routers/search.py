import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Item
from app.schemas import ItemSearchResult

logger = logging.getLogger(__name__)

# Separate router (not /items prefix) to avoid ambiguity with GET /items/{item_id}.
# See docs/API.md for rationale.
router = APIRouter(prefix="/search", tags=["search"])


@router.get("/items", response_model=list[ItemSearchResult])
def search_items(
    q: str = Query(min_length=1),
    db: Session = Depends(get_db),
):
    """Case-insensitive search across all item names. Returns items with their shelf name."""
    items = (
        db.execute(
            select(Item)
            .options(joinedload(Item.shelf))
            .where(Item.name.ilike(f"%{q}%"))
            .order_by(Item.name)
        )
        .scalars()
        .all()
    )

    return [
        ItemSearchResult(
            id=item.id,
            shelf_id=item.shelf_id,
            shelf_name=item.shelf.name,
            name=item.name,
            category=item.category,
            expires_at=item.expires_at,
        )
        for item in items
    ]
