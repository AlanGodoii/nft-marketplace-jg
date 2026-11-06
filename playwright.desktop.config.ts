import { defineConfig } from '@playwright/test'
import base from './playwright.visual.config'
export default defineConfig({ ...base,
  testIgnore: [], testMatch: '**/desktop-visual.spec.ts',
  projects: [1280,1440,1920].map(width => ({ name: `${width}px`, use: { viewport: { width, height: 1000 }, deviceScaleFactor: 1 } })),
})
