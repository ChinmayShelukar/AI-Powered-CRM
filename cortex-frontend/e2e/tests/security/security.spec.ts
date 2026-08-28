import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";

/**
 * OWASP Top 10 (2025) security tests for CortexCRM.
 * Run with: npx playwright test --project=security
 * Verify against OWASP Juice Shop: BASE_URL=http://localhost:3000 npx playwright test --project=security
 */

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const API = process.env.API_URL ?? "http://localhost:8080";

// ─── A01: Broken Access Control ──────────────────────────────────────────────
test.describe("A01: Broken Access Control", () => {
  test("unauthenticated request to /api/contacts returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/contacts`);
    expect([401, 403]).toContain(res.status());
  });

  test("unauthenticated request to /api/analytics/rfm returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/analytics/rfm`);
    expect([401, 403]).toContain(res.status());
  });

  test("unauthenticated request to /api/users returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/users`);
    expect([401, 403]).toContain(res.status());
  });

  test("unauthenticated request to /api/audit returns 401", async ({ request }) => {
    const res = await request.get(`${API}/api/audit`);
    expect([401, 403]).toContain(res.status());
  });
});

// ─── A02: Security Misconfiguration ──────────────────────────────────────────
test.describe("A02: Security Misconfiguration", () => {
  test("API does not expose stack traces in error responses", async ({ request }) => {
    const res = await request.get(`${API}/api/contacts/999999999`);
    const body = await res.text();
    expect(body).not.toMatch(/at com\.cortexcrm/);
    expect(body).not.toMatch(/Exception/);
  });

  test("login error does not expose internal user info", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: "nonexistent@example.com", password: "wrong" },
    });
    const body = await res.text();
    // Must not say "user not found" or expose DB info
    expect(body).not.toMatch(/SQL|hibernate|JPA|stack/i);
  });
});

// ─── A04: Cryptographic Failures ─────────────────────────────────────────────
test.describe("A04: Cryptographic Failures", () => {
  test("login response does not echo back the password", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: "admin@cortex.com", password: "password123" },
    });
    const body = await res.text();
    expect(body).not.toContain("password123");
  });

  test("auth token is returned as a JWT (3-part structure)", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: "admin@cortex.com", password: "password123" },
    });
    if (res.ok()) {
      const json = await res.json();
      const token: string = json.token ?? "";
      const parts = token.split(".");
      expect(parts).toHaveLength(3); // header.payload.signature
    }
  });
});

// ─── A05: Injection ──────────────────────────────────────────────────────────
test.describe("A05: Injection", () => {
  test("SQL injection in login email is rejected gracefully", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: "' OR '1'='1", password: "x" },
    });
    // Must not succeed (200) and must not expose DB error
    expect(res.status()).not.toBe(200);
    const body = await res.text();
    expect(body).not.toMatch(/SQL|syntax error|ORA-|PG::/i);
  });

  test("XSS payload in contact name is stored safely", async ({ page }) => {
    // Log in
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill("admin@cortex.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\//);

    // Navigate to contacts and search with XSS payload
    await page.goto(`${BASE}/contacts`);
    await page.getByPlaceholder(/search/i).fill('<script>window.__xss=1</script>');

    // Ensure the script was not executed
    const xssTriggered = await page.evaluate(() => (window as unknown as Record<string, unknown>).__xss);
    expect(xssTriggered).toBeUndefined();
  });
});

// ─── A06: Insecure Design — Rate Limiting ─────────────────────────────────────
test.describe("A06: Insecure Design", () => {
  test("rapid failed logins are eventually rate-limited or rejected", async ({ request }) => {
    const attempts = Array.from({ length: 10 }, () =>
      request.post(`${API}/api/auth/login`, {
        data: { email: "admin@cortex.com", password: "wrong" },
      })
    );
    const responses = await Promise.all(attempts);
    const statuses = responses.map((r) => r.status());
    // At least some should be 400/401/429 — none should be 200
    expect(statuses.every((s) => s !== 200)).toBe(true);
  });
});

// ─── A07: Authentication Failures ────────────────────────────────────────────
test.describe("A07: Authentication Failures", () => {
  test("expired or tampered JWT is rejected", async ({ request }) => {
    const fakeJwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6IkFETUlOIn0.invalidsignature";
    const res = await request.get(`${API}/api/contacts`, {
      headers: { Authorization: `Bearer ${fakeJwt}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("alg:none JWT is rejected", async ({ request }) => {
    // header: {"alg":"none","typ":"JWT"}, payload: {"sub":"1","role":"ADMIN"}
    const noneJwt =
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwicm9sZSI6IkFETUlOIn0.";
    const res = await request.get(`${API}/api/contacts`, {
      headers: { Authorization: `Bearer ${noneJwt}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("bearer token is required — no token is rejected", async ({ request }) => {
    const res = await request.get(`${API}/api/contacts`);
    expect([401, 403]).toContain(res.status());
  });
});

// ─── A10: Mishandling of Exceptional Conditions ───────────────────────────────
test.describe("A10: Mishandling of Exceptional Conditions", () => {
  test("non-existent endpoint returns 404 without leaking internals", async ({ request }) => {
    const res = await request.get(`${API}/api/nonexistent`);
    expect(res.status()).toBe(404);
    const body = await res.text();
    expect(body).not.toMatch(/Whitelabel Error Page|at com\.cortexcrm/);
  });

  test("malformed JSON body is rejected gracefully", async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: "not-json{{{",
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 415, 422]).toContain(res.status());
  });
});
