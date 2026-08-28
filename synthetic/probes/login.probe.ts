/**
 * CortexCRM — Synthetic Monitoring Probe: Login Flow
 * Runs every 5 minutes in production to verify authentication works.
 *
 * npx playwright test synthetic/probes/login.probe.ts
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.SYNTHETIC_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:5173";
const SYNTHETIC_EMAIL = process.env.SYNTHETIC_EMAIL ?? "admin@cortex.com";
const SYNTHETIC_PASSWORD = process.env.SYNTHETIC_PASSWORD ?? "password123";

test("synthetic: login flow completes successfully", async ({ page }) => {
  const start = Date.now();

  await test.step("load login page", async () => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible({ timeout: 10_000 });
  });

  await test.step("fill credentials", async () => {
    await page.getByLabel("Email").fill(SYNTHETIC_EMAIL);
    await page.getByLabel("Password").fill(SYNTHETIC_PASSWORD);
  });

  await test.step("submit and assert authenticated", async () => {
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).not.toHaveURL(/login/, { timeout: 10_000 });
    // Assert meaningful content loaded — not just URL change
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });
  });

  const duration = Date.now() - start;
  // Probe budget: 15 seconds
  expect(duration).toBeLessThan(15_000);
});
