import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Auth setup — runs first, saves storage state
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // E2E tests — uses saved auth state
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: [
    {
      command: "node e2e/mock-platform.mjs",
      port: 9999,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --port 3000",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PLATFORM_URL: "http://localhost:9999",
        NEXT_PUBLIC_DEMO_MODE: "true",
      },
    },
  ],
});
