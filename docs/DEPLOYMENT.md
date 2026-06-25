# Deployment

## Target architecture (week 3)

```
                    ┌─────────────────────────────┐
                    │           GitHub            │
                    │  (source of truth, CI)      │
                    └──────────────┬──────────────┘
                                   │ on push to main
                                   ▼
                    ┌─────────────────────────────┐
                    │    GitHub Actions (CI/CD)   │
                    │  - ruff check               │
                    │  - pytest                   │
                    │  - build Docker image       │
                    │  - push to ECR              │
                    │  - trigger App Runner deploy│
                    └──────────────┬──────────────┘
                                   │
                                   ▼
        ┌────────────────────────────────────────────────┐
        │                    AWS                         │
        │                                                │
        │  ┌────────────┐    ┌────────────┐    ┌──────┐  │
        │  │    ECR     │───►│ App Runner │───►│ RDS  │  │
        │  │ (image)    │    │ (FastAPI)  │    │ PG   │  │
        │  └────────────┘    └────────────┘    └──────┘  │
        │                          │                     │
        │                          ▼                     │
        │                  ┌───────────────┐             │
        │                  │ Secrets Mgr   │             │
        │                  │ (DB password) │             │
        │                  └───────────────┘             │
        └────────────────────────────────────────────────┘
                                   ▲
                                   │ HTTPS
                                   │
                       ┌───────────┴────────────┐
                       │   Expo app on phone    │
                       └────────────────────────┘
```

## Why these AWS services

| Service           | Why                                                              |
|-------------------|------------------------------------------------------------------|
| App Runner        | Simplest path to host a Dockerized API. Auto-scales, no servers. |
| RDS (Postgres)    | Managed Postgres. db.t4g.micro is cheap (~$15/mo).                |
| ECR               | Required if pushing custom Docker images for App Runner.         |
| Secrets Manager   | Store DB password, retrieve in App Runner via IAM role.          |
| IAM               | App Runner needs a role to pull from ECR and read secrets.       |

Things we are explicitly NOT using:

- **No ECS, no Kubernetes** — App Runner is enough for a 1-service app
- **No CloudFront** — the API doesn't need a CDN
- **No Route 53** — App Runner gives a free subdomain; custom domain is a phase 2 concern
- **No S3** in v1 — no file uploads until photo recognition phase

## Cost expectation

Rough monthly cost for a personal demo app, low traffic:

| Service       | Cost                                |
|---------------|-------------------------------------|
| App Runner    | ~$5 (1 vCPU pause-when-idle config) |
| RDS db.t4g.micro | ~$15                             |
| Storage (20GB RDS) | ~$3                            |
| ECR           | <$1                                 |
| Secrets Mgr   | $0.40                               |
| **Total**     | **~$25/month**                      |

App Runner can scale to zero (pause when idle); enable it to keep costs low between demos.

Set up AWS billing alerts at $30 before deploying.

## Deployment plan (week 3)

Day 1 (Saturday morning): AWS account + IAM

- If no AWS account: create one
- Enable MFA on root user
- Create IAM user `fridge-tracker-deployer` with programmatic access
- Attach minimal policies: ECR push/pull, App Runner manage, Secrets Manager read, RDS describe
- Configure `aws` CLI locally

Day 1 (Saturday afternoon): RDS Postgres

- Create RDS instance: PostgreSQL 16, db.t4g.micro, 20 GB GP3 storage
- VPC: default VPC is fine for a demo. Set publicly accessible = yes ONLY if App Runner uses public networking; otherwise use VPC connector and keep RDS private (preferred).
- Master username: `fridge_admin`. Generate strong password, save in Secrets Manager.
- Security group: allow inbound 5432 from App Runner's VPC connector (or 0.0.0.0/0 if temporarily public — disable after testing)
- Connect locally with psql to verify

Day 2 (Sunday morning): ECR + first image push

- Create ECR repository: `fridge-tracker-api`
- Build the production image locally:
  ```bash
  docker build -t fridge-tracker-api:v0.1 backend/
  ```
- Tag and push to ECR (commands from the ECR console "View push commands" button)

Day 2 (Sunday afternoon): App Runner service

- Create App Runner service pointing at the ECR image
- Environment variables: `DATABASE_URL` reads from Secrets Manager
- Port: 8000
- Health check path: `/healthz`
- Auto-deployment: yes (so future ECR pushes trigger redeploys)
- After it goes live, verify:
  - `curl https://<app-runner-url>/healthz` returns 200
  - `curl https://<app-runner-url>/docs` shows the Swagger UI
  - Migrations ran (check via psql)

Day 3 (Sunday evening or following Monday): GitHub Actions

- Create `.github/workflows/deploy.yml`
- Trigger on push to main, after tests pass
- Steps:
  - Configure AWS credentials (use GitHub OIDC, not long-lived keys)
  - Build image
  - Push to ECR with `:latest` and `:${{ github.sha }}` tags
  - App Runner auto-deploys from `:latest`
- Test by pushing a trivial change (e.g. README typo)

## Secrets in CI

Use GitHub OIDC + AWS IAM role assumption — no long-lived AWS keys in GitHub. Setup:

1. Create OIDC provider in AWS IAM (one-time per AWS account)
2. Create IAM role `fridge-tracker-github-deployer` trusting GitHub's OIDC
3. Reference the role ARN in the workflow

This is the modern best practice. Demonstrates real AWS knowledge for the meetup talk.

## Migrations on deploy

The container's entrypoint runs:

```sh
#!/bin/sh
set -e
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
```

So every deploy applies pending migrations before serving traffic.

For zero-downtime migrations (additive only, no breaking schema changes), this is fine. For destructive migrations, we'd need a more careful process — not relevant in v1.

## Rollback

App Runner keeps the previous image. To roll back: change the App Runner service to point at the previous ECR image tag.

For schema rollbacks: Alembic has `alembic downgrade -1`. Use only if the data hasn't changed shape; otherwise restore from RDS snapshot.

## Out of scope for v1 deployment

- Custom domain (App Runner default URL is fine)
- HTTPS certificates (App Runner provides one)
- Multi-region
- Blue/green or canary deploys
- Production monitoring (CloudWatch default logs only)
- Alarms
- WAF
- Backups beyond RDS automated backups (enable 7-day retention)
