import { expect, test } from '@playwright/test'
import { add, configure, login, request, reset, review } from './helpers/market'
test.beforeEach(async ({ page }) => reset(page))

test('D: handshake e nft.updated passam pelo cliente real e invalidam cotação', async ({ page }) => {
  await login(page); await add(page)
  await review(page)
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  const changed = await request(page, '/api/__mock/nft', 'POST', { nftId: 'nft-002', editionId: 'edition-002', price: '0.49' })
  expect(changed.status).toBe(200)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(/A cotação anterior foi invalidada/)).toBeVisible()
  await page.getByRole('button', { name: 'Revalidar e revisar compra' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByTestId('checkout-total')).toHaveText('0.506 ETH')
  await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.engineOpens).toBeGreaterThan(0)
  expect(stats.namespaceConnects).toBeGreaterThan(0)
  expect(stats.receipts).toContainEqual({ eventId: changed.body.event.eventId, status: 'accepted' })
})

test('D: order.updated confirma pelo socket sem polling de pedido', async ({ page }) => {
  await login(page); await add(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  await review(page)
  await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  const id = new URL(page.url()).searchParams.get('orderId')!
  await expect(page.getByRole('button', { name: 'Consultar estado do pedido' })).toBeEnabled()
  await page.clock.install()
  const reads: string[] = []
  page.on('request', request => { if (request.method() === 'GET' && new URL(request.url()).pathname === `/api/orders/${id}`) reads.push(request.url()) })
  await page.clock.fastForward(2500)
  expect(reads).toHaveLength(0)
  await request(page, `/api/__mock/orders/${id}/settle`, 'POST', { status: 'confirmed' })
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  expect(reads.length).toBeGreaterThan(0)
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.receipts.some((receipt: { eventId: string; status: string }) => receipt.eventId.startsWith(`order:${id}:2:`) && receipt.status === 'accepted')).toBe(true)
})

test('D: catálogo, detalhe e carrinho atualizam por eventos, duplicatas e versões antigas são ignoradas', async ({ page }) => {
  await login(page); await add(page)
  await page.goto('/?search=Sage%20Nomad%20%23002')
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  await expect(page.locator('a.nft-card-link')).toContainText('0.29 ETH')
  const original = (await request(page, '/api/nfts/nft-002', 'GET')).body.item
  const change = await request(page, '/api/__mock/nft', 'POST', { nftId: 'nft-002', editionId: 'edition-002', price: '0.59' })
  await expect(page.locator('a.nft-card-link')).toContainText('0.59 ETH')
  expect((await request(page, '/api/__mock/socket/event', 'POST', { event: change.body.event })).status).toBe(200)
  await request(page, '/api/__mock/socket/event', 'POST', { event: { type: 'nft.updated', eventId: 'old-nft-001', resourceId: original.id, version: original.version, payload: original } })
  await expect(page.locator('a.nft-card-link')).toContainText('0.59 ETH')
  await expect.poll(async () => (await request(page, '/api/__mock/socket/stats', 'GET')).body.receipts).toContainEqual({ eventId: change.body.event.eventId, status: 'ignored' })
  let stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.receipts).toContainEqual({ eventId: 'old-nft-001', status: 'ignored' })
  await page.locator('a.nft-card-link').click()
  await expect(page.locator('.detail-info')).toContainText('0.59 ETH')
  const detailChange = await request(page, '/api/__mock/nft', 'POST', { nftId: 'nft-002', editionId: 'edition-002', price: '0.69' })
  await expect(page.locator('.detail-info')).toContainText('0.69 ETH')
  await expect.poll(async () => (await request(page, '/api/__mock/socket/stats', 'GET')).body.receipts).toContainEqual({ eventId: detailChange.body.event.eventId, status: 'accepted' })
  await page.goto('/carrinho')
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  await expect(page.getByTestId('total')).toHaveText('0.706 ETH')
  const cartChange = await request(page, '/api/__mock/nft', 'POST', { nftId: 'nft-002', editionId: 'edition-002', price: '0.79' })
  await expect(page.getByTestId('total')).toHaveText('0.806 ETH')
  await expect(page.getByTestId('cart-item')).toContainText('0.79 ETH')
  stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.receipts).toContainEqual({ eventId: cartChange.body.event.eventId, status: 'accepted' })
})

test('D: estoque esgotado via socket bloqueia revisão de checkout', async ({ page }) => {
  await login(page); await add(page); await review(page)
  await request(page, '/api/__mock/stock', 'POST', { nftId: 'nft-002', editionId: 'edition-002', remaining: 0 })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(/Edição indisponível ou estoque esgotado/)).toBeVisible()
  await page.getByRole('button', { name: 'Revalidar e revisar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Estoque, edição ou cupom indisponível' })).toBeVisible()
  expect((await request(page, '/api/orders', 'GET')).body.items).toHaveLength(0)
})

test('D: pedido muda offline e reconexão reconcilia o mesmo pedido por REST', async ({ page }) => {
  await login(page); await add(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  await review(page)
  await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  const id = new URL(page.url()).searchParams.get('orderId')!
  const openedBefore = (await request(page, '/api/__mock/socket/stats', 'GET')).body.engineOpens
  await request(page, '/api/__mock/socket', 'POST', { action: 'disconnect' })
  await expect(page.getByTestId('realtime-status')).toContainText('Reconectando')
  await expect.poll(async () => (await request(page, '/api/__mock/socket/stats', 'GET')).body.engineOpens).toBeGreaterThan(openedBefore)
  await request(page, `/api/__mock/orders/${id}/settle`, 'POST', { status: 'confirmed' })
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  await expect(page.getByTestId('order-receipt')).toHaveCount(0)
  const reads: string[] = []
  page.on('request', request => { if (request.method() === 'GET' && new URL(request.url()).pathname === `/api/orders/${id}`) reads.push(request.url()) })
  await request(page, '/api/__mock/socket', 'POST', { action: 'resume' })
  await expect(page.getByTestId('realtime-status')).toContainText('Atualizações ao vivo conectadas.')
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  expect(reads.length).toBeGreaterThan(0)
  expect(new URL(page.url()).searchParams.get('orderId')).toBe(id)
  expect((await request(page, '/api/orders', 'GET')).body.items).toHaveLength(1)
})

test('D: refresh offline de pedido pendente recupera confirmação persistida sem duplicar', async ({ page }) => {
  await login(page); await add(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  await review(page)
  await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  const id = new URL(page.url()).searchParams.get('orderId')!
  await request(page, '/api/__mock/socket', 'POST', { action: 'disconnect' })
  await request(page, `/api/__mock/orders/${id}/settle`, 'POST', { status: 'confirmed' })
  await page.reload()
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('orderId')).toBe(id)
  expect((await request(page, '/api/orders', 'GET')).body.items).toHaveLength(1)
})

test('D: eventos antigos e duplicados não regridem pedido terminal ou limpam carrinho novamente', async ({ page }) => {
  await login(page); await add(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  await review(page)
  await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  const id = new URL(page.url()).searchParams.get('orderId')!
  const pending = (await request(page, `/api/orders/${id}`, 'GET')).body
  await request(page, `/api/__mock/orders/${id}/settle`, 'POST', { status: 'confirmed' })
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  await request(page, '/api/cart/items', 'POST', { nftId: 'nft-002', editionId: 'edition-002', quantity: 1 })
  const order = (await request(page, `/api/orders/${id}`, 'GET')).body
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  const event = { type: 'order.updated', eventId: `order:${id}:2:${stats.sessionId.slice(0, 12)}`, resourceId: id, version: 2, userId: 'alice', sessionId: stats.sessionId, payload: order }
  await request(page, '/api/__mock/socket/event', 'POST', { event })
  await request(page, '/api/__mock/socket/event', 'POST', { event: { ...event, eventId: 'older-order-packet', version: 1, payload: pending } })
  const regressing = { ...pending, version: 3 }
  await request(page, '/api/__mock/socket/event', 'POST', { event: { ...event, eventId: 'terminal-regression-packet', version: 3, payload: regressing } })
  await expect(page.getByTestId('order-receipt')).toBeVisible()
  expect((await request(page, '/api/cart', 'GET')).body.items[0].quantity).toBe(1)
  const after = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  for (const eventId of [event.eventId, 'older-order-packet', 'terminal-regression-packet']) expect(after.receipts).toContainEqual({ eventId, status: 'ignored' })
})

test('D: troca de usuário encerra socket anterior e rejeita evento privado de outra sessão', async ({ page }) => {
  await login(page); await add(page)
  await configure(page, { name: 'normal', latencyMs: 10, orderOutcome: 'pending' })
  await review(page)
  await page.getByRole('button', { name: 'Finalizar compra', exact: true }).click()
  await expect(page.getByTestId('order-status')).toHaveText('Pedido pendente')
  const id = new URL(page.url()).searchParams.get('orderId')!
  const order = (await request(page, `/api/orders/${id}`, 'GET')).body
  const aliceSession = (await request(page, '/api/__mock/socket/stats', 'GET')).body.sessionId
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Descubra o seu/ })).toBeVisible()
  await login(page, 'bob', '/pedido/confirmacao')
  await expect(page.getByText('Nenhum pedido selecionado. Você ainda não tem pedidos.')).toBeVisible()
  await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport', 'websocket')
  await request(page, '/api/__mock/socket/event', 'POST', { audience: 'all', event: { type: 'order.updated', eventId: 'private-wrong-session', resourceId: id, version: order.version, userId: 'alice', sessionId: aliceSession, payload: order } })
  await expect(page.getByTestId('order-receipt')).toHaveCount(0)
  const stats = (await request(page, '/api/__mock/socket/stats', 'GET')).body
  expect(stats.receipts).toContainEqual({ eventId: 'private-wrong-session', status: 'ignored' })
  expect(stats.active).toBe(1)
  expect((await request(page, `/api/orders/${id}`, 'GET')).status).toBe(404)
})
