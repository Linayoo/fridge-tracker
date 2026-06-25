# Instructions for Claude Code

This file is the source of truth for how this codebase should be written and maintained. Read it at the start of every session.

## Project context

Fridge inventory tracking app. Backend in Python (FastAPI), frontend in React Native (Expo + TypeScript). 4-week timeline toward a meetup demo, then AWS deployment.

Owner is a backend-leaning full-stack developer with 3 years of production Rails experience, currently strengthening Python (FastAPI, Poetry, Pytest, Ruff) and TypeScript/React. Treat code reviews accordingly: no over-explaining basics, do explain Python-specific idioms when they're non-obvious.

## Core working principles

1. **Plan before code.** For any non-trivial task, propose a plan first and wait for approval. Trivial = fixing a typo, renaming a variable, adding a missing import.
2. **One concern per commit.** If a task touches multiple concerns (e.g. a new endpoint and a bugfix), split it into multiple commits.
3. **Never silently expand scope.** If you discover something else needs fixing, surface it as a follow-up, don't fold it into the current task.
4. **Honest communication.** If a task is harder than expected, say so. If you took a shortcut, flag it. If you're unsure about an approach, ask.
5. **Match existing patterns.** Before introducing a new pattern, check if there's already one in the codebase to follow.

## Tech stack (do not deviate without asking)

### Backend
- Python 3.11
- FastAPI for the web framework
- SQLAlchemy 2.0 with typed `Mapped[]` columns and `mapped_column()`
- Alembic for migrations (autogenerate where possible, hand-edit when needed)
- Pydantic v2 with `ConfigDict(from_attributes=True)`
- PostgreSQL 16
- Poetry for dependency management (no requirements.txt)
- Pytest for tests
- Ruff for linting and formatting (line length 100, target py311)
- Pre-commit hooks for ruff + fast pytest subset

### Frontend
- Expo SDK 54 (locked — not 55, because App Store Expo Go lag)
- React Native with TypeScript
- React Navigation v7
- Native fetch (no axios) — keep deps minimal

### Deployment
- Docker for backend
- AWS App Runner for hosting the API
- AWS RDS for PostgreSQL
- AWS Secrets Manager for credentials
- GitHub Actions for CI/CD

## Code style

### Python
- Type hints on all public functions and methods. Internal helpers can skip if obvious.
- Prefer `from typing import` imports over `typing.X` usage.
- Use `pathlib.Path` over `os.path`.
- Docstrings on public functions, especially routers and services. One-line summary minimum; full docstring when behavior isn't obvious from the signature.
- Use SQLAlchemy 2.0 style consistently: `Mapped[int]`, `mapped_column()`, `session.execute(select(...))` rather than legacy `session.query()`.
- For async route handlers, use `async def`. For sync DB queries, that's still fine inside `async def` — don't pretend the DB is async.
- Naming: snake_case for variables/functions, PascalCase for classes, SCREAMING_SNAKE for constants.

### TypeScript / React Native
- Functional components only, no class components.
- Hooks for state (`useState`, `useEffect`, `useCallback`).
- Types over interfaces unless extending. Prefer `type` for object shapes, `interface` for things that get extended.
- No `any` types. Use `unknown` when the shape is genuinely not known, then narrow.
- Component files: PascalCase (`ShelfCard.tsx`). Hooks: camelCase prefixed with `use` (`useShelves.ts`). Utils: camelCase (`formatDate.ts`).
- Keep components under 200 lines. If they grow past that, extract sub-components.
- StyleSheet at the bottom of the file. No inline styles except for dynamic values.

### Commits
- Conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`
- Examples: `feat(shelves): add reorder endpoint`, `fix(items): correct cascade delete`, `chore(deps): bump fastapi to 0.115.4`
- One concern per commit. If you can't write a single-line message without "and", split it.
- Imperative mood: "add" not "added".

## Testing requirements

- Every router gets at least one happy-path test and one error-path test (404, 400).
- DB tests use a separate test database (isolated per test or per session — your call, document the choice).
- Use pytest fixtures for: test client, test DB session, sample data factories.
- Don't test SQLAlchemy itself. Don't test FastAPI's validation. Test our logic.
- Frontend tests are out of scope for v1. Don't scaffold a frontend test framework unless asked.

## Things to NOT do without asking

- Add a new top-level dependency
- Change the data model (new tables, new columns)
- Introduce auth, users, or any concept of multi-tenancy
- Add a frontend state management library (Redux, Zustand, etc.) — useState + props is fine for v1
- Set up Sentry, analytics, or any third-party SaaS
- Refactor working code "for cleanliness" — only refactor when it's blocking the current task
- Add dependencies you've heard are popular — only add what's needed for the immediate task

## Things to do automatically (no need to ask)

- Add a missing import
- Add a missing return type hint
- Fix a typo in a comment
- Add a docstring to a public function that lacks one
- Format with ruff before committing

## Communication conventions

- When proposing a plan: structure it as **Goal → Files to touch → Approach → Open questions**
- When done with a task: list **What changed** (file by file) and **What to test manually**
- When stuck: state **What you tried**, **What's failing**, **What you suspect**, then ask
- Don't pad responses with summaries of what you're about to do. Just do it and report what was done.

## Out of scope for v1 (don't scaffold, don't even stub)

- Authentication
- User accounts, multi-user
- Multi-place (multiple fridges per user)
- Push notifications
- Photo recognition of groceries
- Drag-and-drop in the UI (we'll add the position field to the data model, but the UI is just buttons/list reordering in v1)
- Recipe suggestions
- Shopping list
- Multilingual UI (English only for v1)
- Family member sharing
- Analytics or telemetry

These are all on the roadmap (see `docs/PRODUCT.md`). The data model should make them addable without rewrites — but don't add code for them.
