# CortexCRM QA Strategy

**Owner:** Engineering Lead  
**Reviewed:** 2026-08-15  
**Next review:** 2026-11-15  
**Revision:** 1.0

---

### 1. Executive Summary

CortexCRM is an AI-powered sales CRM (Spring Boot 3.5 + React 19). This strategy ensures quality across authentication, contact/deal/activity management, and AI analytics (RFM segmentation, churn scoring, sentiment analysis, team insights). The product is deployed on Render (backend) + Vercel (frontend) + Neon (Postgres) + Upstash (Redis).

**Objectives (next two quarters):**
1. Reach 80% unit-test coverage on all backend service classes.
2. E2E smoke suite under 5 minutes on every PR.
3. Reduce defect escape rate to under 5% per release.
4. OWASP Top 10 scan clean on every weekly schedule.
5. Synthetic monitoring probes running every 5 minutes in production.

---

### 2. Test Levels & Types

| Level | What It Validates | Owner | Framework | Target Count | Frequency |
|-------|-------------------|-------|-----------|-------------|-----------|
| **Unit** | Service logic, RFM scoring, JWT, SqlGuard | Developers | JUnit 5 + Mockito | 80%+ service coverage | Every commit |
| **Integration** | Flyway migrations, JPA repos, Spring Security | Developers | Testcontainers + MockMvc | All API endpoints | Every PR |
| **E2E** | Critical user journeys through full stack | QA | Playwright | Auth, contacts, deals, dashboard | Every PR |
| **Visual** | Dashboard layout, card rendering | QA | Playwright `toHaveScreenshot` | Key pages | Nightly |
| **Performance** | API p95 latency, throughput, recovery | DevOps | k6 | All analytics endpoints | Nightly |
| **Security** | OWASP Top 10, auth edge cases | All | Semgrep + ZAP + Playwright | All categories mapped | Weekly + PR |
| **Synthetic** | Production flows continuously | DevOps | Playwright (cron) | Login + API health | Every 5 min |
| **Accessibility** | WCAG 2.2 AA | Frontend | axe-core + Playwright | Key pages | Nightly |

---

### 3. Test Pyramid Analysis

**Current shape (baseline):**
- Unit: ~21 tests (backend) — 45%
- Integration: ~5 tests (MockMvc/Testcontainers) — 11%
- E2E: ~25 tests (Playwright) — 53%
- Visual/Perf/Security: 0 → being added now

**Assessment:** Slight ice-cream-cone risk due to low unit count. The backend service layer is well-tested (21 tests, AnalyticsService×14), but contact/deal CRUD services lack coverage.

**Target ratios:**
- Unit: 70% (~60 tests)
- Integration: 20% (~18 tests)
- E2E: 10% (~10 critical-path tests)
- Perf/Security/Visual: additive

**Action plan:**
1. Freeze E2E growth — new features get unit tests first.
2. Add ContactService + DealService + ActivityService unit tests (next sprint).
3. CI gate: fail PR if unit test count drops below 40.

---

### 4. Risk Assessment Matrix

| Feature Area | Impact (1-5) | Likelihood (1-5) | Score | Testing Approach |
|-------------|-------------|-----------------|-------|-----------------|
| Authentication / JWT | 5 | 2 | 10 — HIGH | Unit (JwtUtil) + E2E negative + Security Playwright |
| Contacts CRUD | 3 | 3 | 9 — MED | Unit + Integration MockMvc + E2E happy path |
| Deals pipeline | 4 | 2 | 8 — MED | Unit + Integration + E2E |
| RFM analytics SQL | 4 | 2 | 8 — MED | Unit (AnalyticsService×14) |
| Churn/Risk scoring | 3 | 2 | 6 — MED | Unit (existing) |
| SqlGuard (AI queries) | 5 | 2 | 10 — HIGH | Unit (SqlGuardTest) — injection prevention |
| Sentiment/Intent (Claude) | 3 | 3 | 9 — MED | Unit with mocked ClaudeClient |
| Dashboard rendering | 2 | 3 | 6 — MED | Visual regression + smoke E2E |
| Flyway migrations | 4 | 2 | 8 — MED | Testcontainers integration |

---

### 5. Environment Strategy

| Environment | Purpose | Test Types | Data | Trigger |
|------------|---------|------------|------|---------|
| **Local** | Developer feedback | Unit, integration | Seeded (V9 migration) | On save |
| **CI** | Automated validation | Unit, integration, E2E | Ephemeral Postgres via Docker | Every push/PR |
| **Staging** | Pre-release validation | E2E, smoke, security | Anonymized seed | On merge to main |
| **Production** | Continuous monitoring | Synthetic probes | Live (synthetic accounts) | Every 5 min |

---

### 6. Tool Selection Rationale

| Tool | Layer | Reason |
|------|-------|--------|
| JUnit 5 + Mockito | Unit | Already in `spring-boot-starter-test`; zero config |
| Testcontainers | Integration | Real Postgres for Flyway + JPA tests |
| Playwright 1.60 | E2E + Visual + Security | TypeScript, auto-wait, built-in screenshots, no flakiness traps |
| k6 v2 | Performance | JS-native, threshold-based CI gating, free OSS |
| OSV-Scanner | Supply chain | Multi-language, exits non-zero on any vuln |
| Semgrep `p/owasp-top-ten` | SAST | Rules maintained by Semgrep, OWASP-mapped |
| OWASP ZAP | DAST | Industry standard, baseline scan in CI, free |
| GitHub Actions | CI/CD | Already in repo; sharding + caching built in |

---

### 7. CI Scaling Levers

- **Sharding:** 4 Playwright shards across CI matrix jobs (PR workflow)
- **Browser caching:** `~/.cache/ms-playwright` cached by lockfile hash
- **Test impact:** run `--grep @smoke` for post-deploy smoke; full suite nightly
- **Concurrency cancel:** `cancel-in-progress: true` on all PR/branch workflows
- **Split:** backend tests in separate job from E2E; both run in parallel

---

### 8. Entry/Exit Criteria

**Unit:** Entry: code compiles. Exit: all branches covered on new logic, no skipped tests.

**Integration:** Entry: unit tests pass. Exit: all API endpoints tested (200 + 4xx), Flyway migrates cleanly.

**E2E:** Entry: integration tests pass. Exit: all @smoke tests pass, auth/contacts/dashboard journeys green.

**Release:** Entry: all test levels green, no open P0/P1. Exit: smoke passes in staging, synthetic monitoring shows green for 15 minutes post-deploy.

---

### 9. Quality Gates & Definition of Done

**PR gate (every PR):**
- Backend: `mvn test` passes
- Frontend: `tsc --noEmit` + ESLint pass
- Security: OSV-Scanner + Semgrep clean on high/critical
- E2E smoke: @smoke tests pass

**Merge gate (merge to main):**
- All PR gate checks pass
- Full E2E (chromium) green

**Deploy gate (before production):**
- Staging smoke suite green
- No P0/P1 open bugs
- Go/no-go checklist signed off

**Nightly:**
- Full E2E (chromium + firefox)
- k6 baseline load test (thresholds green)
- Weekly security scan

---

### 10. Metrics & KPIs

| Metric | Target | Cadence |
|--------|--------|---------|
| Backend unit coverage (services) | ≥ 80% | Per PR |
| Test pyramid ratio | 70:20:10 unit:integration:E2E | Monthly |
| Flakiness rate | < 2% | Weekly |
| Defect escape rate | < 5% per release | Per release |
| CI pipeline duration (PR) | < 15 min | Weekly |
| Security scan: high/critical vulns | 0 open | Weekly |
| Synthetic probe uptime | ≥ 99.9% | Monthly |
| E2E smoke pass rate | 100% (blocking) | Per deploy |
| MTTR (P0 incident) | < 4 hours | Per incident |

---

### 11. Timeline & Milestones

**Phase 1 — Foundation (done):**
- Backend unit tests: 21 tests, AnalyticsService, InsightService, TeamInsightService, Auth, AI ✓
- E2E framework: Playwright config, auth/contacts/dashboard/security tests ✓
- CI workflows: ci.yml, nightly.yml, security.yml ✓
- Synthetic monitoring: login probe + API health probe ✓

**Phase 2 — Coverage Expansion (next sprint):**
- Add ContactService, DealService, ActivityService unit tests
- Integration tests: MockMvc for all AnalyticsController endpoints
- Visual regression baselines (run `--update-snapshots` after stable UI)
- Performance budgets tuned from first k6 baseline run

**Phase 3 — Quality Gates (sprint +2):**
- Coverage threshold enforced in Maven Surefire
- Branch protection: `backend-test`, `frontend-lint`, `e2e` as required checks
- OWASP coverage document kept current

**Phase 4 — Optimization (sprint +3):**
- Fix any flaky E2E tests (quarantine `@flaky` tag)
- Review CI duration; adjust shard count if > 15 min
- First quarterly strategy review

---

### 12. Risk Register

| Risk | Mitigation |
|------|-----------|
| Render free tier cold starts slow CI | Use staging-specific smoke suite with longer timeouts |
| Neon connection limits | Use connection pooling; Testcontainers for CI (not Neon) |
| Claude API key absent in CI | Deterministic fallbacks in InsightService/BriefingService |
| Playwright baselines diverge per OS | Generate baselines in consistent Docker image (see visual-testing skill) |
| k6 stress test hits CI runner limits | Run soak/stress only on `workflow_dispatch`, not nightly |

---

### 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-15 | CortexCRM Team | Initial strategy — all 10 QA deliverables |
