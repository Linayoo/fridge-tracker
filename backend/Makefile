.PHONY: requirements test lint migrate migration dev

# Regenerate the Docker build artifact from poetry.lock.
# Run this after any `poetry add` or `poetry remove`.
# Tries poetry-plugin-export first; falls back to scripts/export_requirements.py
# when the plugin is unavailable (common on Homebrew-managed Poetry installs).
requirements:
	poetry export --without-hashes --without dev -f requirements.txt -o requirements.txt 2>/dev/null \
		|| python3 scripts/export_requirements.py

test:
	poetry run pytest

lint:
	poetry run ruff check . --fix && poetry run ruff format .

# Apply all pending Alembic migrations (requires DATABASE_URL in env or .env).
migrate:
	poetry run alembic upgrade head

# Generate a new migration from model changes.
# Usage: make migration name="feat: add foo column"
migration:
	poetry run alembic revision --autogenerate -m "$(name)"

# Build and start the full stack (Postgres + API) via Docker Compose.
dev:
	docker compose up --build
