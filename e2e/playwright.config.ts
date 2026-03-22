import { defineConfig, devices } from "@playwright/test";

// Read environment variables
const BACKEND_PORT = process.env.BACKEND_PORT || "3001";
const FRONTEND_PORT = process.env.FRONTEND_PORT || "3000";

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

  // Run local dev server before starting tests
  webServer: [
    {
      command: "cd ../backend && npm start",
      port: parseInt(BACKEND_PORT),
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "cd ../frontend && npm run dev",
      port: parseInt(FRONTEND_PORT),
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
