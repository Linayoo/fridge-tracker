# Fridge Tracker

A mobile app to track what's in your fridge — customizable shelves, expiration alerts, category icons.

## Why this exists

My partner and I keep buying duplicate groceries because we forget what's in the fridge. My parents waste fresh food that rots before it's used. This app mirrors the physical layout of a fridge so you can see what you have at a glance.

## Status

Building toward a 4-week meetup demo. v1 scope is intentionally narrow.

## Tech stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL
**Tooling:** Poetry, Pytest, Ruff, pre-commit
**Frontend:** Expo SDK 54, React Native, TypeScript, React Navigation v7
**Deployment:** AWS ECS Fargate + RDS Postgres + ALB + Secrets Manager (eu-central-1)

## Documentation

All specs live in `/docs`:

- [`docs/PRODUCT.md`](./docs/PRODUCT.md) — what we're building, scope, roadmap
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system design and data model
- [`docs/BACKEND.md`](./docs/BACKEND.md) — backend conventions, structure, testing
- [`docs/FRONTEND.md`](./docs/FRONTEND.md) — frontend conventions, structure, navigation
- [`docs/API.md`](./docs/API.md) — endpoint contracts
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — AWS deployment plan
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — local setup, daily workflow
- [`CLAUDE.md`](./CLAUDE.md) — coding conventions and constraints for Claude Code

## Quick start

See [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).
