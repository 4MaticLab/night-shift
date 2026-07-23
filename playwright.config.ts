import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL, locale: "zh-CN", trace: "on-first-retry" },
  webServer: { command: `npm run dev -- -p ${port}`, url: baseURL, reuseExistingServer: true },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
