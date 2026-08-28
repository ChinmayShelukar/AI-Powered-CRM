# QA Project Context — CortexCRM

Used by AI test generation, bug triage, and CI tooling to avoid re-deriving project structure each session.

---

## Stack

| Layer | Tech | Version |
|-------|------|---------|
| Backend | Spring Boot | 3.5 |
| Language | Java | 21 |
| Frontend | React + Vite + TypeScript | 19 / 5.x |
| Database | Postgres | 16 (Neon free tier in prod) |
| Cache | Redis | (Upstash in prod; optional — app boots without it) |
| E2E | Playwright | 1.60 |
| Load | k6 | v2 |
| CI | GitHub Actions | — |

---

## Auth

- Admin: `admin@cortex.com` / `password123` (role: ADMIN)
- Sales rep: `rep@cortex.com` / `password123` (role: SALES_REP)
- JWT returned from `POST /api/auth/login` as `{ token: "..." }`
- Synthetic monitoring uses `SYNTHETIC_EMAIL` / `SYNTHETIC_PASSWORD` from GitHub secrets

---

## API endpoints

| Path | Method | Auth | Notes |
|------|--------|------|-------|
| `/api/auth/login` | POST | No | Returns JWT |
| `/api/auth/register` | POST | No | — |
| `/api/contacts` | GET/POST | Yes | Paginated |
| `/api/contacts/{id}` | GET/PUT/DELETE | Yes | — |
| `/api/deals` | GET/POST | Yes | — |
| `/api/activities` | GET/POST | Yes | — |
| `/api/analytics/rfm` | GET | Yes | RFM segments |
| `/api/analytics/risk` | GET | Yes | Churn radar |
| `/api/analytics/deal-health` | GET | Yes | Deal scoring |
| `/api/analytics/team-insights` | GET | Yes | Manager narrative |
| `/api/analytics/briefing` | GET | Yes | Daily agent trace |
| `/api/ai/query` | POST | Yes | NL SQL via SqlGuard |
| `/api/ai/summarize` | POST | Yes | Contact summary |
| `/api/ai/email` | POST | Yes | Email draft |
| `/api/users` | GET | ADMIN | User list |
| `/api/audit` | GET | ADMIN | Audit log |

---

## Test frameworks

| Layer | Framework | Location |
|-------|-----------|----------|
| Backend unit | JUnit 5 + Mockito | `cortex-backend/src/test/java/com/cortexcrm/` |
| E2E | Playwright 1.60 | `cortex-frontend/e2e/` |
| Load | k6 v2 | `load-tests/` |
| Synthetic | Playwright | `synthetic/` |

---

## Test file structure

```
cortex-frontend/e2e/
  global-setup.ts          # login → .auth/user.json
  global-teardown.ts
  pages/                   # Page Object Model
    login.page.ts
    dashboard.page.ts
    contacts.page.ts
  tests/
    auth/login.spec.ts
    dashboard/dashboard.spec.ts
    contacts/contacts.spec.ts
    security/security.spec.ts    # OWASP A01-A10
    visual/dashboard.visual.spec.ts
    smoke/smoke.spec.ts          # @smoke tag, runs on every deploy
```

---

## Selector strategy

- Prefer `getByRole` (semantic, accessible)
- Prefer `getByLabel` for form fields
- `getByPlaceholder` for search inputs
- `getByTestId` only when role/label not available
- Never CSS class selectors (fragile to refactor)

---

## Test tags

| Tag | Meaning | Where run |
|-----|---------|-----------|
| `@smoke` | Critical path, must pass post-deploy | Every PR + post-deploy |
| `@visual` | Visual regression | Nightly |
| `@flaky` | Quarantined; non-blocking | Nightly separate job |
| No tag | Standard E2E | Every PR (sharded) |

---

## Component ownership

| Component | Owner | Test file |
|-----------|-------|-----------|
| auth | backend | `tests/auth/`, `JwtUtilTest.java`, `AuthServiceTest.java` |
| contacts | backend+frontend | `tests/contacts/`, `ContactServiceTest.java` |
| analytics | backend | `AnalyticsServiceTest.java` |
| dashboard-ui | frontend | `tests/dashboard/`, `tests/visual/` |
| ai-safety | backend | `SqlGuardTest.java` |
| briefing-agent | backend | `BriefingServiceTest.java` |
| team-insights | backend | `TeamInsightServiceTest.java` |

---

## Known risk areas

1. **Auth/JWT** — highest security impact; tampered + alg:none attacks tested explicitly
2. **SqlGuard** — blocks non-SELECT SQL in AI query path; any regression allows SQL injection
3. **Claude API absent** — `InsightService`, `TeamInsightService`, `BriefingService` all have deterministic fallbacks; tests should cover both paths
4. **Neon cold start** — first backend request after inactivity is slow (~3s); synthetic probes have 15s budget
5. **Render cold start** — free tier spins down; smoke suite uses `retries: 2` in CI config

---

## CI pipelines

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/ci.yml` | Push/PR | Backend unit + frontend lint + E2E (4 shards) |
| `.github/workflows/nightly.yml` | 2am daily | Full E2E (chromium+firefox) + k6 baseline + flaky quarantine |
| `.github/workflows/security.yml` | Weekly + PR | TruffleHog + OSV-Scanner + Semgrep + ZAP + Playwright security tests |
| `.github/workflows/synthetic-monitoring.yml` | Every 5 min | Login + API health probes |

---

## Team maturity

**growing** — separate jobs for unit/integration/E2E, sharded Playwright, artifact uploads, flaky quarantine active. Aiming for established tier by Q4 2026.

---

## OWASP coverage

See `docs/owasp-coverage.md` for full A01-A10 mapping.

A08 (CSP header) and A09 (Sentry alerting) are accepted risk, tracked in backlog.
