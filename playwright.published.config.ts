import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests', testMatch: '**/published.spec.ts',
  // Live HTTPS includes CDN/TLS/cold worker startup. Existing local suites and
  // their 30s limit are unchanged; every transition still asserts within10s.
  timeout: 60_000, expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: './node_modules/.cache/published-results',
  use: { baseURL: process.env.TEST_BASE_URL ?? 'https://nft-marketplace-jg-psi.vercel.app/', browserName: 'chromium' },
  projects: [
    { name: 'public-desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'public-mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
})
