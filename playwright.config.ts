import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "WEB_PORT=3000 corepack pnpm --dir apps/web dev",
    port: Number(process.env.WEB_PORT ?? 3000),
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
