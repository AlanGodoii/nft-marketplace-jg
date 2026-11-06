import { expect, test } from '@playwright/test'

const baseURL = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173'

for (const width of [390, 768, 1440]) {
  test(`início responsivo em ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(baseURL)
    await expect(page.getByRole('heading', { name: /Descubra o seu|SEJA DONO DO FUTURO/ })).toBeVisible()
    await expect(page.locator('.nft-grid .nft-card h3')).toHaveCount(6)
    await expect(page.getByLabel('Buscar NFTs')).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Próxima página' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.evaluate(() => document.fonts.check('400 16px "Roboto Mono"'))).toBe(true)
    if (width === 1440) {
      expect(await page.locator('main').evaluate(node => node.getBoundingClientRect().width)).toBe(1200)
      expect(await page.locator('.desktop-header-inner').evaluate(node => node.getBoundingClientRect().height)).toBe(45)
      expect(await page.locator('.desktop-home-hero').evaluate(node => node.getBoundingClientRect().height)).toBe(450)
      expect(await page.locator('.desktop-home-hero picture').evaluate(node => node.getBoundingClientRect().width)).toBe(450)
      expect(await page.locator('.desktop-filters').evaluate(node => node.getBoundingClientRect().width)).toBe(310)
      expect(await page.locator('.catalog-toolbar').evaluate(node => node.getBoundingClientRect().width)).toBe(842)
    } else {
      await page.getByText('Filtrar NFTs', { exact: true }).click()
      await expect(page.locator('.mobile-filters').getByLabel('Mínimo')).toBeVisible()
    }
    if (width === 390) {
      await page.getByRole('button', { name: 'Abrir menu' }).focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
      await page.getByRole('link', { name: 'Perfil', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
      await expect(page.locator('.mobile-menu-toggle')).toHaveAttribute('aria-expanded', 'false')
      await page.goBack()
      await expect(page.getByRole('heading', { name: /Descubra o seu|SEJA DONO DO FUTURO/ })).toBeVisible()
    }
    await page.screenshot({ path: testInfo.outputPath(`kurio-home-${width}.png`), fullPage: true })
    expect(errors).toEqual([])
  })
}

test('preserva as outras oito rotas e a página não encontrada', async ({ page }) => {
  await page.goto(baseURL + '/login')
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
  const routes = [
    ['/nfts/exemplo', 'NFT não encontrado'], ['/carrinho', 'Carrinho'],
    ['/checkout', 'Checkout'], ['/pedido/confirmacao', 'Confirmação do pedido'],
    ['/login', 'Login'], ['/cadastro', 'Cadastro'], ['/perfil', 'Perfil'],
    ['/carteiras', 'Carteiras'], ['/nao-existe', 'Página não encontrada'],
  ]
  for (const [path, title] of routes) {
    await page.goto(baseURL + path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  }
})

for (const status of ['loading', 'success', 'empty', 'error'] as const) {
  test(`catálogo: estado ${status}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(baseURL)
    await expect(page.getByRole('heading', { name: /Descubra o seu|SEJA DONO DO FUTURO/ })).toBeVisible()
    await page.evaluate(async variant => {
      const fixturePath = '/tests/fixtures/catalog-preview.tsx'
      const { mountCatalogPreview } = await import(/* @vite-ignore */ fixturePath)
      mountCatalogPreview(variant)
    }, status)
    const preview = page.locator('#catalog-preview')
    if (status === 'loading') {
      await expect(preview.getByRole('status')).toHaveAttribute('aria-busy', 'true')
      await expect(preview.locator('.nft-card')).toHaveCount(6)
    } else if (status === 'success') {
      await expect(preview.getByRole('link')).toHaveCount(6)
      const cards = preview.locator('.nft-card')
      await expect(cards).toHaveCount(6)
      expect(await cards.first().evaluate(node => node.getBoundingClientRect().width)).toBe(258)
      expect(await cards.nth(2).evaluate(node => node.getBoundingClientRect().top))
        .toBe(await cards.first().evaluate(node => node.getBoundingClientRect().top))
      expect(await cards.nth(3).evaluate(node => node.getBoundingClientRect().top))
        .toBeGreaterThan(await cards.first().evaluate(node => node.getBoundingClientRect().top))
      await expect(preview.getByRole('link').first()).toHaveAttribute('href', '/nfts/teste-0')
    } else if (status === 'empty') {
      await expect(preview.getByText('Nenhum NFT encontrado', { exact: true })).toBeVisible()
    } else {
      await expect(preview.getByRole('alert')).toContainText('Falha de teste no carregamento.')
    }
  })
}
