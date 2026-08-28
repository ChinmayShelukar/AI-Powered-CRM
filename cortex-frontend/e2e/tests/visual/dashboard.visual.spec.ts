import { test, expect } from "@playwright/test";

/**
 * Visual regression tests for CortexCRM dashboard.
 * Run: npx playwright test --project=visual-desktop --update-snapshots  (first time)
 * Run: npx playwright test --project=visual-desktop                     (subsequent)
 */

test.describe("Visual Regression @visual", () => {
  test("login page matches baseline", async ({ page }) => {
    // no storageState — load as unauthenticated
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    // Freeze the year in the copyright to avoid annual diff
    await page.evaluate(() => {
      document.querySelectorAll("p").forEach((p) => {
        if (p.textContent?.includes("CortexCRM. All rights reserved")) {
          p.textContent = "© 2025 CortexCRM. All rights reserved.";
        }
      });
    });

    await expect(page).toHaveScreenshot("login.png", {
      animations: "disabled",
    });
  });

  test("dashboard RFM card matches baseline", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mask dynamic numeric values that change with seed data
    const masks = [
      page.getByRole("table"),
    ];

    await expect(page).toHaveScreenshot("dashboard-full.png", {
      animations: "disabled",
      mask: masks,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("contacts page table matches baseline", async ({ page }) => {
    await page.goto("/contacts");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("table")).toBeVisible();

    await expect(page.getByRole("table")).toHaveScreenshot("contacts-table.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });
});
