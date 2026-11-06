import { expect, test } from '@playwright/test'
import { reset } from './helpers/market'
test('Home desktop revisada contra os exports fornecidos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00Z'))
  await page.addInitScript(() => localStorage.setItem('kurio.guest.id', 'visual-guest'))
  await reset(page); await page.goto('/')
  await expect(page.locator('.nft-card h3')).toHaveCount(6)
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  await page.evaluate(async () => {
    await document.fonts.ready
    for (let top = 0; top < document.body.scrollHeight; top += 600) { window.scrollTo(0, top); await new Promise(resolve => setTimeout(resolve, 40)) }
    await Promise.all([...document.images].filter(image => image.getBoundingClientRect().width > 0).map(image => image.decode()))
    window.scrollTo(0, 0)
  })
  await expect(page).toHaveScreenshot('home-desktop.png', { fullPage: true })
})
