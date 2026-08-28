# CortexCRM Release Checklist

Copy this file to `RELEASE-<version>.md`, fill in each item with evidence, and get sign-off before deploying.

**Version:** `__VERSION__`  
**Date:** `__DATE__`  
**Approver:** `__NAME__`

---

## Automated Checks (CI must be green)

- [ ] **All CI pipelines green** — GitHub Actions: `backend-test` + `frontend-lint` + `e2e` all green for this commit SHA
  - Evidence: `https://github.com/<repo>/actions/runs/<run_id>`
- [ ] **Backend unit tests pass** — `mvn test` exits 0, 0 failures
  - Evidence: Surefire report artifact from CI run
- [ ] **Frontend type-check + lint pass** — `tsc --noEmit` + ESLint 0 warnings
- [ ] **E2E smoke suite passes** — `npx playwright test --grep @smoke` exits 0
- [ ] **Security scan clean** — OSV-Scanner + Semgrep: 0 high/critical findings
  - Evidence: `security.yml` run artifact

---

## Manual Checks (verify before go)

- [ ] **No open P0/P1 bugs** — GitHub Issues filtered by `priority:P0` and `priority:P1` → 0 open
- [ ] **Flyway migrations tested** — Forward migration runs cleanly on fresh DB; backward migration documented if reversible
- [ ] **Feature flags reviewed** — Document which flags are enabled for this release:
  ```
  Flag: CLAUDE_API_KEY set?  [ ] yes  [ ] no (deterministic fallbacks active)
  ```
- [ ] **Release notes prepared** — CHANGELOG.md updated; summary written for stakeholders
- [ ] **On-call engineer identified** — Name: `__NAME__`, available: `__HOURS__`
- [ ] **Rollback plan documented** — See procedure below

---

## Risk Assessment

- [ ] **Change scope:** `[ ] Small (config/copy)  [ ] Medium (feature/refactor)  [ ] Large (architecture/migration)`
- [ ] **Blast radius:** `__PERCENT__`% of users could be affected if something goes wrong
- [ ] **Revert complexity:** `[ ] < 5 min  [ ] 5-15 min (requires migration)  [ ] > 15 min`

---

## Rollback Procedure

**Automated triggers (rollback without discussion):**

| Metric | Threshold | Action |
|--------|-----------|--------|
| HTTP 5xx rate | > 2× baseline for 5 min | Roll back |
| API p95 latency | > 3× baseline for 5 min | Roll back |
| Synthetic probe | 2 consecutive failures | Investigate; roll back if persists |

**Steps:**
1. **Render backend:** redeploy previous image via Render dashboard → `Deploy > Previous Deploy`
2. **Vercel frontend:** Vercel dashboard → `Deployments > Promote previous`
3. **Flyway:** if migration is irreversible, forward-fix on top of current deploy
4. **Verify:** run smoke suite → `npx playwright test --grep @smoke`
5. **Communicate:** post in `#releases` Slack channel:
   ```
   [Rollback] v{version} — {date} {time}
   Reason: {one line}
   Impact: {users, duration}
   Current state: running v{prev}
   Next steps: {owner} investigating
   ```

---

## Post-Deployment Verification (run immediately after deploy)

```bash
# Health check
curl -s https://<backend>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cortex.com","password":"password123"}' | jq .token

# Smoke suite against production
BASE_URL=https://<frontend> API_URL=https://<backend> \
  npx playwright test --grep @smoke
```

- [ ] Smoke suite exits 0
- [ ] No new error types in logs (check Render logs)
- [ ] Synthetic monitoring shows green within 10 minutes

---

## Sign-Off

| Role | Name | Signature | Timestamp |
|------|------|-----------|-----------|
| Engineer | | | |
| QA | | | |
| On-call | | | |
