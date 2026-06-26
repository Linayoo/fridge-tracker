# Development

## One-time setup

### Tools

| Tool          | Install                                                              |
|---------------|----------------------------------------------------------------------|
| Homebrew      | already installed                                                    |
| Python 3.11   | `brew install python@3.11`                                           |
| Poetry        | `brew install poetry`                                                |
| Node.js LTS   | `brew install node` (Expo needs Node 18+)                            |
| Docker Desktop| install from docker.com, then start it                               |
| Expo Go       | App Store on your phone                                              |
| Watchman      | `brew install watchman` (prevents Metro EMFILE crashes)              |
| Pre-commit    | installed via `poetry install` (it's a dev dependency)               |

### Clone and bootstrap

```bash
git clone git@github.com:miri/fridge-tracker.git
cd fridge-tracker

# Backend
cd backend
poetry install
poetry run pre-commit install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

## Daily workflow

### Start the backend

Open one terminal:

```bash
cd backend
docker compose up --build
```

API at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

Migrations run automatically on container startup.

### Start the frontend

Open a second terminal:

```bash
cd frontend
npx expo start
```

Find your laptop's LAN IP (`ipconfig getifaddr en0` on Mac), update `BASE_URL` in `frontend/src/api/client.ts`, then scan the QR code with the iPhone Camera app (it'll open Expo Go).

Phone and laptop must be on the same Wi-Fi.

### Make a change

1. Create a branch: `git checkout -b feat/shelves-reorder`
2. Edit code
3. Pre-commit hooks run on `git add` / `git commit` and run ruff + tests
4. Push: `git push -u origin feat/shelves-reorder`
5. Open PR on GitHub. CI runs ruff + pytest.
6. Merge once green.

### Makefile shortcuts

All common backend tasks are in `backend/Makefile`. Run from `backend/`:

| Command | What it does |
|---|---|
| `make dev` | `docker compose up --build` — full stack |
| `make test` | `poetry run pytest` |
| `make lint` | ruff check + format, auto-fix |
| `make migrate` | `alembic upgrade head` |
| `make migration name="feat: add foo"` | autogenerate a new migration |
| `make requirements` | regenerate `requirements.txt` from `poetry.lock` |

### Run tests

```bash
cd backend
make test                            # all tests
poetry run pytest -k shelves         # tests matching "shelves"
poetry run pytest -x                 # stop on first failure
poetry run pytest --lf               # rerun last failed tests
```

### Run a migration

```bash
cd backend
make migration name="feat: add foo to bar"
# review the generated file in alembic/versions/
make migrate                         # apply
poetry run alembic downgrade -1      # revert one (no make target — intentional)
```

### Format and lint

```bash
cd backend
make lint
```

Pre-commit hooks do this automatically, so manual runs are only when fixing a batch.

## Branch and commit conventions

### Branch naming

`type/short-description`

- `feat/shelves-crud`
- `fix/cors-headers`
- `chore/upgrade-fastapi`
- `docs/add-api-spec`

### Commit messages

Conventional commits — see `CLAUDE.md` for the full convention.

One concern per commit. If you can't write the message in one line without "and", split the commit.

## Working with Claude Code

This project uses Claude Code as the primary AI assistant for coding tasks. The conventions and constraints are in `CLAUDE.md` at the repo root.

### Effective prompts

The pattern that works:

```
[Context] What I'm working on
[Constraint] What must NOT change
[Goal] What I want at the end
[Format] Plan first, code on approval
```

Example:

> Adding a "move item between shelves" endpoint. The data model already supports it via shelf_id on items.
>
> Don't change the existing PATCH /items/{id} endpoint signature.
>
> Goal: extend that PATCH to handle moving items, including updating position to the end of the destination shelf if not specified. Include tests for: moving an item, moving to a non-existent shelf (404), and moving with explicit position.
>
> Propose the plan first.

### When Claude Code drifts

If Claude Code starts doing things outside the scope of the task — common drift includes "I noticed this other thing, let me fix it too" — stop it and ask for it to focus on the original task. Note the drift as a separate issue.

## Common problems

### "Project incompatible with this version of Expo Go"

Your Expo Go on the App Store is newer than the project's SDK, or vice versa. Lock to SDK 54 in `package.json`. See `FRONTEND.md`.

### "EMFILE: too many open files"

Install Watchman: `brew install watchman`. Restart Expo.

### "Docker daemon not running"

Start Docker Desktop. Wait for the menu bar whale to stop animating.

### Phone can't reach backend

- Same Wi-Fi as laptop?
- `BASE_URL` set to laptop's LAN IP, not localhost?
- Backend running and listening on `0.0.0.0` (it is, by default in our setup)?
- Mac firewall blocking incoming connections? Settings → Privacy & Security → Firewall.

### Postgres migration fails on container startup

Check the entrypoint logs: `docker compose logs api`. Common causes:
- Migration file syntax error
- DB not ready yet (the depends_on healthcheck should prevent this — investigate if it happens)
- Conflicting migration (someone else edited a migration that was already applied)
