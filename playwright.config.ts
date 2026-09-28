import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

const localTestDatabaseUrl =
  "postgresql://ben:password@localhost:5432/rankovo-dev";
const e2eBaseUrl = "http://localhost:3001";
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl !== localTestDatabaseUrl) {
  throw new Error(
    `Playwright E2E tests require the local test database at ${localTestDatabaseUrl}. ` +
      "Set DATABASE_URL to the local database before running the tests.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Keep tests in each spec file ordered because they share the seeded database.
  // Different spec files can still run in parallel across workers.
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "bun run dev -- --port 3001",
    url: e2eBaseUrl,
    reuseExistingServer: false,
    env: {
      ...process.env,
      DATABASE_URL: localTestDatabaseUrl,
      ALLOW_DEV_LOGIN: "true",
      NODE_ENV: "development",
    },
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.storage/auth-user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
