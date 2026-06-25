# API Contract

Base URL: `http://localhost:8000` in dev. Production URL set by AWS App Runner.

All endpoints return JSON. All timestamps are ISO 8601 with time zone.

## Health

### `GET /healthz`

Health check used by AWS App Runner. Always returns 200 unless the app is unhealthy.

```json
{ "status": "ok" }
```

## Shelves

### `GET /shelves`

List all shelves, ordered by `position`. Includes item summaries inline (id, name, category, expires_at, position) for the home screen.

```json
[
  {
    "id": 1,
    "name": "Top shelf",
    "position": 0,
    "created_at": "2026-06-01T10:00:00Z",
    "updated_at": "2026-06-01T10:00:00Z",
    "items": [
      { "id": 1, "name": "Yogurt", "category": "dairy", "position": 0, "expires_at": "2026-06-30T00:00:00Z" }
    ]
  }
]
```

### `POST /shelves`

Create a shelf. `position` is optional — if omitted, the server assigns `max(position) + 1` across all shelves (appends to the end).

Request:
```json
{ "name": "Top shelf" }
```

`position` may be included to insert at a specific slot, but the caller is responsible for keeping positions contiguous in that case.

Response: 201, full shelf object (without items).

### `GET /shelves/{id}`

Get a shelf with its full items (all fields, not the summary).

Response 200 or 404.

### `PATCH /shelves/{id}`

Rename a shelf.

Request:
```json
{ "name": "Renamed shelf" }
```

Response: 200, full shelf object.

### `DELETE /shelves/{id}`

Delete a shelf and all its items. Cascades.

Response: 204.

### `POST /shelves/reorder`

Bulk reorder shelves. Pass the full ordered list.

Request:
```json
{ "order": [{ "id": 3, "position": 0 }, { "id": 1, "position": 1 }, { "id": 2, "position": 2 }] }
```

Response: 200, the updated list of shelves.

## Items

### `POST /shelves/{shelf_id}/items`

Add an item to a shelf. `position` is optional — if omitted, the server assigns `max(position) + 1` within the target shelf (appends to the end).

Request:
```json
{
  "name": "Yogurt",
  "quantity": 4,
  "unit": "pieces",
  "category": "dairy",
  "expires_at": "2026-07-01T00:00:00Z"
}
```

`position` may be included to insert at a specific slot.

Response: 201, full item object.

### `GET /items/{id}`

Get a single item.

Response 200 or 404.

### `PATCH /items/{id}`

Edit an item. Any field can be sent. To move an item to a different shelf, send `shelf_id`.

Request (partial):
```json
{ "quantity": 2, "shelf_id": 3 }
```

Response: 200, full item object.

### `DELETE /items/{id}`

Response: 204.

### `POST /shelves/{shelf_id}/items/reorder`

Bulk reorder items within a shelf.

Request:
```json
{ "order": [{ "id": 5, "position": 0 }, { "id": 3, "position": 1 }] }
```

Response: 200, the updated list of items.

## Search

### `GET /search/items?q={query}`

Case-insensitive `ILIKE '%query%'` against `name`. Returns items across all shelves.

Lives in its own router (`app/routers/search.py`), not in `items.py`, to avoid the routing ambiguity that would arise from `GET /items/{id}` and `GET /items/search` sharing the same prefix.

Query params:
- `q` (required): search string, at least 1 character

Response: 200, list of items with their `shelf_id` and a denormalized `shelf_name` for display.

```json
[
  { "id": 1, "name": "Yogurt", "shelf_id": 1, "shelf_name": "Top shelf", "category": "dairy", "expires_at": "..." }
]
```

## Categories

### `GET /categories`

Static list of categories.

```json
[
  {
    "slug": "vegetables",
    "label": "Vegetables",
    "emoji": "🥦",
    "suggested_units": ["pieces", "g", "kg"]
  }
]
```

See `ARCHITECTURE.md` for the full list.

## Error format

Errors follow FastAPI's default:

```json
{ "detail": "Shelf not found" }
```

For validation errors, FastAPI returns the standard 422 with field-level details. The frontend should display the `detail[0].msg` field.

## HTTP status codes

| Code | When                               |
|------|------------------------------------|
| 200  | success                            |
| 201  | resource created                   |
| 204  | resource deleted (empty body)      |
| 400  | bad request (logical error)        |
| 404  | resource not found                 |
| 422  | validation failed (Pydantic)       |
| 500  | unhandled server error             |

## CORS

`allow_origins=["*"]` in dev. In production, restrict to the deployed app's origin.
