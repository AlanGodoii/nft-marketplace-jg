import { expect, test, type Page } from '@playwright/test'
import Decimal from 'decimal.js'
import type { Scenario, MockRequest } from '../src/mocks/scenarios'

async function reset(page: Page, scenario: Scenario = { name: 'normal', latencyMs: 30 }) {
  const status = await page.evaluate(async config => {
    const response = await fetch('/api/__mock/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
    return response.status
  }, scenario)
  expect(status).toBe(200)
}
async function diagnostics(page: Page): Promise<{ requests: MockRequest[] }> {
  return page.evaluate(async () => (await fetch('/api/__mock/scenario')).json())
}
async function loaded(page: Page, count = 6) {
  await expect(page.locator('.nft-grid .nft-card h3')).toHaveCount(count)
  await expect(page.getByText('Atualizando catálogo…', { exact: true })).toHaveCount(0)
}
async function filters(page: Page) {
  if (await page.locator('.desktop-filters').isVisible()) return page.locator('.desktop-filters')
  const panel = page.locator('.mobile-filters')
  if (await panel.getAttribute('open') === null) await panel.locator('summary').click()
  return panel
}

// Scenario selection itself crosses MSW. Never page.route/route.fulfill or set React state.
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
  await reset(page)
})

test('carrega catálogo por Axios e handlers MSW com contratos completos', async ({ page }) => {
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/nfts')
  await page.goto('/')
  const response = await responsePromise
  expect(response.fromServiceWorker()).toBe(true)
  const body = await response.json()
  expect(body.total).toBe(36)
  expect(body.pageCount).toBe(6)
  expect(body.items[0].id).toBe('nft-036')
  expect(typeof body.items[0].price.amount).toBe('string')
  expect(body.items[0].editions[0].availability.remaining).toBeGreaterThanOrEqual(0)
  await loaded(page)
  await expect(page.locator('.nft-card h3').first()).toHaveText('Ivory Baron #036')
  await expect(page.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Próxima página' })).toBeEnabled()
  await page.locator('.nft-card-link').first().click()
  await expect(page).toHaveURL(/\/nfts\/nft-036/)
})

test('busca e reinicia paginação', async ({ page }) => {
  await page.goto('/?page=3')
  await loaded(page)
  await page.getByLabel('Buscar NFTs').pressSequentially('Emerald Ape')
  await expect(page.getByLabel('Buscar NFTs')).toHaveValue('Emerald Ape')
  await loaded(page)
  await expect(page.locator('.nft-card h3')).toHaveText([
    'Emerald Ape #031', 'Emerald Ape #025', 'Emerald Ape #019', 'Emerald Ape #013', 'Emerald Ape #007', 'Emerald Ape #001',
  ])
  expect(new URL(page.url()).searchParams.get('search')).toBe('Emerald Ape')
  expect(new URL(page.url()).searchParams.get('page')).toBe('1')
})

test('combina coleção, rede, disponibilidade e intervalo ETH', async ({ page }) => {
  await page.goto('/')
  await loaded(page)
  const panel = await filters(page)
  await panel.getByLabel('Coleção', { exact: true }).selectOption('genesis')
  await panel.getByLabel('Rede', { exact: true }).selectOption('polygon')
  await panel.getByLabel('Disponíveis para compra').check()
  await panel.getByLabel('Mínimo', { exact: true }).fill('0.1')
  await panel.getByLabel('Máximo', { exact: true }).fill('1.5')
  await loaded(page, 2)
  await expect(page.locator('.nft-card h3')).toHaveText(['Emerald Ape #013', 'Cosmic Bloom #004'])
  const query = new URL(page.url()).searchParams
  expect(query.get('collection')).toBe('genesis')
  expect(query.get('network')).toBe('polygon')
  expect(query.get('availableOnly')).toBe('true')
  await panel.getByRole('button', { name: 'Limpar', exact: true }).click()
  await loaded(page)
  await expect(page.getByText('36 NFTs encontrados', { exact: true })).toBeVisible()
})

test('ordena preço crescente e decrescente com precisão decimal', async ({ page }) => {
  await page.goto('/')
  await loaded(page)
  await page.getByLabel('Ordenar por', { exact: true }).selectOption('price-asc')
  await loaded(page)
  let amounts = await page.locator('.nft-card .font-bold.text-primary').allTextContents()
  expect(amounts[0]).toBe('0.19 ETH')
  expect(amounts.every((amount, index) => index === 0 || new Decimal(amount.split(' ')[0]).gte(amounts[index - 1].split(' ')[0]))).toBe(true)
  await page.getByLabel('Ordenar por', { exact: true }).selectOption('price-desc')
  await loaded(page)
  amounts = await page.locator('.nft-card .font-bold.text-primary').allTextContents()
  expect(amounts[0]).toBe('2.29 ETH')
  expect(amounts.every((amount, index) => index === 0 || new Decimal(amount.split(' ')[0]).lte(amounts[index - 1].split(' ')[0]))).toBe(true)
})

test('filtra e ordena diferenças além da precisão de number', async ({ page }) => {
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/nfts')
  await page.goto('/?minPrice=0.390000000000000001&maxPrice=0.390000000000000002&sort=price-asc')
  expect(new URL((await responsePromise).url()).searchParams.get('minPrice')).toBe('0.390000000000000001')
  await loaded(page)
  await expect(page.locator('.nft-card h3')).toHaveText(['Neon Vessel #003', 'Neon Vessel #015', 'Neon Vessel #027', 'Cosmic Bloom #004', 'Cosmic Bloom #016', 'Cosmic Bloom #028'])
})

test('paginação respeita limites e preserva parâmetros', async ({ page }) => {
  await page.goto('/?sort=recent')
  await loaded(page)
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await loaded(page)
  await expect(page.locator('.nft-card h3').first()).toHaveText('Ivory Baron #030')
  await expect(page.getByText('Página 2 de 6', { exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('sort')).toBe('recent')
  await page.getByRole('button', { name: 'Página anterior' }).click()
  await loaded(page)
  await expect(page.locator('.nft-card h3').first()).toHaveText('Ivory Baron #036')
  await page.goto('/?page=6')
  await loaded(page)
  await expect(page.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
})

test('refresh e histórico restauram os filtros da URL', async ({ page }) => {
  await page.goto('/?search=Nomad&collection=nomads&network=polygon&sort=price-asc&page=2&pageSize=2')
  await loaded(page, 2)
  const initialNames = await page.locator('.nft-card h3').allTextContents()
  const initialUrl = page.url()
  await page.reload()
  await loaded(page, 2)
  await expect(page.locator('.nft-card h3')).toHaveText(initialNames)
  await expect(page.getByLabel('Buscar NFTs')).toHaveValue('Nomad')
  const panel = await filters(page)
  await expect(panel.getByLabel('Coleção', { exact: true })).toHaveValue('nomads')
  await expect(panel.getByLabel('Rede', { exact: true })).toHaveValue('polygon')
  await page.getByLabel('Ordenar por', { exact: true }).selectOption('price-desc')
  await loaded(page, 2)
  expect(new URL(page.url()).searchParams.get('page')).toBe('1')
  const changedUrl = page.url()
  await page.goBack()
  await loaded(page, 2)
  await expect(page).toHaveURL(initialUrl)
  await expect(page.locator('.nft-card h3')).toHaveText(initialNames)
  await page.goForward()
  await loaded(page, 2)
  await expect(page).toHaveURL(changedUrl)
  await expect(page.getByLabel('Ordenar por', { exact: true })).toHaveValue('price-desc')
})

test('resultado vazio por busca e por cenário configurável', async ({ page }) => {
  await page.goto('/')
  await loaded(page)
  await page.getByLabel('Buscar NFTs').fill('nao-existe')
  await expect(page.getByText('Nenhum NFT encontrado', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  await reset(page, { name: 'empty' })
  await page.goto('/')
  await expect(page.getByText('Nenhum NFT encontrado', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Buscar NFTs')).toBeEnabled()
})

test('erro HTTP e recuperação pelo botão de nova tentativa', async ({ page }) => {
  await reset(page, { name: 'server-error', latencyMs: 20 })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('O servidor do catálogo está indisponível')
  expect((await diagnostics(page)).requests.every(request => request.outcome === '500')).toBe(true)
  await reset(page)
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await loaded(page)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('shimmer na rede lenta e preferência por movimento reduzido', async ({ page }) => {
  await reset(page, { name: 'slow', latencyMs: 1800 })
  await page.goto('/')
  await expect(page.getByText('Carregando catálogo de NFTs', { exact: true })).toBeAttached()
  const shimmer = page.locator('.nft-grid .skeleton-shimmer').first()
  await expect(shimmer).toBeVisible()
  expect(await shimmer.evaluate(element => getComputedStyle(element, '::after').animationName)).toBe('skeleton-shimmer')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await shimmer.evaluate(element => getComputedStyle(element, '::after').animationName)).toBe('none')
  await loaded(page)
})

test('atualização em segundo plano mantém conteúdo e anuncia progresso', async ({ page }) => {
  await page.goto('/')
  await loaded(page)
  const original = await page.locator('.nft-card h3').allTextContents()
  await reset(page, { name: 'slow', latencyMs: 1100 })
  await page.getByRole('button', { name: 'Atualizar catálogo' }).click()
  await expect(page.getByText('Atualizando catálogo…', { exact: true })).toBeVisible()
  await expect(page.locator('.nft-card h3')).toHaveText(original)
  await loaded(page)
  expect((await diagnostics(page)).requests.some(request => request.outcome === '200')).toBe(true)
})

test('respostas fora de ordem não substituem a busca mais recente', async ({ page }) => {
  await page.goto('/')
  await loaded(page)
  await reset(page, { name: 'out-of-order', delaysBySearch: { Emerald: 1000, Sage: 80 }, latencyMs: 20 })
  const canceled: string[] = []
  page.on('requestfailed', request => { if (new URL(request.url()).searchParams.get('search') === 'Emerald') canceled.push(request.failure()?.errorText ?? '') })
  await page.getByLabel('Buscar NFTs').fill('Emerald')
  await expect.poll(async () => (await diagnostics(page)).requests.some(request => request.search === 'Emerald')).toBe(true)
  await page.getByLabel('Buscar NFTs').fill('Sage')
  await loaded(page)
  await expect(page.locator('.nft-card h3')).toHaveText(['Sage Nomad #032', 'Sage Nomad #026', 'Sage Nomad #020', 'Sage Nomad #014', 'Sage Nomad #008', 'Sage Nomad #002'])
  await expect.poll(async () => (await diagnostics(page)).requests.find(request => request.search === 'Emerald')?.completedAt).toBeTruthy()
  await expect.poll(() => canceled.length).toBeGreaterThan(0)
  const { requests } = await diagnostics(page)
  expect(requests.find(request => request.search === 'Emerald')!.completedAt!).toBeGreaterThan(requests.find(request => request.search === 'Sage')!.completedAt!)
  await expect(page.locator('.nft-card h3').first()).toHaveText('Sage Nomad #032')
  expect(new URL(page.url()).searchParams.get('search')).toBe('Sage')
})

test('contratos de detalhe, 404, validação e barra final passam pelo MSW', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const get = async (url: string) => { const response = await fetch(url); return { status: response.status, body: await response.json() } }
    return {
      detail: await get('/api/nfts/nft-001'), missing: await get('/api/nfts/nao-existe'),
      invalid: await get('/api/nfts?page=-1'), range: await get('/api/nfts?minPrice=2&maxPrice=1'),
      slash: await get('/api/nfts/'),
    }
  })
  expect(result.detail.status).toBe(200)
  expect(result.detail.body.item.editions[0].availability.status).toBe('sold-out')
  expect(result.missing).toMatchObject({ status: 404, body: { error: { code: 'NOT_FOUND' } } })
  expect(result.invalid).toMatchObject({ status: 400, body: { error: { code: 'VALIDATION_ERROR' } } })
  expect(result.range.status).toBe(400)
  expect(result.slash.body.total).toBe(36)
})

test('filtros inválidos exibem erro corrigível e URL inválida é normalizada', async ({ page }) => {
  await page.goto('/?page=-2&pageSize=999&sort=invalido')
  await loaded(page)
  const panel = await filters(page)
  await panel.getByLabel('Mínimo', { exact: true }).fill('2')
  await panel.getByLabel('Máximo', { exact: true }).fill('1')
  await expect(page.getByRole('alert')).toContainText('O preço mínimo não pode ser maior')
  await panel.getByLabel('Máximo', { exact: true }).fill('3')
  await loaded(page, 3)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('reset restaura cenário normal e descarta diagnósticos anteriores', async ({ page }) => {
  await reset(page, { name: 'empty', latencyMs: 10 })
  await page.goto('/')
  await expect(page.getByText('Nenhum NFT encontrado', { exact: true })).toBeVisible()
  await reset(page)
  expect((await diagnostics(page)).requests).toEqual([])
  await page.reload()
  await loaded(page)
  await expect(page.getByText('36 NFTs encontrados', { exact: true })).toBeVisible()
})


test('falha de conexão é recuperável sem dados fictícios', async ({ page }) => {
  await reset(page, { name: 'network-error', latencyMs: 10 })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Verifique a conexão')
  await expect(page.locator('.nft-card h3')).toHaveCount(0)
  await reset(page)
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await loaded(page)
})

test('retry recupera falha transitória e reset rejeita JSON inválido', async ({ page }) => {
  await reset(page, { name: 'transient-error', latencyMs: 10 })
  await page.goto('/')
  await loaded(page)
  const { requests } = await diagnostics(page)
  expect(requests.map(request => request.outcome)).toEqual(['500', '200'])
  const invalid = await page.evaluate(async () => (await fetch('/api/__mock/reset', { method: 'POST', body: 'invalid-json' })).status)
  expect(invalid).toBe(400)
  expect((await diagnostics(page)).requests).toHaveLength(2)
})
