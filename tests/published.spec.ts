import { test, expect } from './helpers/published-test'
import { add, apiQuote, configure, login, request, reset, review } from './helpers/market'

test.beforeEach(async ({ page }) => reset(page))

const routes = [
  ['/', /Descubra o seu/, false], ['/nfts/nft-002', 'Sage Nomad #002', false],
  ['/carrinho', 'Carrinho', false], ['/login', 'Login', false], ['/cadastro', 'Cadastro', false],
  ['/checkout', 'Checkout', true], ['/perfil', 'Perfil', true], ['/carteiras', 'Carteiras', true],
  ['/pedido/confirmacao', 'Confirmação do pedido', true], ['/favoritos', 'Favoritos', true],
] as const
for (const [path, title, privateRoute] of routes) test(`publicado: acesso direto e refresh ${path}`, async ({ page }) => {
  if (privateRoute) await login(page, 'alice', path)
  expect((await page.goto(path))?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: title, exact: typeof title === 'string' })).toBeVisible()
  expect((await page.reload())?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: title, exact: typeof title === 'string' })).toBeVisible()
  expect(await page.evaluate(() => location.protocol)).toBe('https:')
})

test('publicado: MSW controla APIs e cliente Socket.IO conecta na origem HTTPS', async ({ page }) => {
  const apiResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/nfts')
  await page.goto('/')
  const response = await apiResponse
  expect(response.status()).toBe(200)
  expect(response.fromServiceWorker()).toBe(true)
  expect((await response.json()).total).toBe(36)
  await expect(page.locator('.nft-card')).toHaveCount(6)
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  const workers = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(r => ({ scope: r.scope, state: r.active?.state })))
  expect(workers).toContainEqual({ scope: `${new URL(page.url()).origin}/`, state: 'activated' })
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.engineOpens).toBeGreaterThan(0); expect(stats.namespaceConnects).toBeGreaterThan(0)
})

test('publicado: login inválido/válido, refresh da sessão e logout', async ({ page }) => {
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Incorreta123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
  await page.reload()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
})

test('publicado: catálogo → carrinho visitante → login → checkout → recibo confirmado', async ({ page }, testInfo) => {
  await page.goto('/?search=Sage%20Nomad%20%23002')
  await page.locator('a.nft-card-link').click()
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await page.goto('/carrinho')
  await expect(page.getByTestId('total')).toHaveText('0.306 ETH')
  await page.reload()
  await expect(page.getByTestId('cart-item')).toHaveCount(1)
  await page.getByRole('link', { name: 'Revisar no checkout' }).click()
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible()
  await configure(page, { name: 'normal', latencyMs: 10, orderDelayMs: 1800 })
  await review(page)
  const created = page.waitForResponse(r => new URL(r.url()).pathname === '/api/orders' && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  expect((await created).status()).toBe(201)
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  await expect(page.getByTestId('order-receipt')).toHaveCount(0)
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  await expect(page.getByTestId('order-receipt').getByTestId('checkout-total')).toHaveText('0.306 ETH')
  const id = new URL(page.url()).searchParams.get('orderId')!
  const order = (await request(page, `/api/orders/${id}`, 'GET')).body
  expect(order.status).toBe('confirmed'); expect(order.snapshot.total).toBe('0.306')
  expect((await request(page, '/api/cart', 'GET')).body.items).toHaveLength(0)
  await page.reload(); await expect(page.getByTestId('order-receipt')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('receipt.png'), fullPage: true })
  await testInfo.attach('confirmed-order', { body: JSON.stringify({ id, status: order.status, total: order.snapshot.total }), contentType: 'application/json' })
})

test('publicado: nft.updated invalida cotação e exige novo aceite', async ({ page }) => {
  await login(page); await add(page); await review(page)
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  const changed = await request(page, '/api/__mock/nft', 'POST', { nftId: 'nft-002', editionId: 'edition-002', price: '0.49' })
  expect(changed.status).toBe(200)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(/A cotação anterior foi invalidada/)).toBeVisible()
  await page.getByRole('button', { name: 'Revalidar e revisar compra' }).click()
  await expect(page.getByRole('dialog').getByTestId('checkout-total')).toHaveText('0.506 ETH')
  await expect(page.getByRole('dialog').getByRole('checkbox')).not.toBeChecked()
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.receipts).toContainEqual({ eventId: changed.body.event.eventId, status: 'accepted' })
})

test('publicado: pedido confirma offline e reconexão recupera o mesmo pedido', async ({ page }) => {
  await login(page); await add(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  await review(page); await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  const id = new URL(page.url()).searchParams.get('orderId')!
  const opens = (await request(page, '/api/__mock/socket/stats', 'GET')).body.engineOpens
  await request(page, '/api/__mock/socket', 'POST', { action: 'disconnect' })
  await expect(page.getByTestId('realtime-status')).toContainText('Reconectando')
  await expect.poll(async () => (await request(page, '/api/__mock/socket/stats', 'GET')).body.engineOpens).toBeGreaterThan(opens)
  expect((await request(page, `/api/__mock/orders/${id}/settle`, 'POST', { status: 'confirmed' })).status).toBe(200)
  await expect(page.getByTestId('order-receipt')).toHaveCount(0)
  const reads: string[] = []
  page.on('request', r => { if (r.method() === 'GET' && new URL(r.url()).pathname === `/api/orders/${id}`) reads.push(r.url()) })
  await request(page, '/api/__mock/socket', 'POST', { action: 'resume' })
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  expect(reads.length).toBeGreaterThan(0)
  expect(new URL(page.url()).searchParams.get('orderId')).toBe(id)
  expect((await request(page, '/api/orders', 'GET')).body.items).toHaveLength(1)
})

test('publicado: Alice/Bob isolam dados privados, pedidos e eventos', async ({ page }) => {
  await login(page); await add(page)
  const savedFavorite = page.waitForResponse(r => new URL(r.url()).pathname === '/api/favorites/nft-002' && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Adicionar aos favoritos', exact: true }).click()
  expect((await savedFavorite).status()).toBe(200)
  expect((await request(page, '/api/favorites', 'GET')).body.items).toHaveLength(1)
  const aliceProfile = (await request(page, '/api/profile', 'GET')).body
  expect((await request(page, '/api/profile', 'PATCH', { version: aliceProfile.version, name: aliceProfile.name, email: aliceProfile.email, username: aliceProfile.username, website: aliceProfile.website, bio: 'Dados privados da Alice' })).status).toBe(200)
  const { input } = await apiQuote(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  const created = await request(page, '/api/orders', 'POST', input, { 'Idempotency-Key': 'published-private-order' })
  expect(created.status).toBe(201)
  const order = created.body
  const sessionId = (await request(page, '/api/__mock/socket/stats', 'GET')).body.sessionId
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Descubra o seu/ })).toBeVisible()
  await login(page, 'bob', '/pedido/confirmacao')
  await expect(page.getByText('Nenhum pedido selecionado. Você ainda não tem pedidos.')).toBeVisible()
  expect((await request(page, `/api/orders/${order.id}`, 'GET')).status).toBe(404)
  expect((await request(page, '/api/cart', 'GET')).body.items).toHaveLength(0)
  expect((await request(page, '/api/favorites', 'GET')).body.items).toHaveLength(0)
  const bobProfile = (await request(page, '/api/profile', 'GET')).body
  expect(bobProfile.id).toBe('bob'); expect(bobProfile.bio).toBe('')
  expect((await request(page, '/api/wallets', 'GET')).body.items[0].address).toBe(`0x${'2'.repeat(40)}`)
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  await request(page, '/api/__mock/socket/event', 'POST', { audience: 'all', event: { type: 'order.updated', eventId: 'published-private-wrong-session', resourceId: order.id, version: order.version, userId: 'alice', sessionId, payload: order } })
  await expect(page.getByTestId('order-receipt')).toHaveCount(0)
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.receipts).toContainEqual({ eventId: 'published-private-wrong-session', status: 'ignored' })
  expect(stats.active).toBe(1)
})
