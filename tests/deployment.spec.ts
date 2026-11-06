import { expect, test } from '@playwright/test'
import { login, reset } from './helpers/market'

test('SPA: acesso direto e refresh das nove telas e favoritos', async ({ page }) => {
  await reset(page)
  await login(page, 'alice', '/perfil')
  for (const [path, title] of [
    ['/', /Descubra o seu/], ['/nfts/nft-002', 'Sage Nomad #002'],
    ['/carrinho', 'Carrinho'], ['/checkout', 'Checkout'],
    ['/pedido/confirmacao', 'Confirmação do pedido'], ['/login', 'Login'],
    ['/cadastro', 'Cadastro'], ['/perfil', 'Perfil'], ['/carteiras', 'Carteiras'], ['/favoritos', 'Favoritos'],
  ] as const) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: title, exact: typeof title === 'string' })).toBeVisible()
    expect((await page.reload())?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: title, exact: typeof title === 'string' })).toBeVisible()
  }
})
