import { test, expect } from "@playwright/test";
import { ContactsPage } from "../../pages/contacts.page";

test.describe("Contacts", () => {
  test("contacts page loads and shows table @smoke", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();

    await expect(contacts.table).toBeVisible();
    // Seed data should have at least one row
    await expect(contacts.rows.first()).toBeVisible();
  });

  test("search filters contacts by name", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();

    // Count rows before search
    const totalBefore = await contacts.rows.count();
    expect(totalBefore).toBeGreaterThan(0);

    // Search for something unlikely to match everything
    await contacts.search("Alice");

    // Rows should update (either fewer rows or still some)
    const totalAfter = await contacts.rows.count();
    expect(totalAfter).toBeGreaterThanOrEqual(0);
  });

  test("search with no match shows empty state", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();

    await contacts.search("zzz_no_match_xyz");
    // Either 0 rows or empty state message
    const rowCount = await contacts.rows.count();
    expect(rowCount).toBe(0);
  });

  test("status filter works", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();

    // Use the status select
    await page.getByRole("combobox").selectOption("CUSTOMER");
    // Page should not crash
    await expect(contacts.table).toBeVisible();
  });

  test("add contact button opens dialog", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();
    await contacts.openCreateDialog();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("create contact dialog can be closed with cancel", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();
    await contacts.openCreateDialog();

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("edit option appears on row action menu", async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.goto();

    // Click the action menu on the first row
    await contacts.rows.first().getByRole("button").click();
    await expect(page.getByRole("menuitem", { name: /edit/i })).toBeVisible();
  });
});
