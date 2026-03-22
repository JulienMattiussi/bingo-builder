import { defineConfig, devices } from "@playwright/test";

// Use separate ports for E2E tests to avoid conflicts with dev servers
const BACKEND_PORT = process.env.TEST_BACKEND_PORT || "3002";
const FRONTEND_PORT = process.env.TEST_FRONTEND_PORT || "5173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run test servers on separate ports (can coexist with dev servers)
  webServer: [
    {
      command: `cd ../backend && npm start`,
      port: parseInt(BACKEND_PORT),
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "test",
        PORT: BACKEND_PORT,
        MONGODB_URI: "mongodb://localhost:27018/bingo-test",
      },
    },
    {
      command: `cd ../frontend && PORT=${FRONTEND_PORT} npm run dev -- --port ${FRONTEND_PORT}`,
      port: parseInt(FRONTEND_PORT),
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  // Global setup to clean test database before tests
  globalSetup: "./global-setup.ts",
});
