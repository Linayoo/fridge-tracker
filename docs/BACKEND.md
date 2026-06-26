# Backend

## Stack

| Tool         | Version target  | Purpose                            |
|--------------|-----------------|------------------------------------|
| Python       | 3.11            | runtime                            |
| FastAPI      | ~0.115          | web framework                      |
| SQLAlchemy   | 2.0.x           | ORM, typed Mapped style            |
| Alembic      | latest          | migrations                         |
| Pydantic     | 2.x             | validation, serialization          |
| PostgreSQL   | 16              | database                           |
| Poetry       | 1.8+            | dependency management              |
| Pytest       | latest          | testing                            |
| Ruff         | latest          | linting + formatting               |
| pre-commit   | latest          | git hooks                          |

## Project structure

```
backend/
├── pyproject.toml
├── poetry.lock
├── requirements.txt             # Docker build artifact — see "Docker build artifact" section
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh                # alembic upgrade head && uvicorn
├── alembic.ini
├── .pre-commit-config.yaml
├── .env.example                 # copy to .env for local dev
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, route registration
│   ├── database.py          # engine, SessionLocal, get_db dependency
│   ├── config.py            # Pydantic settings, env var loading
│   ├── models.py            # SQLAlchemy models (all in one file in v1)
│   ├── schemas.py           # Pydantic schemas
│   ├── categories.py        # the static category list
│   └── routers/
│       ├── __init__.py
│       ├── shelves.py
│       ├── items.py
│       ├── search.py        # GET /search/items (separate to avoid /items/{id} conflict)
│       ├── categories.py
│       └── health.py        # /healthz endpoint
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
└── tests/
    ├── __init__.py
    ├── conftest.py          # fixtures: client, db_session, factories
    ├── test_shelves.py
    ├── test_items.py
    ├── test_search.py
    └── test_categories.py
```

Keep `models.py` and `schemas.py` as single files for v1. If they grow past ~300 lines, split per resource (`models/shelves.py`, `models/items.py`).

### Pydantic schema naming convention

- `ShelfCreate` / `ItemCreate` — inbound request bodies (all optional fields except required ones)
- `ShelfUpdate` / `ItemUpdate` — PATCH request bodies (all fields optional)
- `ItemSummary` — the trimmed shape embedded in `GET /shelves` responses: `id`, `name`, `category`, `position`, `expires_at` only
- `ShelfOut` / `ItemOut` — full response shapes returned by all other endpoints
- `ShelfWithItems` — `ShelfOut` extended with an `items: list[ItemSummary]` field, used only for `GET /shelves`

## Conventions

### SQLAlchemy 2.0 style (mandatory)

Use `Mapped[]` and `mapped_column()`:

```python
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey

class Shelf(Base):
    __tablename__ = "shelves"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    position: Mapped[int]
```

Query with `select()`, not legacy `Query`:

```python
from sqlalchemy import select
stmt = select(Shelf).order_by(Shelf.position)
shelves = db.execute(stmt).scalars().all()
```

### Pydantic v2

```python
from pydantic import BaseModel, ConfigDict

class ShelfOut(BaseModel):
    id: int
    name: str
    position: int
    model_config = ConfigDict(from_attributes=True)
```

### Routers

- One router file per resource
- Use `APIRouter(prefix="/shelves", tags=["shelves"])`
- HTTP status codes are explicit: `status_code=201` for create, `204` for delete
- Use FastAPI dependency injection for the DB session: `db: Session = Depends(get_db)`
- Errors raise `HTTPException(404, "Shelf not found")` — message is human-readable

### Config

Use Pydantic settings (`pydantic-settings` package):

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    environment: str = "development"
    model_config = SettingsConfigDict(env_file=".env")
```

Read `DATABASE_URL` from the environment. Never hardcode credentials.

### Migrations

- Alembic with autogenerate as the default workflow
- Each migration message follows the same format as commit messages: `feat: add items table`, `fix: cascade delete on shelf removal`
- Migrations run automatically on container startup (entrypoint script: `alembic upgrade head && uvicorn ...`)
- Never edit a migration that's been applied in production
- For column renames or data backfills, autogenerate the diff, then hand-edit

### Logging

Use Python's `logging` module, not `print`. Configure in `main.py`:

```python
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
```

Get a logger per module: `logger = logging.getLogger(__name__)`.

## Testing

### Philosophy

- Test our logic, not the framework
- Happy path + error path for every endpoint at minimum
- Don't mock the DB — use a real test database

### Fixtures (in `conftest.py`)

- `db_session`: a SQLAlchemy session bound to a clean test database. Roll back after each test.
- `client`: a `TestClient` with the DB dependency overridden to use the test session
- `sample_shelf`, `sample_item`: factory fixtures for common test data

### Test database choice

Use a separate Postgres database (e.g. `fridge_test`) on the same instance. Schema is recreated per test session. Avoid SQLite for tests because the production DB is Postgres and we want real behavior (e.g. `TIMESTAMP WITH TIME ZONE` differences).

To make this work locally without extra setup, the test config can fall back to a Docker-compose Postgres if `TEST_DATABASE_URL` isn't set.

### Example test shape

```python
def test_create_shelf(client):
    response = client.post("/shelves", json={"name": "Top shelf", "position": 0})
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Top shelf"
    assert "id" in body

def test_get_shelf_not_found(client):
    response = client.get("/shelves/9999")
    assert response.status_code == 404
```

## Linting and formatting

`ruff` configured in `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "N", "SIM", "RUF"]
ignore = ["E501"]  # line length handled by formatter

[tool.ruff.format]
quote-style = "double"
```

Pre-commit runs `ruff format` and `ruff check --fix` before every commit.

## Dependencies

### Runtime (production)

- fastapi
- uvicorn[standard]
- sqlalchemy
- alembic
- psycopg2-binary
- pydantic
- pydantic-settings

### Dev only

- pytest
- pytest-asyncio (if any async test patterns are needed)
- httpx (for TestClient)
- ruff
- pre-commit

Do not add other dependencies without an explicit reason.

## Docker build artifact

`requirements.txt` in `backend/` is **not the source of truth for dependencies** — `pyproject.toml` and `poetry.lock` are. It exists solely because Poetry 2.x crashes with SIGILL inside `python:3.11-slim` on Apple Silicon when `POETRY_VIRTUALENVS_CREATE=false`, making `poetry install` unusable in Docker. The Dockerfile therefore uses `pip install -r requirements.txt` instead.

Rules:
- Do not edit `requirements.txt` by hand.
- After any `poetry add` or `poetry remove`, regenerate it with:
  ```bash
  make requirements
  ```
  This tries `poetry export` (requires `poetry-plugin-export`) and falls back to
  `scripts/export_requirements.py` automatically.
- Commit the updated `requirements.txt` alongside the lock file change.

## Local run

```bash
cd backend
poetry install
docker compose up db -d           # Postgres only
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

Or all-in-one with Docker:

```bash
docker compose up --build
```

API is at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.
