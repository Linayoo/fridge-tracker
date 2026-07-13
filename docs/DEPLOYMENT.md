# Deployment

## Architecture

```
              Internet
                  │ HTTP :80
                  ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │  AWS eu-central-1  ·  VPC (default, 172.31.0.0/16)                 │
    │                                                                     │
    │  ┌──────────────────────────────────────────────────────────────┐   │
    │  │ ALB: fridge-tracker-alb (internet-facing)                    │   │
    │  │ SG: fridge-tracker-alb-sg  (inbound 0.0.0.0/0 :80)          │   │
    │  └──────────────────────────────────────────────────────────────┘   │
    │                    │ HTTP :8000                                      │
    │                    ▼                                                 │
    │  ┌──────────────────────────────────────────────────────────────┐   │
    │  │ Target Group: fridge-tracker-tg                              │   │
    │  │ (IP target type, /healthz health check)                      │   │
    │  └──────────────────────────────────────────────────────────────┘   │
    │                    │                                                 │
    │                    ▼                                                 │
    │  ┌──────────────────────────────────────────────────────────────┐   │
    │  │ ECS Cluster: fridge-tracker-cluster                          │   │
    │  │ Fargate Task: fridge-tracker-api  (FastAPI, port 8000)       │   │
    │  │ SG: fridge-tracker-task-sg  (inbound :8000 from ALB SG)     │   │
    │  └──────────────────────────────────────────────────────────────┘   │
    │                    │ TCP :5432                                       │
    │                    ▼                                                 │
    │  ┌──────────────────────────────────────────────────────────────┐   │
    │  │ RDS: fridge-tracker-db  (Postgres 16, db.t4g.micro)          │   │
    │  │ SG: fridge-tracker-db-sg  (inbound :5432 from task SG)       │   │
    │  └──────────────────────────────────────────────────────────────┘   │
    │                                                                     │
    │  ECR: fridge-tracker-api              CloudWatch: /ecs/fridge-…     │
    │  Secrets Manager: fridge-tracker/db-credentials                     │
    └─────────────────────────────────────────────────────────────────────┘
                  ▲
                  │ HTTP (phone on any network)
                  │
       ┌──────────┴──────────┐
       │  Expo app on phone  │
       └─────────────────────┘
```

## Component inventory

Every AWS resource currently deployed:

| Category | Resource | Details |
|---|---|---|
| **IAM** | `fridge-tracker-cli` | IAM user for local CLI operations (ECR push, ECS describe) |
| | `fridge-tracker-task-execution-role` | ECS task execution role — pulls images from ECR, injects secrets |
| | `fridge-tracker-task-role` | ECS task role — runtime permissions for the running container |
| | `AWSServiceRoleForECS` | AWS-managed service-linked role for ECS |
| **VPC** | Default VPC | `172.31.0.0/16` in eu-central-1, three public subnets (1a, 1b, 1c) |
| **Security groups** | `fridge-tracker-alb-sg` | ALB: inbound :80 from `0.0.0.0/0` |
| | `fridge-tracker-task-sg` | Task: inbound :8000 from `fridge-tracker-alb-sg` |
| | `fridge-tracker-db-sg` | RDS: inbound :5432 from `fridge-tracker-task-sg` |
| **RDS** | `fridge-tracker-db` | Postgres 16, db.t4g.micro, Single-AZ, gp3 20 GiB, deletion protection ON |
| **ECR** | `fridge-tracker-api` | Container image repository, tag immutability OFF (dev mode) |
| **Secrets Manager** | `fridge-tracker/db-credentials` | JSON with `username`, `password`, `host`, `dbname` |
| **ECS** | `fridge-tracker-cluster` | ECS cluster (Fargate capacity provider) |
| | `fridge-tracker-api` task definition | Task family; 0.25 vCPU, 0.5 GB RAM; references ECR image and secret ARN |
| | `fridge-tracker-api-service` | ECS service; 1 desired task; ECS Exec enabled |
| **Load balancing** | `fridge-tracker-alb` | Internet-facing ALB; HTTP:80 only (no TLS yet) |
| | `fridge-tracker-tg` | Target group; IP target type; /healthz health check |
| **Observability** | `/ecs/fridge-tracker-api` | CloudWatch Log Group; container stdout/stderr |

## Deployment concepts

This section explains the infrastructure in request-flow order — the mental model needed to understand why each piece exists.

### VPC

A Virtual Private Cloud is an isolated network in AWS. All resources in this project live in the **default VPC** (`172.31.0.0/16`) in `eu-central-1`. Using the default VPC was a deliberate MVP shortcut — it comes pre-configured with an internet gateway and public subnets, so there's no network plumbing to set up before getting something running. Production-grade deployments would use a dedicated VPC with separate public and private subnet tiers, but the default VPC is entirely appropriate for a demo-stage project.

### Subnets and Availability Zones

A subnet is a subdivision of a VPC tied to a single Availability Zone (a physically separate data centre within a region). This project uses three public subnets — one in each of eu-central-1a, 1b, and 1c. The ALB spans all three so AWS can route around a zone failure; the Fargate task currently runs in whichever zone ECS picks. A hardened production setup would put the task and RDS in **private** subnets (no direct internet route) with a NAT gateway for outbound calls. That's planned but not part of MVP.

### Security groups

Security groups are stateful firewalls attached to individual resources (not to subnets). The important pattern here is **SG-to-SG referencing**: instead of allowing traffic from a specific IP address, we allow traffic from another security group. This means:

- `fridge-tracker-task-sg` allows inbound on port 8000 **from `fridge-tracker-alb-sg`** — only the ALB can reach the task, regardless of what IP the ALB uses internally.
- `fridge-tracker-db-sg` allows inbound on port 5432 **from `fridge-tracker-task-sg`** — only the Fargate task can reach the database. Not the ALB, not the internet, not your laptop.

This is the correct pattern. Allowing `0.0.0.0/0` to RDS (a common dev shortcut) means the database is internet-accessible with only the password standing between it and the world.

### Application Load Balancer

The ALB is a layer-7 (HTTP/HTTPS-aware) load balancer sitting in front of the Fargate task. It:
- Accepts requests on port 80 from any IP
- Forwards them to the Target Group on port 8000
- Runs health checks against `/healthz` every 30 seconds; unhealthy targets are drained from rotation

TLS termination is the intended pattern — ACM certificate provisioned on the ALB, HTTPS:443 listener, HTTP:80 redirects to HTTPS. Not implemented yet; see Known gaps.

### Target Group

The Target Group is a collection of backend endpoints the ALB routes to. This project uses **IP target type**, which means ECS registers the Fargate task's private IP address directly (rather than an EC2 instance). When ECS starts a new task, it automatically registers its IP. When a task stops, ECS deregisters it. This makes deployments seamless: new task comes up, passes health checks, old task drains and stops.

Health check config: `GET /healthz`, threshold 2 healthy / 3 unhealthy, interval 30s, timeout 5s.

### Fargate

Fargate is the serverless compute mode for ECS. "Serverless" here means you don't provision or manage EC2 instances — you declare CPU and memory, and AWS runs your container on infrastructure it manages. The alternative is ECS on EC2, where you manage a fleet of EC2 instances as container hosts. Fargate is the right choice for a low-traffic demo app: no instance management, no patching, scale-to-zero possible.

Current task size: 0.25 vCPU, 0.5 GB RAM. Appropriate for FastAPI handling dozens of requests per day.

### IAM roles: the two-role pattern

ECS tasks use two separate IAM roles, not one.

**Task execution role** (`fridge-tracker-task-execution-role`): used by the ECS agent to set up the task. Needs ECR pull permission (to download the image), Secrets Manager read permission (to inject the DB secret as an environment variable), and CloudWatch Logs permission (to ship container output). The running application never uses this role.

**Task role** (`fridge-tracker-task-role`): used by the running application. Currently minimal — the app reads its DB credentials from an environment variable (already injected at startup), so no extra AWS permissions are needed at runtime. If the app later needed to call S3 or SQS, those permissions would go on the task role, not the execution role.

The principle: execution role = agent setup permissions; task role = application runtime permissions. Mixing them grants the running code more privilege than it needs.

### Secrets Manager

The database password lives in Secrets Manager under `fridge-tracker/db-credentials` as a JSON blob. The task definition references the secret's ARN. At task startup, the ECS agent (using the execution role) fetches the secret and injects `DATABASE_URL` as an environment variable. The application code never calls Secrets Manager directly — it reads `DATABASE_URL` from the environment, just as in local dev.

Why not just put the password in an ECS environment variable? Environment variables in task definitions are stored in plaintext in the ECS console and CloudTrail logs. Secrets Manager encrypts the value at rest, rotates on request, and scopes access via IAM. The operational overhead is a few extra lines of task definition JSON — worth it.

### Shared responsibility model

AWS manages the physical infrastructure, the hypervisor, the Fargate runtime, and RDS up through the database engine. We are responsible for everything above that: the container image, the application code, the Postgres schema and data, the IAM policies, the security group rules, the task definition configuration, and the network exposure decisions (e.g., making the ALB internet-facing). A misconfigured security group or an overly permissive IAM policy is our problem, not AWS's. The flip side: a hardware failure in the data centre is AWS's problem, not ours.

## Cost breakdown

Approximate monthly cost at MVP scale (~10 req/day, 1 task always running):

| Resource | Monthly cost |
|---|---|
| ECS Fargate (0.25 vCPU × 0.5 GB RAM × ~730 hrs) | ~$9 |
| ALB (hourly minimum + LCU) | ~$16 |
| RDS db.t4g.micro (Single-AZ) | ~$13 |
| RDS storage (gp3, 20 GiB) | ~$2 |
| ECR (storage + data transfer) | <$1 |
| Secrets Manager | <$1 |
| CloudWatch Logs | <$1 |
| **Total** | **~$42/month** |

AWS credits available: **$99.95**. At current burn rate, credits cover ~2.5 months.

The ALB is the largest line item because it has a fixed hourly cost (~$0.022/hr in eu-central-1) regardless of traffic. App Runner was cheaper for this traffic profile, but App Runner closed to new customers on April 30, 2026.

## Redeploy workflow

To push a new version of the API:

```bash
# 1. Authenticate Docker with ECR
aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin \
    <account-id>.dkr.ecr.eu-central-1.amazonaws.com

# 2. Build for linux/amd64 — required for Fargate; Apple Silicon defaults to arm64.
#    --provenance=false --sbom=false: suppress OCI attestation manifests that
#    confuse older ECR clients.
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  -t <account-id>.dkr.ecr.eu-central-1.amazonaws.com/fridge-tracker-api:latest \
  backend/

# 3. Push the image
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/fridge-tracker-api:latest

# 4. Force ECS to pull the new :latest and roll a new task
aws ecs update-service \
  --cluster fridge-tracker-cluster \
  --service fridge-tracker-api-service \
  --force-new-deployment \
  --region eu-central-1
```

ECS starts a new Fargate task, waits for it to pass the ALB health check (`/healthz`), then drains and stops the old task. Zero downtime for additive changes. Total rollout time: ~2–3 minutes.

Alembic migrations run automatically at task startup (`alembic upgrade head` in the entrypoint script), so schema changes are applied before the new task starts accepting traffic.

## Known deployment gaps

| Gap | Status |
|---|---|
| **No HTTPS** | ALB listener is HTTP:80 only. ACM certificate + HTTPS:443 listener + HTTP→HTTPS redirect is the fix. Planned for Week 4 if time permits. |
| **No custom domain** | Traffic goes to the ALB's auto-assigned DNS name (e.g. `fridge-tracker-alb-123456789.eu-central-1.elb.amazonaws.com`). Route 53 hosted zone + A record alias would fix this. Planned post-demo. |
| **No CI/CD** | Deploys are manual (the four commands above). GitHub Actions with OIDC role assumption is the planned follow-up — no long-lived AWS keys in GitHub. |
| **ECR tag immutability off** | `:latest` is mutable — a push overwrites the tag silently. Re-enable immutability with SHA-based tags (`:<git-sha>`) once CI/CD is in place to generate them. |
| **Tasks have public IPs** | Fargate tasks in the default VPC's public subnets are assigned public IPs. The task SG prevents inbound access (only the ALB can reach port 8000), so this is not a security hole, but production-shape would use private subnets with a NAT gateway for outbound calls (e.g., Secrets Manager) and VPC endpoints instead. |

## Future work

### Terraform

The entire ECS deployment — VPC, security groups, RDS, ECR, ECS cluster + service + task definition, ALB, target group, IAM roles, Secrets Manager secret — could be captured in approximately 200 lines of Terraform HCL. The intended file layout:

```
infra/
├── main.tf          # provider, backend config
├── variables.tf     # region, account ID, image tag, DB name
├── network.tf       # VPC, subnets, security groups
├── iam.tf           # execution role, task role, policies
├── rds.tf           # RDS instance, subnet group, parameter group
├── ecs.tf           # cluster, task definition, service
├── alb.tf           # ALB, listener, target group
└── outputs.tf       # ALB DNS name, ECR URL, RDS endpoint
```

This is a planned follow-up project, not part of v1. Purpose: reproducibility (recreate the full stack in a new account in minutes), code review (infrastructure changes go through PRs like code), and disaster recovery (rebuild from scratch if the account is compromised).

### Other future work

- ACM certificate + HTTPS listener on the ALB
- Route 53 custom domain
- GitHub Actions CI/CD with OIDC role assumption
- Private subnets + NAT gateway for the Fargate task
- CloudWatch alarms on 5xx rate and task CPU
- RDS Multi-AZ (not needed for a personal app, but one checkbox for production-shape)
- RDS automated snapshot retention policy review (default 7 days — adequate)

## Historical note

Week 3 originally targeted AWS App Runner (per this doc's earlier revision). App Runner closed to new customers on April 30, 2026, so we pivoted to ECS Fargate. The trade-off: ECS is 3–4× more setup work but is the AWS-recommended container platform going forward, and carries stronger signal on a cloud engineering CV.
