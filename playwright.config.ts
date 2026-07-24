import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? [["line"], ["html", { open: "never" }]] : "list",
  use: { baseURL, locale: "zh-CN", trace: "on-first-retry" },
  webServer: { command: `npm run dev -- -p ${port}`, url: baseURL, reuseExistingServer: !isCI },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
