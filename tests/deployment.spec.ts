import { expect, test } from '@playwright/test'
import { login, reset } from './helpers/market'

const groups = [
  { name: 'públicas', private: false, routes: [
    ['/', /Descubra o seu/], ['/nfts/nft-002', 'Sage Nomad #002'], ['/carrinho', 'Carrinho'], ['/login', 'Login'], ['/cadastro', 'Cadastro'],
  ] as const },
  { name: 'privadas', private: true, routes: [
    ['/checkout', 'Checkout'], ['/pedido/confirmacao', 'Confirmação do pedido'], ['/perfil', 'Perfil'], ['/carteiras', 'Carteiras'], ['/favoritos', 'Favoritos'],
  ] as const },
]
for (const group of groups) test(`SPA: acesso direto e refresh das rotas ${group.name}`, async ({ page }) => {
  await reset(page)
  if (group.private) await login(page, 'alice', '/perfil')
  for (const [path, title] of group.routes) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: title, exact: typeof title === 'string' })).toBeVisible()
    expect((await page.reload())?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: title, exact: typeof title === 'string' })).toBeVisible()
  }
})
