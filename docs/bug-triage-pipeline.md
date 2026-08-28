# Bug Triage Pipeline — CortexCRM

Hybrid pipeline: deterministic fingerprinting for deduplication, LLM assist for classification and ticket generation.

---

## Pipeline Overview

```
CI Failure / Error Report
  │
  ▼
1. NORMALIZE — strip timestamps, PIDs, UUIDs, ports
  │
  ▼
2. FINGERPRINT — SHA-256 of stable anchors
  │
  ▼
3. DEDUPLICATE — exact match or similarity > 0.75
  │
  ▼
4. CLASSIFY — failure category + severity (LLM assist)
  │
  ▼
5. TICKET — generate GitHub Issue from template
  │
  ▼
6. HUMAN APPROVAL — review before create/close/merge
```

---

## Severity / Priority Matrix

| | Critical | Major | Minor | Trivial |
|---|---------|-------|-------|---------|
| **All users** | P0 | P0 | P1 | P2 |
| **>10% users** | P0 | P1 | P2 | P3 |
| **<10% users** | P1 | P1 | P2 | P3 |
| **Edge case** | P1 | P2 | P3 | P3 |

**Severity definitions:**
- **Critical:** system unusable, data loss, auth bypass
- **Major:** core feature broken (contacts list fails, deals pipeline broken)
- **Minor:** non-core feature degraded (sorting, secondary action)
- **Trivial:** cosmetic only

---

## Failure Categories

| Category | Description | Action |
|----------|-------------|--------|
| `application-bug` | App code is broken | File bug ticket |
| `test-bug` | Test is wrong | Fix test, no app change |
| `environment-issue` | CI infra / Neon / Redis down | Retry, notify infra |
| `flaky-test` | Non-deterministic failure | Quarantine with `@flaky` tag |
| `build-failure` | Compile / dep error | Fix build, blocks all |

---

## Normalization Rules

Strip in order before fingerprinting:
1. ANSI codes: `\x1b\[[0-9;]*m` → `""`
2. Timestamps: ISO date patterns → `"<TIMESTAMP>"`
3. UUIDs: `[0-9a-f]{8}-...-[0-9a-f]{12}` → `"<UUID>"`
4. PIDs: `pid[=: ]\d+` → `"pid=<PID>"`
5. Ports: `:\d{4,5}` → `":<PORT>"`
6. Request IDs: correlation-id patterns → `"<REQ_ID>"`
7. Memory addresses: `0x[0-9a-f]{8,16}` → `"<ADDR>"`

---

## Fingerprint Stable Anchors

| Anchor | Stability |
|--------|-----------|
| Exception type | Very high |
| Error message template | High |
| Top 3 stack frames (function names, no line numbers) | High |
| Test name | Very high |
| HTTP status code | Very high |

**Algorithm:** sort anchors alphabetically → concatenate with `|` → SHA-256 → first 16 hex chars.

---

## Triage Script

Use `scripts/triage-bug.js` for automated fingerprinting + GitHub issue creation:

```bash
# Triage a CI failure log
node scripts/triage-bug.js --log path/to/failure.log --repo owner/repo

# Triage from stdin
cat test-results/junit.xml | node scripts/triage-bug.js --repo owner/repo
```

Requires: `GITHUB_TOKEN` env var for issue creation.

---

## GitHub Issue Labels

All bug reports get these labels automatically:
- `bug` — always
- `severity:critical|major|minor|trivial`
- `priority:P0|P1|P2|P3`
- `category:application-bug|test-bug|environment-issue|flaky-test|build-failure`
- `fingerprint:<16-char-hash>`
- `component:<inferred from stack>`

---

## Known Component Mapping

| Stack frame pattern | Component | Owner |
|---------------------|-----------|-------|
| `AnalyticsService` | analytics | backend |
| `InsightService` | sentiment | backend |
| `BriefingService` | briefing-agent | backend |
| `TeamInsightService` | team-insights | backend |
| `AuthService` / `JwtUtil` | auth | backend |
| `ContactService` | contacts | backend |
| `DealService` | deals | backend |
| `SqlGuard` | ai-safety | backend |
| `Dashboard.tsx` | dashboard-ui | frontend |
| `Contacts.tsx` | contacts-ui | frontend |

---

## Anti-Patterns to Avoid

- Never auto-close a duplicate without human review
- Never paste raw CI logs into a ticket — normalize first
- Never classify all failures as P1 — follow the matrix
- Never fingerprint raw logs — normalize first (timestamps break dedup)
