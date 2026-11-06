import { expect, test } from '@playwright/test'
import { add, login, reset } from './helpers/market'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00Z'))
  // The quote reference includes guest identity; seed it rather than mask UI.
  await page.addInitScript(() => localStorage.setItem('kurio.guest.id', 'visual-guest'))
  await reset(page)
})
for (const screen of ['home', 'detail', 'cart', 'checkout'] as const) {
  test(`baseline ${screen}`, async ({ page }) => {
    if (screen === 'checkout') await login(page, 'alice', '/carteiras')
    if (screen === 'cart' || screen === 'checkout') await add(page)
    await page.goto({ home: '/', detail: '/nfts/nft-002', cart: '/carrinho', checkout: '/checkout' }[screen])
    await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
    if (screen === 'home') await expect(page.locator('.nft-card')).toHaveCount(6)
    if (screen === 'detail') await expect(page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true })).toBeEnabled()
    if (screen === 'cart') await expect(page.getByTestId('total')).toHaveText('0.306 ETH')
    if (screen === 'checkout') await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue('Alice')
    await page.evaluate(() => document.fonts.ready)
    if (screen === 'home' && (page.viewportSize()?.width ?? 0) >= 1024) {
      // Compare the complete Home, including real lazy-loaded editorial art.
      await page.evaluate(async () => {
        for (let top = 0; top < document.body.scrollHeight; top += 600) { window.scrollTo(0, top); await new Promise(resolve => setTimeout(resolve, 40)) }
        await Promise.all([...document.images].filter(image => image.getBoundingClientRect().width > 0).map(image => image.decode()))
        window.scrollTo(0, 0)
      })
    }
    await expect(page).toHaveScreenshot(`${screen}.png`, { fullPage: true })
  })
}
