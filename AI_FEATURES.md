# AI_FEATURES.md — CortexCRM AI Feature Roadmap

Feature set re-implemented **fresh** in CortexCRM (MIT). Inspired by functionality seen in other
CRMs; all code original, no third-party source copied. Ranked high → low by (business impact ÷
build/infra cost).

Legend: **Impact** H/M/L · **Effort** S/M/L · **Infra** = extra services needed · **LLM** = needs Claude key.

## Tier 1 — High impact, low infra (BUILD FIRST)

| # | Feature | Impact | Effort | Infra | LLM | CortexCRM mapping |
|---|---------|--------|--------|-------|-----|-------------------|
| 1 | **RFM segmentation** — score each contact by Recency / Frequency / Monetary, bucket into Champion / Loyal / Potential / At-Risk / Needs-Attention | H | S | none | no | Recency = latest `Activity.activityDate`; Frequency = activity count; Monetary = Σ WON `Deal.value` per contact |
| 2 | **Sentiment + Intent classification** — tag each activity note POSITIVE/NEUTRAL/NEGATIVE + intent (PRICING/COMPLAINT/RENEWAL/CHURN/UPSELL/OTHER) | H | M | none | opt | Classify `Activity.notes` via existing `ClaudeClient`; deterministic keyword fallback with no key |
| 3 | **Risk / churn scoring** — per-contact LOW/MEDIUM/HIGH from activity staleness + deal-stage regression + negative sentiment | H | M | none | opt | Rule blend over Activity + Deal + sentiment; "churn radar" cards |
| 4 | **Dashboard analytics + charts** — revenue forecast, pipeline funnel, stage/status breakdown, rep leaderboard | H | M | none | no | SQL aggregation over `deals`/`activities`; add `recharts` (frontend has none) |

## Tier 2 — Medium impact

| # | Feature | Impact | Effort | Infra | LLM | Notes |
|---|---------|--------|--------|-------|-----|-------|
| 5 | **Follow-up email draft** | M | — | none | yes | ✅ ALREADY in CortexCRM (`AiService.draftFollowUpEmail`) |
| 6 | **Contact summary (3-sentence)** | M | — | none | yes | ✅ ALREADY in CortexCRM (`AiService.summarizeContact`) |
| 7 | **NL-to-SQL assistant** | M | — | none | yes | ✅ ALREADY in CortexCRM (`AiService.nlQuery` + `SqlGuard`) |
| 8 | **Deal/opportunity health score** — dwell time in stage, expected-close slippage, decision-chain completeness | M | M | none | no | New scoring over `Deal` + stage history (add stage-change tracking) |
| 9 | **Team / manager AI insights** — per-rep aggregate coaching summary | M | M | none | opt | Aggregate leaderboard + LLM narrative; RBAC MANAGER/ADMIN |

## Tier 3 — High infra / defer (skip unless asked)

| # | Feature | Impact | Effort | Infra | LLM | Blocker |
|---|---------|--------|--------|-------|-----|---------|
| 10 | **Business-card OCR intake** | M | L | vision model + S3/MinIO | yes | Needs object storage + vision API |
| 11 | **Meeting copilot** — transcribe + summarize | M | L | audio transcription API | yes | Needs transcription service |
| 12 | **Agent trace (GOAP planner)** — multi-step autonomous action log | L | L | — | yes | Complex; low ROI for demo |
| 13 | **RAG knowledge base** — pgvector doc retrieval | M | L | pgvector ext | yes | Postgres needs pgvector; embeddings key |

## Build order (this project)
1 → 2 → 3 → 4 (Tier 1). Then reassess Tier 2 (#8, #9). Tier 3 only on explicit request (infra cost).

## Ground rules
- All features original code in CortexCRM packages (`com.cortexcrm.*`). No source copied from any
  all-rights-reserved repo — MIT-clean, deployable.
- Graceful degradation: LLM-optional features fall back to deterministic logic when
  `CLAUDE_API_KEY` unset (matches CortexCRM's existing 503-graceful pattern).
