import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly path = "/";
  readonly rfmCard: Locator;
  readonly churnRadarCard: Locator;
  readonly dealHealthCard: Locator;
  readonly leaderboardCard: Locator;
  readonly briefingCard: Locator;

  constructor(private readonly page: Page) {
    this.rfmCard = page.getByRole("heading", { name: /RFM/i }).locator("..").locator("..");
    this.churnRadarCard = page.getByRole("heading", { name: /Churn/i }).locator("..").locator("..");
    this.dealHealthCard = page.getByRole("heading", { name: /Deal Health/i }).locator("..").locator("..");
    this.leaderboardCard = page.getByRole("heading", { name: /Leaderboard/i }).locator("..").locator("..");
    this.briefingCard = page.getByRole("heading", { name: /Briefing/i }).locator("..").locator("..");
  }

  async goto() {
    await this.page.goto(this.path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForDashboardLoad() {
    // wait for at least one analytics section to appear
    await expect(this.page.getByRole("main")).toBeVisible({ timeout: 15_000 });
  }
}
