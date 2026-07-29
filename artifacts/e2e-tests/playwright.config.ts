/**
 * Playwright configuration for supply-chain app E2E tests.
 *
 * Tests run against the already-started dev server at http://localhost:18807
 * (the i-supply-chain artifact). All API calls are mocked via page.route().
 *
 * Run:  pnpm --filter @workspace/e2e-tests run test:e2e
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:18807',
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
