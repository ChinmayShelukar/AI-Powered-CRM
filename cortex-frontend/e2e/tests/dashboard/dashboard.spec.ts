import { test, expect } from "@playwright/test";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Dashboard", () => {
  test("dashboard loads and renders main sections @smoke", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForDashboardLoad();

    // Page must have a main landmark
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("navigation sidebar is accessible", async ({ page }) => {
    await page.goto("/");
    // Sidebar navigation links
    await expect(page.getByRole("link", { name: /contacts/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /deals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /activities/i })).toBeVisible();
  });

  test("dashboard has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("analytics cards render without crashing @smoke", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should not show error toasts
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("navigating to Contacts from sidebar works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /contacts/i }).click();
    await expect(page).toHaveURL(/contacts/);
  });

  test("navigating to Deals from sidebar works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /deals/i }).click();
    await expect(page).toHaveURL(/deals/);
  });

  test("AI Chat page is reachable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ai|chat/i }).click();
    await expect(page).not.toHaveURL(/login/);
  });
});
