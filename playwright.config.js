import { defineConfig, devices } from "@playwright/test";

// Minimal Playwright config — runs e2e tests against the local Next.js
// dev server. CI integration (GitHub Actions matrix, multiple browsers,
// trace capture) is a follow-up; this config is the scaffolding pass.

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add { name: 'mobile-safari', use: { ...devices['iPhone 13'] } } when
    // we want mobile coverage in CI.
  ],

  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
