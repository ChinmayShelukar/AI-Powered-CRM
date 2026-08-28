import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // no pre-auth for this suite

  test("login page loads with demo credentials hint", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Demo accounts")).toBeVisible();
    await expect(page.getByText(/admin@cortex\.com/)).toBeVisible();
  });

  test("admin can log in and is redirected to dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait("admin@cortex.com", "password123");

    await expect(page).not.toHaveURL(/login/);
  });

  test("sales rep can log in", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWait("rep@cortex.com", "password123");

    await expect(page).not.toHaveURL(/login/);
  });

  test("wrong password shows error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("admin@cortex.com", "wrongpassword");

    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("empty form fields are required — HTML5 validation fires", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();

    // Form is invalid, URL stays on /login
    await expect(page).toHaveURL(/login/);
  });

  test("unknown email shows error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("nobody@example.com", "password123");

    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5_000 });
  });

  test("session is not accessible before login", async ({ page }) => {
    await page.goto("/");
    // Unauthenticated → redirected to /login
    await expect(page).toHaveURL(/login/);
  });
});
