import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm dev --port 3100',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      env: {
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        BETTER_AUTH_SECRET: '',
        TALLY_DATABASE_PATH: ':memory:',
      },
    },
    {
      command: 'node --import tsx tests/e2e/server.ts',
      url: 'http://127.0.0.1:3101',
      reuseExistingServer: false,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
