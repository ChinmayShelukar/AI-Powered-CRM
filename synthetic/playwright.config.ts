import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./probes",
  testMatch: "**/*.probe.ts",
  fullyParallel: false,
  retries: 0, // ponytail: zero retries — flap = real outage
  workers: 1,
  timeout: 30_000, // 30s hard budget per probe
  reporter: [
    ["json", { outputFile: "synthetic-results.json" }],
    ["list"],
  ],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
