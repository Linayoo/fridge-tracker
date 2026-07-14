# Known Issues

Tracked limitations from week 2 smoke testing. None of these are blockers for the meetup demo.

---

## Double-fetch on cold start (home and shelf screens)

`useShelves` and `useItems` each trigger a `refresh()` on mount via an internal `useEffect`. Both `HomeScreen` and `ShelfScreen` also call `refresh()` immediately on first focus via `useFocusEffect`. This means two identical API requests fire in quick succession on cold start. The result is correct (second response overwrites the first with identical data), but the extra round trip is wasteful. Fix: remove the `useEffect` from both hooks and rely solely on `useFocusEffect` in the screens — but that couples hook behaviour to navigation lifecycle. Defer until the pattern is clear.

## Title flicker after shelf rename (ShelfScreen)

`ShelfScreen` initialises its navigation title from `route.params.shelfName` (the name at the time of navigation), then corrects it once the shelf fetch resolves. After renaming a shelf in `ShelfFormScreen` and navigating back, the old name is briefly visible in the header before the refresh completes. The fix (always derive title from the fetch, never from route params) trades the flicker for a brief blank title on first load. Neither is ideal; defer until a proper loading skeleton is added.

## No visual feedback after moving an item between shelves

When a user moves an item from Shelf A to Shelf B using the shelf picker in `ItemFormScreen`, `goBack()` returns them to `ShelfScreen` for Shelf A. The item silently disappears from the list (correct behaviour), but there is no confirmation that the move succeeded. Users may believe the edit failed. Fix: a brief toast or `Alert` after a successful move naming the destination shelf. Defer to a UX polish pass.

---

## No HTTPS on production ALB

Requests from the app to the production API are plain HTTP. The ALB listener is HTTP:80 only. Fix: provision an ACM certificate for the custom domain, add an HTTPS:443 listener to the ALB, and add an HTTP→HTTPS redirect rule. Planned for Week 4 if time permits. In the meantime, avoid sending sensitive data (not a concern for v1 — no auth, no PII).

## No CI/CD pipeline

Deploys are manual: `docker buildx build` → `docker push` → `aws ecs update-service --force-new-deployment`. GitHub Actions with OIDC role assumption (no long-lived AWS keys stored in GitHub) is the planned follow-up. Until then, deploying requires AWS CLI access and the account credentials configured locally.

## ECR tag immutability disabled

The `fridge-tracker-api` ECR repository has tag immutability turned off. Pushing to `:latest` silently overwrites the previous image, making it impossible to roll back to a specific prior image by tag. Fix: re-enable immutability and switch to SHA-based tags (`:$GIT_SHA`) once CI/CD is in place to generate them consistently. Tracked alongside the CI/CD gap.

## Parallel deployment: click-built + Terraform-managed

The Week 3 click-built AWS infrastructure (`fridge-tracker-*`) and the newly-added Terraform-managed infrastructure (`fridge-tracker-tf-*`) are currently running in parallel. Both are healthy and serving traffic on separate ALB URLs.

Total burn rate: ~$84/mo (roughly $42/mo per deployment).

Path to reduce back to ~$42/mo (planned for the next Terraform session):
1. Update the frontend `EXPO_PUBLIC_API_URL` to the Terraform ALB URL
2. Verify the app works end-to-end on device against the Terraform deployment
3. Delete the click-built resources in reverse dependency order: ECS service, cluster, ALB, target group, RDS, ECR, Secrets Manager, IAM roles, security groups
4. Optionally rename the Terraform resources to drop the `-tf` suffix (via `terraform state mv` + `apply`)

Reason for the parallel period: Path B (rebuild + cutover) was chosen over Path A (terraform import) because it teaches Terraform properly and avoids risky imports. The tradeoff is a short window of double cost, which is well within available AWS credits ($99.95 remaining as of last check).
