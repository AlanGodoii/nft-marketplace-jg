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
    if (screen === 'detail') await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeEnabled()
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

// Additional supplied frames, stable API data and real controls (no screenshot UI).
for (const screen of ['login','register','profile','wallets'] as const) {
 test(`baseline ${screen}`,async({page})=>{
  if(screen==='profile'||screen==='wallets') await login(page,'alice',screen==='profile'?'/perfil':'/carteiras')
  else await page.goto(screen==='login'?'/login':'/cadastro')
  await expect(page.locator('h1,h2').filter({hasText:screen==='profile'?'Perfil do colecionador':screen==='wallets'?'Carteiras':screen==='login'?'Entrar':/Criar conta|Criar perfil de colecionador/}).first()).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  if((screen==='login'||screen==='register')&&(page.viewportSize()?.width??0)>=1024) await expect(page.locator('.auth-backdrop .nft-card')).toHaveCount(9)
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>image.getBoundingClientRect().width>0 && image.loading!=='lazy').map(image=>image.decode()))})
  await expect(page).toHaveScreenshot(`${screen}.png`,{fullPage:true})
 })
}
