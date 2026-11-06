import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({ ...base,
  testIgnore: [], testMatch: '**/visual.spec.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 } },
  projects: [390, 768, 1440].map(width => ({ name: `${width}px`, use: { viewport: { width, height: 1000 }, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 } })),
})
