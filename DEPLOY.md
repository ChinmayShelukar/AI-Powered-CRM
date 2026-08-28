# Deploying CortexCRM live — 100% free

Fully-free stack, no credit card (Claude AI is optional; app runs without it):

| Layer | Service | Free tier |
|-------|---------|-----------|
| Database | **Neon** Postgres | free, always-on |
| Cache/AI memory | **Upstash** Redis | 10k commands/day free |
| Backend | **Render** Web Service (Docker) | free (sleeps when idle) |
| Frontend | **Vercel** static | free |
| AI (optional) | Anthropic Claude | pay-as-you-go; omit to use deterministic fallbacks |

Repo: `github.com/ChinmayShelukar/AI-Powered-CRM-Platform` (or your CortexCRM repo). Render + Vercel deploy from GitHub.

---

## 1. Database — Neon
1. neon.tech → sign up (GitHub login) → **Create project**.
2. Copy the connection string, e.g.
   `postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require`
3. Convert to JDBC for Spring:
   `jdbc:postgresql://<host>.neon.tech/<db>?sslmode=require&user=<user>&password=<pass>`
   (Flyway auto-creates all tables on first backend boot — no manual SQL, no pgvector needed.)

## 2. Redis — Upstash
1. upstash.com → sign up → **Create Database** (Redis, pick nearest region).
2. Copy: host, port, password (TLS enabled).
3. You'll set `SPRING_DATA_REDIS_*` on the backend (step 3). *Optional:* skip Redis entirely —
   core CRM + all analytics work; only the Claude chat + rate-limiter need it.

## 3. Backend — Render
1. render.com → **New → Web Service** → connect the GitHub repo.
2. Root directory: `cortex-backend` · Runtime: **Docker** (uses `cortex-backend/Dockerfile`).
3. Instance type: **Free**.
4. Environment variables:
   ```
   SPRING_DATASOURCE_URL = jdbc:postgresql://<host>.neon.tech/<db>?sslmode=require
   DB_USER               = <neon user>
   DB_PASSWORD           = <neon password>
   JWT_SECRET            = <run: openssl rand -hex 32>   (>= 64 hex chars)
   SPRING_DATA_REDIS_HOST     = <upstash host>
   SPRING_DATA_REDIS_PORT     = <upstash port>
   SPRING_DATA_REDIS_PASSWORD = <upstash password>
   SPRING_DATA_REDIS_SSL_ENABLED = true
   CLAUDE_API_KEY        = <optional; omit for deterministic fallbacks>
   APP_CORS_ALLOWED_ORIGINS = https://<your-vercel-app>.vercel.app
   ```
   (Render injects `PORT`; the Dockerfile binds it automatically.)
5. Deploy. Watch logs for `Successfully applied N migrations` + `Started CortexBackendApplication`.
6. Note the URL: `https://<service>.onrender.com`. Test: `curl .../api/auth/register -X POST -H 'Content-Type: application/json' -d '{"name":"A","email":"a@x.com","password":"password1"}'` → JWT.

## 4. Frontend — Vercel
1. vercel.com → **Add New → Project** → import the repo.
2. Root directory: `cortex-frontend` · Framework preset: **Vite**.
3. Build: `pnpm build` (or `npm run build`) · Output: `dist`.
4. Environment variable:
   ```
   VITE_API_URL = https://<service>.onrender.com
   ```
5. Deploy → note `https://<app>.vercel.app`.

## 5. Wire CORS + done
1. Back in Render, set `APP_CORS_ALLOWED_ORIGINS` to the real Vercel URL → redeploy.
2. Open the Vercel URL, register, log in. Dashboard shows the Daily Briefing, RFM, churn radar,
   deal health, leaderboard — all free (no Claude key needed).

## Notes
- **Render free cold start**: first request after ~15 min idle takes 30–60s. Fine for a demo/portfolio.
- **AI enhancements**: set `CLAUDE_API_KEY` to turn on the NL-to-SQL chat, LLM-graded
  sentiment/intent, and the LLM team narrative. Without it these degrade to deterministic logic.
- **Alternative host**: Koyeb free (Docker) if Render's cold starts bother you — same env vars.
