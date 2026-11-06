import { defineConfig } from '@playwright/test'

const baseURL = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', testMatch: ['**/catalog.spec.ts', '**/commerce.spec.ts', '**/checkout.spec.ts', '**/realtime.spec.ts', '**/profile.spec.ts', '**/deployment.spec.ts'], use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  outputDir: './node_modules/.cache/playwright-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    browserName: 'chromium',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  webServer: process.env.TEST_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
