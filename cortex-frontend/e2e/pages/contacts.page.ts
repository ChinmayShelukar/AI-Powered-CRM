import { type Page, type Locator, expect } from "@playwright/test";

export class ContactsPage {
  readonly path = "/contacts";
  readonly searchInput: Locator;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByPlaceholder(/search/i);
    this.addButton = page.getByRole("button", { name: /add contact/i });
    this.table = page.getByRole("table");
    this.rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
  }

  async goto() {
    await this.page.goto(this.path);
    await expect(this.table).toBeVisible({ timeout: 10_000 });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async openCreateDialog() {
    await this.addButton.click();
    await expect(this.page.getByRole("dialog")).toBeVisible();
  }

  async fillContactForm(name: string, email: string, company?: string) {
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByLabel("Email").fill(email);
    if (company) await this.page.getByLabel(/company/i).fill(company);
  }

  async submitContactForm() {
    await this.page.getByRole("button", { name: /save|create/i }).click();
  }

  getRowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }
}
