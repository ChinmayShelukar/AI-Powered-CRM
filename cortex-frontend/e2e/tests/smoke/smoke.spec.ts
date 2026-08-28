import { test, expect } from "@playwright/test";

/**
 * Smoke tests — run post-deploy to confirm the app is alive.
 * npx playwright test --grep @smoke
 */

test.describe("Smoke Tests @smoke", () => {
  test("app loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("authenticated user reaches dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/login/, { timeout: 10_000 });
  });

  test("contacts page renders a table", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
  });

  test("deals page loads", async ({ page }) => {
    await page.goto("/deals");
    await expect(page).not.toHaveURL(/login/);
  });

  test("API health — auth login responds", async ({ request }) => {
    const apiURL = process.env.API_URL ?? "http://localhost:8080";
    const res = await request.post(`${apiURL}/api/auth/login`, {
      data: { email: "admin@cortex.com", password: "password123" },
    });
    expect(res.ok()).toBe(true);
    const json = await res.json();
    expect(json.token).toBeTruthy();
  });
});
