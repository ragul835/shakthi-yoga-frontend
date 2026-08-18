import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: { executablePath: '/usr/bin/google-chrome' },
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'NODE_ENV=development PORT=3001 npm run start:prod',
      cwd: '../shakthi-yoga-backend',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'BACKEND_INTERNAL_URL=http://127.0.0.1:3001 NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 npm start',
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
