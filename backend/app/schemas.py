from datetime import datetime

from pydantic import BaseModel, ConfigDict

# ---------------------------------------------------------------------------
# Items
# ---------------------------------------------------------------------------


class ItemSummary(BaseModel):
    """Trimmed item shape embedded in GET /shelves responses."""

    id: int
    name: str
    category: str
    position: int
    expires_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ItemCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str
    expires_at: datetime | None = None
    position: int | None = None


class ItemUpdate(BaseModel):
    name: str | None = None
    quantity: float | None = None
    unit: str | None = None
    category: str | None = None
    expires_at: datetime | None = None
    position: int | None = None
    shelf_id: int | None = None


class ItemOut(BaseModel):
    id: int
    shelf_id: int
    name: str
    quantity: float
    unit: str
    category: str
    position: int
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ItemSearchResult(BaseModel):
    """Item shape returned by GET /search/items — includes denormalized shelf_name."""

    id: int
    shelf_id: int
    shelf_name: str
    name: str
    category: str
    expires_at: datetime | None


# ---------------------------------------------------------------------------
# Shelves
# ---------------------------------------------------------------------------


class ShelfCreate(BaseModel):
    name: str
    position: int | None = None


class ShelfUpdate(BaseModel):
    name: str | None = None


class ShelfOut(BaseModel):
    id: int
    name: str
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShelfWithItems(ShelfOut):
    """ShelfOut extended with inline item summaries — used for GET /shelves."""

    items: list[ItemSummary] = []


# ---------------------------------------------------------------------------
# Reorder
# ---------------------------------------------------------------------------


class ReorderEntry(BaseModel):
    id: int
    position: int


class ReorderRequest(BaseModel):
    order: list[ReorderEntry]
