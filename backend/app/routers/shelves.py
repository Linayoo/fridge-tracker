import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Shelf
from app.schemas import ReorderRequest, ShelfCreate, ShelfOut, ShelfUpdate, ShelfWithItems

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/shelves", tags=["shelves"])


@router.get("", response_model=list[ShelfWithItems])
def list_shelves(db: Session = Depends(get_db)):
    """List all shelves ordered by position, with inline item summaries."""
    return (
        db.execute(select(Shelf).options(selectinload(Shelf.items)).order_by(Shelf.position))
        .scalars()
        .all()
    )


@router.post("", response_model=ShelfOut, status_code=status.HTTP_201_CREATED)
def create_shelf(data: ShelfCreate, db: Session = Depends(get_db)):
    """Create a shelf. Position defaults to max+1 across all shelves if not provided."""
    if data.position is None:
        max_pos = db.execute(select(func.max(Shelf.position))).scalar()
        position = 0 if max_pos is None else max_pos + 1
    else:
        position = data.position

    shelf = Shelf(name=data.name, position=position)
    db.add(shelf)
    db.commit()
    db.refresh(shelf)
    logger.info("Created shelf id=%d name=%r", shelf.id, shelf.name)
    return shelf


# Reorder must be declared before /{shelf_id} so "reorder" isn't matched as an integer id.
@router.post("/reorder", response_model=list[ShelfOut])
def reorder_shelves(data: ReorderRequest, db: Session = Depends(get_db)):
    """Bulk reorder shelves by assigning new positions."""
    ids = [entry.id for entry in data.order]
    shelves = db.execute(select(Shelf).where(Shelf.id.in_(ids))).scalars().all()

    if len(shelves) != len(ids):
        raise HTTPException(status_code=404, detail="One or more shelf IDs not found")

    shelf_map = {s.id: s for s in shelves}
    for entry in data.order:
        shelf_map[entry.id].position = entry.position

    db.commit()
    return db.execute(select(Shelf).order_by(Shelf.position)).scalars().all()


@router.get("/{shelf_id}", response_model=ShelfWithItems)
def get_shelf(shelf_id: int, db: Session = Depends(get_db)):
    """Get a shelf with all its items."""
    shelf = db.execute(
        select(Shelf).options(selectinload(Shelf.items)).where(Shelf.id == shelf_id)
    ).scalar_one_or_none()
    if shelf is None:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf


@router.patch("/{shelf_id}", response_model=ShelfOut)
def update_shelf(shelf_id: int, data: ShelfUpdate, db: Session = Depends(get_db)):
    """Rename a shelf."""
    shelf = db.get(Shelf, shelf_id)
    if shelf is None:
        raise HTTPException(status_code=404, detail="Shelf not found")

    if data.name is not None:
        shelf.name = data.name

    db.commit()
    db.refresh(shelf)
    return shelf


@router.delete("/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelf(shelf_id: int, db: Session = Depends(get_db)):
    """Delete a shelf and cascade-delete all its items."""
    shelf = db.get(Shelf, shelf_id)
    if shelf is None:
        raise HTTPException(status_code=404, detail="Shelf not found")

    db.delete(shelf)
    db.commit()
    logger.info("Deleted shelf id=%d", shelf_id)
