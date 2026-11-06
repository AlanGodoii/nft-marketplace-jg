import { expect, type Page } from '@playwright/test'
export async function request(page: Page, path: string, method = 'POST', data?: unknown, extra: Record<string, string> = {}) {
  return page.evaluate(async ({ path, method, data, extra }) => {
    const token = sessionStorage.getItem('kurio.auth.token')
    const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), 'X-Guest-ID': localStorage.getItem('kurio.guest.id') ?? '', ...extra }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) })
    return { status: response.status, body: response.status === 204 ? null : await response.json() }
  }, { path, method, data, extra })
}
export async function reset(page: Page) {
  await page.goto('/login'); await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
  expect((await request(page, '/api/__mock/reset', 'POST', { name: 'normal', latencyMs: 10 })).status).toBe(200)
}
export async function login(page: Page, who = 'alice', destination = '/carteiras') {
  await page.goto(`/login?redirect=${encodeURIComponent(destination)}`)
  await page.getByLabel('E-mail', { exact: true }).fill(`${who}@kurio.test`)
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveText(who === 'alice' ? 'Alice' : 'Bob')
}
export async function add(page: Page, id = 'nft-002', quantity = 1) {
  await page.goto(`/nfts/${id}`)
  await page.getByLabel('Quantidade', { exact: true }).fill(String(quantity))
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
}
export async function configure(page: Page, config: unknown) {
  expect((await request(page, '/api/__mock/configure', 'POST', config)).status).toBe(200)
}
export async function review(page: Page) {
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await expect(page.getByText('Carteira conectada (simulação).')).toBeVisible()
  await page.getByRole('button', { name: 'Revalidar e revisar compra' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('checkbox').check()
}
export async function apiQuote(page: Page) {
  const wallet = (await request(page, '/api/wallets', 'GET')).body.items[0]
  const connection = await request(page, `/api/wallets/${wallet.id}/connection`, 'POST', { action: 'connect' })
  const cart = (await request(page, '/api/cart', 'GET')).body
  const response = await request(page, '/api/checkout/quote', 'POST', { walletId: wallet.id, network: wallet.network, collector: wallet.collector, items: cart.items.map((item: { id: string; quantity: number }) => ({ itemId: item.id, quantity: item.quantity })) })
  expect(response.status).toBe(200)
  return { quote: response.body, input: { quoteId: response.body.id, connectionId: connection.body.connectionId } }
}
