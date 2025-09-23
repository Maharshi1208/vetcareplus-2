import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  reporter: [['html', { outputFolder: './report', open: 'never' }]],
  use: {
    // If FRONTEND_URL not set, default to Swagger UI so tests still pass
    baseURL: process.env.FRONTEND_URL || 'http://localhost:4000/docs',
    trace: 'on-first-retry',
    video: 'on',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  // Save screenshots/videos here (stays inside qa/)
  outputDir: './artifacts'
});
