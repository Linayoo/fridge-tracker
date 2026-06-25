# First Claude Code prompts

These are the prompts to copy-paste into Claude Code in order. Each one builds on the previous.

## Prompt 1: orient Claude Code to the specs

Run this in an empty `fridge-tracker/` directory after dropping in `CLAUDE.md` and the `docs/` folder.

```
Read CLAUDE.md and every file under docs/ before doing anything else.

Then summarize back to me:
1. The v1 scope in three bullet points
2. The exact tech stack we're using
3. The data model in one sentence
4. The three things you absolutely should NOT do without asking

If anything in the specs is ambiguous or contradictory, list those issues. Do not write any code yet.
```

This calibrates Claude Code before any work starts. If its summary doesn't match the specs, fix the specs (or its reading) before proceeding.

## Prompt 2: backend scaffolding

After the summary checks out:

```
Scaffold the backend per docs/BACKEND.md and docs/ARCHITECTURE.md.

Constraints:
- Stop after the backend is done. Do not touch the frontend yet.
- Use the exact project structure listed in docs/BACKEND.md.
- Set up Poetry, Pytest, Ruff, and pre-commit per the spec.
- Set up Alembic with autogenerate. Create the initial migration for the shelves and items tables.
- Dockerfile + docker-compose.yml with Postgres 16 and a health-checked api service. The api entrypoint must run `alembic upgrade head` before starting uvicorn.
- Include one happy-path and one error-path test per router as the test spec says.
- Add a .github/workflows/ci.yml that runs ruff check + pytest on push and PR.

Before generating files, show me:
- The proposed pyproject.toml contents
- The proposed alembic env.py outline
- Any decisions you made that aren't explicit in the specs

Wait for my approval, then scaffold.
```

## Prompt 3: verify backend runs

After scaffolding:

```
Run the backend end-to-end and confirm it works:

1. `docker compose up --build` should bring up Postgres and the api
2. Migrations should apply automatically
3. `curl http://localhost:8000/healthz` should return {"status":"ok"}
4. `curl -X POST http://localhost:8000/shelves -H "Content-Type: application/json" -d '{"name":"Top","position":0}'` should return 201 with the created shelf
5. `curl http://localhost:8000/shelves` should return a list with that shelf
6. `poetry run pytest` should pass all tests

If any of these fail, show me the error and propose a fix. Don't fix anything yet — let me see the failure first.
```

## Prompt 4: frontend scaffolding

After the backend is verified:

```
Scaffold the frontend per docs/FRONTEND.md.

Constraints:
- Expo SDK 54 (locked — see the SDK rationale in FRONTEND.md)
- React Navigation v7
- Use the exact src/ structure listed in the spec
- Implement these screens for v1:
  1. HomeScreen — list of shelves with item previews
  2. ShelfScreen — items in a shelf, with add button
  3. ItemFormScreen — add and edit an item (one screen, conditional on route param)
  4. ShelfFormScreen — add and rename shelf (one screen)
  5. SearchScreen — search across items
- Implement the api client (src/api/) for all endpoints in docs/API.md
- Implement the expiration utility per docs/PRODUCT.md (fresh / expiring_soon / expired)

Before generating files, show me:
- The exact package.json with locked versions
- The navigation flow (which screens push to which)
- The proposed src/api/types.ts so I can verify types match the backend schemas

Wait for my approval, then scaffold.
```

## Prompt 5: end-to-end smoke test

After both scaffolds:

```
End-to-end check. Walk through every screen and confirm it works against the running backend.

1. From a fresh state, add three shelves
2. Add five items across the shelves with varying expiration dates (one expired, one expiring soon, three fresh)
3. Edit one item — change its quantity
4. Move one item to a different shelf
5. Search for an item by partial name
6. Delete one item, then one shelf

Report: what worked, what failed, what looked wrong (UX or visual). Don't fix anything yet — just report.
```

## Prompt 6: commit and push

After everything works:

```
Commit and push the initial scaffold.

- One commit for backend scaffold ("chore: backend scaffold with FastAPI, Poetry, Pytest, Alembic, Ruff")
- One commit for backend tests ("test: add initial router tests")
- One commit for CI config ("ci: add GitHub Actions for ruff and pytest")
- One commit for frontend scaffold ("chore: frontend scaffold with Expo SDK 54 and React Navigation v7")
- One commit for the docs ("docs: add product, architecture, backend, frontend, API, deployment, development specs")
- One commit for CLAUDE.md ("docs: add Claude Code conventions")

Push to main.
```

After this, the project is at the "Week 1 complete" milestone. Next is feature work (better category UI, search polish, etc.) and then AWS deployment in week 3.
