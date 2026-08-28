import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? "http://localhost:5173";
const apiURL = process.env.API_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? "50%" : undefined,
  reporter: isCI
    ? [
        ["blob"],
        ["github"],
        ["json", { outputFile: "test-results/results.json" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [["html", { open: "on-failure" }]],
  use: {
    baseURL,
    trace: isCI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: isCI ? "on-first-retry" : "off",
    navigationTimeout: 30_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: /global-teardown\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /security\//,
    },
    {
      name: "security",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /security\//,
    },
    {
      name: "visual-desktop",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
        viewport: { width: 1280, height: 720 },
        colorScheme: "light",
      },
      testMatch: /visual\//,
      dependencies: ["setup"],
    },
  ],
  webServer: isCI
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});

export { apiURL };
