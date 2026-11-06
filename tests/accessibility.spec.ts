import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { add, apiQuote, login, request, reset } from './helpers/market'

const groups = [
  ['/', '/nfts/nft-002', '/carrinho'],
  ['/checkout', '/perfil', '/carteiras'],
  ['/pedido/confirmacao', '/login', '/cadastro'],
]
for (const width of [390, 768, 1440]) for (const [index, paths] of groups.entries()) {
  test(`acessibilidade das nove telas em ${width}px grupo${index + 1}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await reset(page)
    await login(page, 'alice', '/perfil')
    await add(page)
    for (const path of paths) {
      if (path === '/pedido/confirmacao') {
        const { input } = await apiQuote(page)
        const created = await request(page, '/api/orders', 'POST', input, { 'Idempotency-Key': `a11y-confirmed-${width}` })
        expect(created.status).toBe(201)
        await page.goto(`${path}?orderId=${created.body.id}`)
        await expect(page.getByTestId('order-receipt')).toBeVisible()
      } else await page.goto(path)
      await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      expect(result.violations, `${path}: ${JSON.stringify(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })))}`).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`screen-${path.replaceAll('/', '_') || 'home'}-${width}.png`), fullPage: true })
    }
  })
}

test('perfil: teclado, foco, zoom200% e movimento reduzido', async ({ page }) => {
  await reset(page); await login(page, 'alice', '/perfil')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByLabel('Nome de exibição', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Nome de usuário', { exact: true })).toBeFocused()
  await page.getByText('Informações adicionais', { exact: true }).click()
  await page.getByLabel('Biografia').focus()
  expect(await page.getByLabel('Biografia').evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none')
  // CSS zoom doubles actual content size in a fixed viewport; check reflow and usable controls.
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  const duration = await page.locator('.kurio-theme').evaluate(node => getComputedStyle(node).animationDuration)
  expect(parseFloat(duration)).toBeLessThan(0.01)
})
