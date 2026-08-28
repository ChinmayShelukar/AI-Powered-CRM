# Login Probe Runbook

**Probe:** `synthetic/probes/login.probe.ts`  
**Fires:** Every 5 minutes via `.github/workflows/synthetic-monitoring.yml`  
**Alert:** Slack `#monitoring` with run URL + link to this doc

---

## What the probe tests

1. Loads the frontend login page (`SYNTHETIC_BASE_URL`)
2. Fills email + password fields and submits
3. Asserts main dashboard visible within 15 seconds
4. Wall-clock budget: 15 seconds total

**Passes =** login flow works end-to-end for real users.  
**Fails =** any of: page unreachable, form missing, submit broken, redirect broken, dashboard never loads.

---

## Alert triage — first 2 minutes

**Single failure:** infrastructure flap is likely. Check:
- GitHub Actions run log — is the runner slow?
- Render backend: https://dashboard.render.com (free tier cold start can hit 30-60s)
- Vercel frontend: https://vercel.com/dashboard

**Two consecutive failures:** real outage. Follow escalation below.

---

## Step-by-step diagnosis

### 1. Can the login page be reached?

```bash
curl -s -o /dev/null -w "%{http_code}" https://<PRODUCTION_URL>/
```

- `200` = frontend up, go to step 2
- `5xx` = Vercel or CDN issue, check Vercel dashboard
- `000` / timeout = DNS or network issue, check Cloudflare/Vercel edge

### 2. Does the API respond?

```bash
curl -s -X POST https://<API_URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cortex.com","password":"password123"}' | jq .
```

- JWT returned = API up, issue is in frontend / session handling
- `401` = wrong credentials (synthetic account deleted? env var wrong?)
- `500` = backend error, check Render logs
- Connection refused / timeout = backend down (Render cold start or crash)

### 3. Is the backend starting?

Check Render service logs in dashboard. Look for:
- `Started CortexCrmApplication` = started clean
- `Flyway ... ERROR` = migration failed (DB schema drift)
- `Cannot connect to Postgres` = Neon connection limit or rotation
- No recent logs = service crashed, redeploy

### 4. Is the database up?

Neon free tier suspends after 5 minutes of inactivity. First backend hit after suspend causes a ~3s cold start, which Render can mishandle.

```bash
# If you have psql:
psql $DATABASE_URL -c '\dt'
```

- Tables listed = Neon up
- Connection refused = Neon auto-suspended (will resume on next request — wait 10s and retry)

### 5. Are synthetic credentials valid?

The probe uses `SYNTHETIC_EMAIL` / `SYNTHETIC_PASSWORD` from GitHub secrets. If a password rotation or DB reset happened, these could be stale.

Verify manually:
```bash
curl -s -X POST https://<API_URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<SYNTHETIC_EMAIL>","password":"<SYNTHETIC_PASSWORD>"}' | jq .token
```

If `null` or `401`: update `SYNTHETIC_EMAIL`/`SYNTHETIC_PASSWORD` secrets in GitHub repo settings, or re-create the synthetic user.

---

## Rollback trigger

If steps 1-5 show backend crashed or migration failed and fix is > 10 minutes away:

1. Render dashboard → Deploy → Promote previous deploy
2. Verify: `curl https://<API_URL>/api/auth/login` returns JWT
3. Post in `#releases`:
   ```
   [Rollback] <date> — login probe failing
   Reason: <one line>
   Current state: running prev deploy
   Next steps: <owner> investigating
   ```

---

## False positive conditions

These look like failures but are not production incidents:

| Symptom | Cause | Resolution |
|---------|-------|------------|
| Only 1 failure, next run passes | Render cold start on free tier | No action; add `retries: 1` if noisy |
| Probe times out at exactly 30s | GitHub runner slow | Check other CI jobs same time; retry |
| `SYNTHETIC_BASE_URL` undefined | Missing GitHub var | Set `PRODUCTION_URL` repo variable |

---

## Escalation

| Stage | Action | Owner |
|-------|--------|-------|
| 1 failure | Check Render/Vercel dashboards | On-call |
| 2 consecutive failures | Follow steps 1-5 above + post in `#incidents` | On-call |
| Backend down > 15 min | Rollback to previous deploy | On-call |
| DB migration broken | Do NOT rollback — forward-fix only | Eng lead |
