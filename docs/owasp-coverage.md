# OWASP Top 10 (2025) Coverage

Every OWASP category is mapped to at least one test or a documented mitigation. Categories with no automated test have a justification.

| # | Category | Test Location | Status |
|---|----------|---------------|--------|
| A01 | Broken Access Control | `e2e/tests/security/security.spec.ts` — A01 describe block (4 tests: unauthenticated GET /contacts, /analytics/rfm, /users, /audit all return 401/403) | ✅ Automated |
| A02 | Security Misconfiguration | `e2e/tests/security/security.spec.ts` — A02 describe block (stack trace not exposed, no internal info in errors) | ✅ Automated |
| A03 | Software Supply Chain Failures | `.github/workflows/security.yml` — OSV-Scanner gate (exits non-zero on any vuln); `pnpm install --frozen-lockfile` enforced in all CI jobs | ✅ CI gate |
| A04 | Cryptographic Failures | `e2e/tests/security/security.spec.ts` — A04 describe block (password not echoed, JWT structure valid) + `JwtUtilTest.java` (tampered/expired rejected) | ✅ Automated |
| A05 | Injection | `e2e/tests/security/security.spec.ts` — A05 describe block (SQL injection in login, XSS in search); `SqlGuardTest.java` (SELECT-only, forbidden keywords) | ✅ Automated |
| A06 | Insecure Design | `e2e/tests/security/security.spec.ts` — A06 describe block (10 rapid failed logins — none return 200) | ✅ Automated |
| A07 | Authentication Failures | `e2e/tests/security/security.spec.ts` — A07 describe block (tampered JWT, alg:none JWT, no token — all 401/403); `JwtUtilTest.java` | ✅ Automated |
| A08 | Software or Data Integrity Failures | No automated test. Mitigation: CSP header to be added in V10 migration. Tracked as backlog item. | ⚠️ Accepted risk (tracked) |
| A09 | Security Logging and Alerting Failures | No automated test. Mitigation: Spring Security logs failed auth; Sentry integration planned for production. | ⚠️ Accepted risk (tracked) |
| A10 | Mishandling of Exceptional Conditions | `e2e/tests/security/security.spec.ts` — A10 describe block (404 no internals, malformed JSON 400/415/422) | ✅ Automated |

## Verification Command

```bash
# Confirm all automated tests reference OWASP categories
grep -n "^test.describe" cortex-frontend/e2e/tests/security/security.spec.ts

# Confirm OSV-Scanner is wired in CI
grep -n "osv-scanner" .github/workflows/security.yml

# Confirm no real secrets in test files
grep -rn "AKIA\|sk-\|ghp_\|eyJhbGci" cortex-frontend/e2e/ load-tests/ synthetic/
```

## A08/A09 Backlog Items

- **A08**: Add `Content-Security-Policy` header in Spring Security config (removes `unsafe-inline` risk)
- **A09**: Add Sentry SDK to frontend; configure alerting for `auth.failure.threshold > 10/min`

Both are tracked in GitHub Issues with label `security-backlog`.
