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

For device testing, copy `.env.example` to `.env.local` and set your laptop's LAN IP:

```bash
cd frontend
cp .env.example .env.local
# edit .env.local: EXPO_PUBLIC_API_URL=http://<your-ip>:8000
# find your IP: ipconfig getifaddr en0 (Mac) or hostname -I (Linux)
```

Expo SDK 49+ auto-loads `.env.local` — no extra config needed. Run with `--clear` whenever you change the env file, since Metro caches env vars:

```bash
npx expo start --clear
```

Then scan the QR code with the iPhone Camera app (it'll open Expo Go).

Phone and laptop must be on the same Wi-Fi. `.env.local` is gitignored.

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

## Working with production

The production API runs on AWS ECS Fargate in eu-central-1 behind an ALB.
All commands below require the AWS CLI configured with the `fridge-tracker-cli`
credentials and `eu-central-1` as the default region.

### Check task status

```bash
aws ecs describe-services \
  --cluster fridge-tracker-cluster \
  --services fridge-tracker-api-service \
  --region eu-central-1 \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount,deployments:deployments[*].{id:id,status:status,running:runningCount}}'
```

### Read production logs

```bash
# List recent log streams (one per task run)
aws logs describe-log-streams \
  --log-group-name /ecs/fridge-tracker-api \
  --order-by LastEventTime \
  --descending \
  --region eu-central-1 \
  --query 'logStreams[0].logStreamName'

# Tail the most recent stream (replace STREAM_NAME with the output above)
aws logs get-log-events \
  --log-group-name /ecs/fridge-tracker-api \
  --log-stream-name STREAM_NAME \
  --region eu-central-1 \
  --query 'events[*].message' \
  --output text
```

### Shell into a running task (ECS Exec)

ECS Exec is enabled on the service. Use it to inspect the running container:

```bash
# Get the task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster fridge-tracker-cluster \
  --service-name fridge-tracker-api-service \
  --region eu-central-1 \
  --query 'taskArns[0]' \
  --output text)

# Open a shell in the running container
aws ecs execute-command \
  --cluster fridge-tracker-cluster \
  --task "$TASK_ARN" \
  --container fridge-tracker-api \
  --interactive \
  --command "/bin/sh" \
  --region eu-central-1
```

This drops you into the container. Useful for running Alembic commands
manually, checking environment variables, or diagnosing connectivity.

### Deploy a new image to production

```bash
# 1. Authenticate with ECR
aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin \
    <account-id>.dkr.ecr.eu-central-1.amazonaws.com

# 2. Build for linux/amd64 (Fargate; Apple Silicon defaults to arm64)
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t <account-id>.dkr.ecr.eu-central-1.amazonaws.com/fridge-tracker-api:latest \
  backend/

# 3. Push
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/fridge-tracker-api:latest

# 4. Force ECS to pull :latest and roll a new task
aws ecs update-service \
  --cluster fridge-tracker-cluster \
  --service fridge-tracker-api-service \
  --force-new-deployment \
  --region eu-central-1
```

Rollout takes ~2–3 minutes. The new task runs `alembic upgrade head` before
serving traffic, so migrations apply automatically.

### Point the frontend at production

In `frontend/.env.local`, set:

```
EXPO_PUBLIC_API_URL=http://<alb-dns-name>
```

Find the ALB DNS name:

```bash
aws elbv2 describe-load-balancers \
  --names fridge-tracker-alb \
  --region eu-central-1 \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

Restart Metro with `--clear` after changing the env file:

```bash
cd frontend && npx expo start --clear
```
