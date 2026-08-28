/**
 * CortexCRM — k6 Soak Test
 * Sustained load for 30 minutes to detect memory leaks and resource exhaustion.
 *
 * Run: k6 run --env BASE_URL=http://localhost:8080 load-tests/soak.js
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  stages: [
    { duration: "2m", target: 20 },   // ramp up
    { duration: "25m", target: 20 },  // sustain
    { duration: "3m", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<600"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: "admin@cortex.com", password: "password123" }),
    { headers: { "Content-Type": "application/json" } }
  );
  return { token: JSON.parse(res.body).token };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };

  http.get(`${BASE_URL}/api/contacts`, { headers });
  http.get(`${BASE_URL}/api/deals`, { headers });
  http.get(`${BASE_URL}/api/analytics/rfm`, { headers });

  const res = http.get(`${BASE_URL}/api/contacts`, { headers });
  check(res, { "soak: contacts 200": (r) => r.status === 200 });

  sleep(2);
}
