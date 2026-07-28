import { defineConfig, devices } from '@playwright/test';

const PORT = 8790;
const BASE_URL = process.env.LIVE_BASE_URL ?? `http://localhost:${PORT}`;
const isLiveCheck = Boolean(process.env.LIVE_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: isLiveCheck
    ? undefined
    : {
        command: 'bun run e2e:server',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
