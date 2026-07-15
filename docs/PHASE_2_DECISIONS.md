# Phase 2 decisions

Product and architecture decisions for the multi-user milestone.
Recorded here so the reasoning is preserved alongside the code.

---

## Distribution: TestFlight only (for now)

The app will be distributed via Apple TestFlight rather than the public App Store.

**Rationale:** The intended audience is closed — the owner, their partner, and their parents. TestFlight covers this perfectly and skips roughly two weeks of App Store polish work (screenshots, privacy nutrition labels, review wait times, 4K icon variants, etc.). The App Store may follow if the audience grows beyond this household circle, but that decision can be deferred without cost. TestFlight is the correct shape for a personal app with a known, small user base.

**What this means in practice:**
- Users install via a TestFlight invite link (email or URL)
- Builds expire after 90 days — the owner is responsible for re-uploading when needed
- No App Store review process, so shipping cadence is limited only by build time

---

## Sync strategy: refetch on foreground, no real-time

The app will not use WebSockets or server-sent events. Data is fetched on screen focus (already implemented via `useFocusEffect`) and when the app returns to the foreground.

**Rationale:** The core use case is "check the fridge from a grocery store" — one person reads, one person is at home. This is not a collaborative editing scenario where two users are simultaneously modifying the same shelf. A staleness window of 30–60 seconds is entirely acceptable for this use case. WebSocket infrastructure (connection management, reconnect logic, presence, broadcasting) adds significant complexity to both the backend (FastAPI does not handle WebSocket connections the same way) and the frontend with no meaningful UX benefit for the actual usage pattern.

**What this means in practice:**
- Add an `AppState` listener in the root component that calls `refresh()` on the active screen when the app returns from background
- No changes to the backend API shape
- No new infrastructure (no Redis pub/sub, no WebSocket gateway)

---

## Authentication: AWS Cognito

User identity and authentication will be handled by AWS Cognito (User Pools).

**Rationale:** Keeping the AWS-native story consistent is the right call for a portfolio project with a cloud engineering trajectory. Cognito integrates naturally with the existing ECS Fargate + RDS + Secrets Manager stack: the User Pool issues JWTs, the FastAPI backend verifies them using the Cognito JWKS endpoint, and no new third-party SaaS is introduced. Cognito is free up to 50,000 MAUs, which covers this use case indefinitely. The alternatives considered were:

| Option | Why rejected |
|---|---|
| Roll your own (bcrypt + sessions) | More code, more attack surface, no CV value |
| Auth0 / Clerk | Third-party SaaS, breaks the AWS-native story, monthly cost at scale |
| Supabase Auth | Pulls in a Postgres-as-a-service dependency that conflicts with the existing RDS setup |

**What this means in practice:**
- New Terraform resources: `aws_cognito_user_pool`, `aws_cognito_user_pool_client`
- Backend: JWT verification middleware (PyJWT + JWKS caching); `user_id` claim extracted from the token and threaded through as a dependency
- Frontend: Cognito hosted UI or a custom login screen using the Amplify Auth SDK (decision deferred to implementation)
- Data model: `shelves` and `items` gain a `user_id` (or `fridge_id`) foreign key — see Sharing model below

---

## Sharing model: symmetric shared fridge

Both household members have full read/write access to the same fridge entity. There are no roles, no permissions, no owner/member distinction.

**Rationale:** For household use, a permissions model adds UX friction without any practical value. Both users need to add, edit, and delete items. An asymmetric model (owner vs. guest, admin vs. read-only) would require a permissions UI, invitation flows with role selection, and backend enforcement — significant complexity for a two-person household app. If the app later needs "guest" access (e.g., a house-sitter who can only view), that can be revisited with a concrete use case driving the design.

**What this means in practice:**
- The data model gets a `fridges` table (the shared entity): `id`, `name`, `created_at`
- `shelves` gains a `fridge_id` FK instead of a `user_id` FK — this is the correct level of ownership (shelves belong to a fridge, not a user)
- A `fridge_members` join table maps users to fridges: `fridge_id`, `user_id`, `joined_at` — symmetric, no role column
- API authorization: any request must include a valid JWT; the extracted `user_id` must have a row in `fridge_members` for the target fridge
- Invitation flow: simplest viable approach — the owner generates a single-use invite link; the recipient signs up (or logs in) and is added to `fridge_members`
