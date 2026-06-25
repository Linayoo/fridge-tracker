# Architecture

## System diagram

```
┌─────────────────────┐         HTTPS          ┌──────────────────────┐
│  React Native App   │ ─────────────────────► │  FastAPI Backend     │
│  (Expo + TS)        │                        │  (Python 3.11)       │
│                     │ ◄───────────────────── │                      │
│  - Shelves view     │                        │  - REST API          │
│  - Item CRUD        │                        │  - SQLAlchemy 2.0    │
│  - Search           │                        │  - Alembic           │
└─────────────────────┘                        └──────────────────────┘
                                                          │
                                                          │ TCP
                                                          ▼
                                               ┌──────────────────┐
                                               │  PostgreSQL 16   │
                                               │  (Docker dev /   │
                                               │   AWS RDS prod)  │
                                               └──────────────────┘
```

For the AWS deployment layer, see `DEPLOYMENT.md`.

## Why this shape

- **Separate backend and frontend** so the same API can serve future clients (web, watch, voice — none in scope now, but the door stays open).
- **REST over HTTP/JSON** because v1 needs simple CRUD and there's no real-time requirement. GraphQL would be overkill.
- **PostgreSQL** because the data is relational (shelves contain items), and it's the same DB everywhere in dev and prod.
- **No cache layer in v1** because the data volumes are tiny (one fridge, a few dozen items). Redis would be premature.

## Data model

Two tables only in v1: `shelves` and `items`. No users, no places.

### `shelves`

| Column      | Type             | Notes                          |
|-------------|------------------|--------------------------------|
| id          | Integer PK       |                                |
| name        | String(100)      | not null                       |
| position    | Integer          | ordering, 0 = top              |
| created_at  | DateTime(tz)     | server default `now()`         |
| updated_at  | DateTime(tz)     | server default + onupdate      |

Future hook: a nullable `place_id: int | None` column can be added in a single Alembic migration when multi-place arrives.

### `items`

| Column       | Type                   | Notes                                |
|--------------|------------------------|--------------------------------------|
| id           | Integer PK             |                                      |
| shelf_id     | Integer FK             | references shelves.id, ON DELETE CASCADE |
| name         | String(200)            | not null                             |
| quantity     | Float                  | not null                             |
| unit         | String(50)             | free string: "kg", "L", "pieces"     |
| category     | String(50)             | enum-like string, see categories     |
| position     | Integer                | order within shelf, 0 = top          |
| expires_at   | DateTime(tz) or null   | nullable                             |
| created_at   | DateTime(tz)           | server default `now()`               |
| updated_at   | DateTime(tz)           | server default + onupdate            |

### Design decisions and rationale

**Category as a string, not a foreign key to a `categories` table.** The category list is fixed for v1 and exposed via a static `GET /categories` endpoint. A foreign key adds joins, migrations, and complexity for zero benefit until users can define their own categories. Migrating to a FK later is straightforward — add the table, backfill from the existing strings, swap the column type.

**Position as integer, not a linked list or fractional index.** Simple integers are easier to reason about. Reordering is a bulk operation: the frontend sends the new ordering, the backend rewrites all positions for the affected shelf. With a max of ~50 items per shelf, this is cheap.

**Expiration color computed in the frontend, not stored.** Storing the status (`"fresh" | "expiring_soon" | "expired"`) would be stale data — it would have to be recomputed constantly. The frontend computes it from `expires_at` on render. Stateless and always correct.

**Timestamps include time zone.** App is used in Switzerland, deploy to AWS, eventually used in multiple time zones. Use `TIMESTAMP WITH TIME ZONE` from day one. Pydantic schemas accept and return ISO 8601.

**Cascading delete on items when a shelf is deleted.** Items are owned by shelves. If a shelf disappears, the items disappear with it. The frontend will need to warn the user with a confirmation modal before deleting a non-empty shelf.

## Categories (v1, hardcoded)

Exposed via `GET /categories`. Response includes slug, label, emoji, and suggested units.

```json
[
  { "slug": "vegetables", "label": "Vegetables", "emoji": "🥦", "suggested_units": ["pieces", "g", "kg"] },
  { "slug": "fruits",     "label": "Fruits",     "emoji": "🍎", "suggested_units": ["pieces", "g", "kg"] },
  { "slug": "dairy",      "label": "Dairy",      "emoji": "🧀", "suggested_units": ["pieces", "g", "ml", "L"] },
  { "slug": "meat",       "label": "Meat",       "emoji": "🥩", "suggested_units": ["g", "kg", "pieces"] },
  { "slug": "fish",       "label": "Fish",       "emoji": "🐟", "suggested_units": ["g", "kg", "pieces"] },
  { "slug": "leftovers",  "label": "Leftovers",  "emoji": "🍱", "suggested_units": ["portions", "g"] },
  { "slug": "condiments", "label": "Condiments", "emoji": "🫙", "suggested_units": ["pieces", "ml", "g"] },
  { "slug": "drinks",     "label": "Drinks",     "emoji": "🧃", "suggested_units": ["bottles", "L", "ml"] },
  { "slug": "frozen",     "label": "Frozen",     "emoji": "🧊", "suggested_units": ["pieces", "g", "kg"] },
  { "slug": "grains",     "label": "Grains",     "emoji": "🌾", "suggested_units": ["g", "kg", "pieces"] },
  { "slug": "other",      "label": "Other",      "emoji": "📦", "suggested_units": ["pieces", "g", "ml"] }
]
```

## What's NOT in the architecture

- No background workers (Sidekiq, Celery, etc.) — nothing needs them in v1
- No cache (Redis, Memcached)
- No queue
- No CDN — frontend is delivered by Expo
- No file storage — no images in v1 (S3 will join when photo recognition arrives in Phase 3)
- No external auth provider — no auth at all
- No analytics, no Sentry, no telemetry
