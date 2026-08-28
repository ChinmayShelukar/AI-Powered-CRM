/**
 * CortexCRM — k6 API Load Test
 * Baseline (constant load) + Ramp-up (stress) profiles
 *
 * Run baseline:  k6 run --env BASE_URL=http://localhost:8080 load-tests/api-load.js
 * Run stress:    k6 run --env BASE_URL=http://localhost:8080 --env PROFILE=stress load-tests/api-load.js
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const PROFILE = __ENV.PROFILE || "baseline";

// Custom metrics
const authErrors = new Counter("auth_errors");
const contactsLatency = new Trend("contacts_latency_ms");
const analyticsLatency = new Trend("analytics_latency_ms");
const requestFailRate = new Rate("request_fail_rate");

// Load profiles
const profiles = {
  baseline: {
    stages: [
      { duration: "30s", target: 10 }, // warm-up
      { duration: "3m", target: 20 },  // sustained
      { duration: "30s", target: 0 },  // ramp-down
    ],
  },
  stress: {
    stages: [
      { duration: "30s", target: 10 },
      { duration: "1m", target: 50 },
      { duration: "1m", target: 100 },
      { duration: "1m", target: 200 },
      { duration: "30s", target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: "30s", target: 20, tags: { phase: "normal" } },
      { duration: "15s", target: 300, tags: { phase: "spike" } },
      { duration: "1m", target: 300, tags: { phase: "spike" } },
      { duration: "15s", target: 20, tags: { phase: "recovery" } },
      { duration: "2m", target: 20, tags: { phase: "recovery" } },
      { duration: "30s", target: 0, tags: { phase: "normal" } },
    ],
  },
};

export const options = {
  stages: profiles[PROFILE]?.stages || profiles.baseline.stages,
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    http_req_failed: ["rate<0.02"],
    request_fail_rate: ["rate<0.02"],
    // Spike recovery: p95 must return to <500ms after spike
    "http_req_duration{phase:recovery}": ["p(95)<500"],
    contacts_latency_ms: ["p(95)<400"],
    analytics_latency_ms: ["p(95)<800"],
  },
};

// ─── Setup: get auth token ────────────────────────────────────────────────────
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: "admin@cortex.com", password: "password123" }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (res.status !== 200) {
    throw new Error(`Login failed with status ${res.status}: ${res.body}`);
  }

  const body = JSON.parse(res.body);
  return { token: body.token };
}

// ─── Main VU function ─────────────────────────────────────────────────────────
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    "Content-Type": "application/json",
  };

  group("Auth endpoints", () => {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: "admin@cortex.com", password: "password123" }),
      { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } }
    );

    const ok = check(loginRes, {
      "login returns 200": (r) => r.status === 200,
      "login returns token": (r) => JSON.parse(r.body)?.token?.length > 0,
    });
    if (!ok) authErrors.add(1);
    requestFailRate.add(loginRes.status !== 200);
  });

  group("Contacts API", () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/contacts`, {
      headers,
      tags: { endpoint: "contacts_list" },
    });
    contactsLatency.add(Date.now() - start);

    check(res, {
      "contacts list 200": (r) => r.status === 200,
      "contacts is array": (r) => Array.isArray(JSON.parse(r.body)),
    });
    requestFailRate.add(res.status !== 200);
  });

  group("Deals API", () => {
    const res = http.get(`${BASE_URL}/api/deals`, {
      headers,
      tags: { endpoint: "deals_list" },
    });
    check(res, { "deals list 200": (r) => r.status === 200 });
    requestFailRate.add(res.status !== 200);
  });

  group("Analytics API", () => {
    const start = Date.now();
    const rfmRes = http.get(`${BASE_URL}/api/analytics/rfm`, {
      headers,
      tags: { endpoint: "analytics_rfm" },
    });
    analyticsLatency.add(Date.now() - start);

    check(rfmRes, {
      "rfm 200": (r) => r.status === 200,
      "rfm is array": (r) => Array.isArray(JSON.parse(r.body)),
    });

    const riskRes = http.get(`${BASE_URL}/api/analytics/risk`, {
      headers,
      tags: { endpoint: "analytics_risk" },
    });
    check(riskRes, { "risk 200": (r) => r.status === 200 });

    requestFailRate.add(rfmRes.status !== 200 || riskRes.status !== 200 ? 1 : 0);
  });

  sleep(1);
}
