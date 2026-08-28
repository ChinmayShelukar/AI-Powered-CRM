/**
 * CortexCRM — Synthetic Monitoring Probe: API Health
 * Runs every minute to verify the backend API is responsive.
 *
 * npx playwright test synthetic/probes/api-health.probe.ts
 */

import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

test("synthetic: API login endpoint responds < 3s", async ({ request }) => {
  const start = Date.now();

  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: "admin@cortex.com", password: "password123" },
  });

  const duration = Date.now() - start;

  // Assert the goal — not just HTTP 200
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(typeof body.token).toBe("string");
  expect(body.token.split(".").length).toBe(3); // valid JWT shape

  // Latency budget: 3 seconds
  expect(duration).toBeLessThan(3_000);
});

test("synthetic: contacts API returns data < 2s", async ({ request }) => {
  // First get a token
  const loginRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: "admin@cortex.com", password: "password123" },
  });
  const { token } = await loginRes.json();

  const start = Date.now();
  const res = await request.get(`${API_URL}/api/contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const duration = Date.now() - start;

  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
  expect(duration).toBeLessThan(2_000);
});

test("synthetic: analytics RFM endpoint responds < 4s", async ({ request }) => {
  const loginRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: "admin@cortex.com", password: "password123" },
  });
  const { token } = await loginRes.json();

  const start = Date.now();
  const res = await request.get(`${API_URL}/api/analytics/rfm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const duration = Date.now() - start;

  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
  expect(duration).toBeLessThan(4_000);
});
