import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // En CI : démarre le serveur automatiquement.
  // En local : réutilise le serveur existant (turbo dev --filter=web).
  webServer: {
    command    : 'npx turbo dev --filter=web',
    cwd        : path.resolve(__dirname, '../..'),
    url        : 'http://localhost:8081',
    timeout    : 120_000,
    reuseExistingServer: !process.env['CI'],
    env: {
      EXPO_PUBLIC_SUPABASE_URL:      process.env['EXPO_PUBLIC_SUPABASE_URL']      ?? '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
    },
  },
})
