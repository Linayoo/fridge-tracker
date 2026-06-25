import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Item, Shelf
from app.schemas import ItemCreate, ItemOut, ItemUpdate, ReorderRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["items"])


@router.post(
    "/shelves/{shelf_id}/items",
    response_model=ItemOut,
    status_code=status.HTTP_201_CREATED,
)
def create_item(shelf_id: int, data: ItemCreate, db: Session = Depends(get_db)):
    """Add an item to a shelf. Position defaults to max+1 within the shelf if not provided."""
    shelf = db.get(Shelf, shelf_id)
    if shelf is None:
        raise HTTPException(status_code=404, detail="Shelf not found")

    if data.position is None:
        max_pos = db.execute(
            select(func.max(Item.position)).where(Item.shelf_id == shelf_id)
        ).scalar()
        position = 0 if max_pos is None else max_pos + 1
    else:
        position = data.position

    item = Item(
        shelf_id=shelf_id,
        name=data.name,
        quantity=data.quantity,
        unit=data.unit,
        category=data.category,
        expires_at=data.expires_at,
        position=position,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    logger.info("Created item id=%d name=%r on shelf id=%d", item.id, item.name, shelf_id)
    return item


@router.post("/shelves/{shelf_id}/items/reorder", response_model=list[ItemOut])
def reorder_items(shelf_id: int, data: ReorderRequest, db: Session = Depends(get_db)):
    """Bulk reorder items within a shelf."""
    shelf = db.get(Shelf, shelf_id)
    if shelf is None:
        raise HTTPException(status_code=404, detail="Shelf not found")

    ids = [entry.id for entry in data.order]
    items = (
        db.execute(select(Item).where(Item.id.in_(ids), Item.shelf_id == shelf_id)).scalars().all()
    )

    if len(items) != len(ids):
        raise HTTPException(status_code=404, detail="One or more item IDs not found in this shelf")

    item_map = {i.id: i for i in items}
    for entry in data.order:
        item_map[entry.id].position = entry.position

    db.commit()
    return (
        db.execute(select(Item).where(Item.shelf_id == shelf_id).order_by(Item.position))
        .scalars()
        .all()
    )


@router.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get a single item by ID."""
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, data: ItemUpdate, db: Session = Depends(get_db)):
    """Edit an item. Only provided fields are updated. Send shelf_id to move between shelves."""
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    # model_dump(exclude_unset=True) distinguishes "not provided" from explicit null,
    # which matters for expires_at: {"expires_at": null} clears the expiration date.
    update_data = data.model_dump(exclude_unset=True)

    if "shelf_id" in update_data:
        new_shelf_id = update_data.pop("shelf_id")
        shelf = db.get(Shelf, new_shelf_id)
        if shelf is None:
            raise HTTPException(status_code=404, detail="Shelf not found")
        item.shelf_id = new_shelf_id

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Delete an item."""
    item = db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    logger.info("Deleted item id=%d", item_id)
