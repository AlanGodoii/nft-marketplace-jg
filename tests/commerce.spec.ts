import { expect, test, type Page } from '@playwright/test'
import type { Scenario } from '../src/mocks/scenarios'

async function mock(page: Page, path: string, body: unknown = {}) {
  return page.evaluate(async ({ path, body }) => {
    const token = sessionStorage.getItem('kurio.auth.token')
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), 'X-Guest-ID': localStorage.getItem('kurio.guest.id') ?? '' }, body: JSON.stringify(body) })
    return { status: response.status, body: response.status === 204 ? null : await response.json() }
  }, { path, body })
}
async function configure(page: Page, scenario: Scenario) { expect((await mock(page, '/api/__mock/configure', scenario)).status).toBe(200) }
async function login(page: Page, who: 'alice' | 'bob' = 'alice', destination = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(destination)}`)
  await page.getByLabel('E-mail', { exact: true }).fill(`${who}@kurio.test`)
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveText(who === 'alice' ? 'Alice' : 'Bob')
}
async function logout(page: Page) {
  if (!await page.getByRole('button', { name: 'Sair', exact: true }).isVisible()) await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /SEJA DONO D[OA]/ })).toBeVisible()
}
async function detail(page: Page, id = 'nft-002') {
  await page.goto(`/nfts/${id}`)
  await expect(page.locator('.detail-info h1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeEnabled()
}
async function add(page: Page, id = 'nft-002', quantity = 1) {
  await detail(page, id)
  await page.getByLabel('Quantidade', { exact: true }).fill(String(quantity))
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
}
async function cart(page: Page, count: number) {
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-item')).toHaveCount(count)
  await expect(page.getByTestId('total')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  expect((await mock(page, '/api/__mock/reset', { name: 'normal', latencyMs: 20 })).status).toBe(200)
})

test('cadastro válido retorna ao destino e não persiste senha em texto puro', async ({ page }) => {
  await page.goto('/cadastro?redirect=%2Ffavoritos')
  await page.getByLabel('Nome', { exact: true }).fill('Nova Colecionadora')
  await page.getByLabel('E-mail', { exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Nova Colecionadora')
  const stored = await page.evaluate(() => localStorage.getItem('kurio.mock.commerce.v1'))
  expect(stored).not.toContain('NovaSenha123!')
  expect(stored).not.toContain('Kurio123!')
  expect(stored).toContain('passwordHash')
  await page.reload()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Nova Colecionadora')
})

test('cadastro duplicado exibe conflito 409 associado ao e-mail', async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByLabel('Nome', { exact: true }).fill('Outra Alice')
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Kurio123!')
  const response = page.waitForResponse(r => r.url().endsWith('/api/auth/register'))
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  expect((await response).status()).toBe(409)
  await expect(page.getByRole('alert')).toContainText('já está cadastrado')
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveAttribute('aria-invalid', 'true')
})

test('login válido, inválido e sessão persistente após refresh', async ({ page }) => {
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaErrada!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
  await page.reload()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
})

test('protege todas as rotas privadas e preserva retorno com parâmetros', async ({ page }) => {
  for (const path of ['/checkout', '/perfil', '/carteiras', '/favoritos', '/pedido/confirmacao']) {
    await page.goto(`${path}?origem=teste`)
    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(`${path}?origem=teste`)
  }
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/pedido\/confirmacao\?origem=teste/)
  await expect(page.getByRole('heading', { name: 'Confirmação do pedido', exact: true })).toBeVisible()
})

test('logout revoga sessão e protege novo acesso', async ({ page }) => {
  await login(page, 'alice', '/perfil')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador', exact: true })).toBeVisible()
  await logout(page)
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
})

test('expiração durante navegação exige login e retorna à rota original', async ({ page }) => {
  await login(page)
  await mock(page, '/api/__mock/session/expire')
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/perfil')
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador', exact: true })).toBeVisible()
})

test('expiração durante mutation privada limpa contexto e exige autenticação', async ({ page }) => {
  await login(page)
  await detail(page)
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeEnabled()
  await mock(page, '/api/__mock/session/expire')
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/nfts/nft-002')
  await expect(page.getByLabel('Usuário conectado')).toHaveCount(0)
})

test('tempo de sessão controlado revalida pela API e recebe 401', async ({ page }) => {
  await page.clock.install()
  await configure(page, { name: 'normal', latencyMs: 20, sessionTtlMs: 2000 })
  await login(page, 'alice', '/perfil')
  const expired = page.waitForResponse(r => r.url().endsWith('/api/auth/session') && r.status() === 401)
  await page.clock.fastForward(2200)
  expect((await expired).fromServiceWorker()).toBe(true)
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
})

test('troca de usuário mantém favoritos e carrinhos isolados', async ({ page }) => {
  await login(page)
  await add(page)
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeEnabled()
  await logout(page)
  await login(page, 'bob', '/favoritos')
  await expect(page.getByText('Você ainda não tem favoritos.', { exact: true })).toBeVisible()
  await cart(page, 0)
  await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
  await logout(page)
  await login(page, 'alice', '/favoritos')
  await expect(page.locator('.favorites-grid .nft-card h3')).toHaveText(['Sage Nomad #002'])
  await cart(page, 1)
})

test('acesso direto ao detalhe, galeria, edição e limite de quantidade', async ({ page }) => {
  await detail(page)
  await expect(page.getByRole('heading', { name: 'Sage Nomad #002', exact: true })).toBeVisible()
  await expect(page.getByText('Criador:', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Ver imagem 2' }).click()
  await expect(page.getByRole('button', { name: 'Ver imagem 2' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('Edição', { exact: true }).selectOption('edition-002-limited')
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveAttribute('max', '2')
  await page.getByLabel('Quantidade', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByText('A quantidade excede o estoque da edição.', { exact: true })).toBeVisible()
})

test('NFT inexistente e edição esgotada', async ({ page }) => {
  await page.goto('/nfts/nao-existe')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.goto('/nfts/nft-001')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #001' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toBeDisabled()
  await expect(page.getByText('Edição esgotada ou indisponível', { exact: true })).toBeVisible()
})

test('favoritos persistem após refresh e permitem remoção', async ({ page }) => {
  await login(page)
  await detail(page)
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeEnabled()
  await page.getByRole('button', { name: 'Remover dos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeEnabled()
})

test('atualização otimista e rollback real com erro 500', async ({ page }) => {
  await login(page)
  await detail(page)
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeEnabled()
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'favorites.add': { status: 500, latencyMs: 1200, times: 1 } } })
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('alert')).toContainText('estado anterior foi restaurado')
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeEnabled()
})

test('mutation pendente é encerrada ao trocar a sessão sem vazar favorito', async ({ page }) => {
  await login(page)
  await detail(page)
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeEnabled()
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'favorites.add': { latencyMs: 1800 } } })
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeDisabled()
  await logout(page)
  await login(page, 'bob', '/favoritos')
  await expect(page.getByText('Você ainda não tem favoritos.', { exact: true })).toBeVisible()
})

test('adiciona, combina mesma edição, altera quantidade, persiste e remove', async ({ page }) => {
  await add(page)
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await cart(page, 1)
  const row = page.getByTestId('cart-item')
  await expect(row.getByLabel('Quantidade', { exact: true })).toHaveValue('2')
  await row.getByLabel('Quantidade', { exact: true }).fill('3')
  await row.getByRole('button', { name: 'Salvar quantidade' }).click()
  await expect(page.getByTestId('subtotal')).toHaveText('0.87 ETH')
  await page.reload()
  await expect(page.getByTestId('cart-item').getByLabel('Quantidade', { exact: true })).toHaveValue('3')
  await page.getByRole('button', { name: 'Remover item' }).click()
  await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
  await expect(page.getByTestId('total')).toHaveText('0 ETH')
})

test('mescla carrinho visitante e usuário sem duplicar edição', async ({ page }) => {
  await login(page)
  await add(page)
  await logout(page)
  await add(page)
  await add(page, 'nft-003')
  await login(page, 'alice', '/carrinho')
  await expect(page.getByTestId('cart-item')).toHaveCount(2)
  const row = page.getByTestId('cart-item').filter({ hasText: 'Sage Nomad #002' })
  await expect(row.getByLabel('Quantidade', { exact: true })).toHaveValue('2')
  await logout(page)
  await cart(page, 0)
})

test('cupons válido, inválido, expirado e remoção usam cotação da API', async ({ page }) => {
  await add(page)
  await cart(page, 1)
  await page.getByLabel('Cupom', { exact: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByTestId('discount')).toHaveText('0.029 ETH')
  await expect(page.getByTestId('network-fee')).toHaveText('0.016 ETH')
  await expect(page.getByTestId('total')).toHaveText('0.277 ETH')
  for (const [code, message] of [['INVALIDO', 'Cupom inválido.'], ['EXPIRADO', 'Este cupom expirou.']]) {
    await page.getByLabel('Cupom', { exact: true }).fill(code)
    await page.getByRole('button', { name: 'Aplicar cupom' }).click()
    await expect(page.getByRole('alert')).toContainText(message)
    await expect(page.getByTestId('total')).toHaveText('0.277 ETH')
  }
  await page.getByRole('button', { name: 'Remover cupom' }).click()
  await expect(page.getByTestId('discount')).toHaveText('0 ETH')
  await expect(page.getByTestId('total')).toHaveText('0.306 ETH')
})

test('cálculos preservam ETH com 18 casas e múltiplas quantidades', async ({ page }) => {
  await add(page, 'nft-003', 3)
  await cart(page, 1)
  await expect(page.getByTestId('subtotal')).toHaveText('1.170000000000000003 ETH')
  await page.getByLabel('Cupom', { exact: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar cupom' }).click()
  await expect(page.getByTestId('total')).toHaveText('1.069000000000000003 ETH')
  await page.reload()
  await expect(page.getByTestId('total')).toHaveText('1.069000000000000003 ETH')
})

test('API rejeita quantidades negativas, fracionárias, acima do estoque e campos de proprietário', async ({ page }) => {
  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
  for (const [quantity, status] of [[-1, 400], [0.5, 400], [4, 409]]) {
    expect((await mock(page, '/api/cart/items', { nftId: 'nft-002', editionId: 'edition-002', quantity })).status).toBe(status)
  }
  expect((await mock(page, '/api/cart/items', { nftId: 'nft-002', editionId: 'edition-002', quantity: 1, userId: 'alice' })).status).toBe(400)
  await page.reload()
  await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
})

test('estoque alterado bloqueia adição sem perder itens existentes', async ({ page }) => {
  await add(page, 'nft-003')
  await detail(page)
  // Preserve the REST stale-stock race even when live updates are available.
  await mock(page, '/api/__mock/socket', { action: 'disconnect' })
  await mock(page, '/api/__mock/stock', { nftId: 'nft-002', editionId: 'edition-002', remaining: 0 })
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Quantidade indisponível')
  await cart(page, 1)
  await expect(page.getByTestId('cart-item')).toContainText('Neon Vessel #003')
})

test('falha transitória de carrinho preserva dados e permite tentar novamente', async ({ page }) => {
  await detail(page)
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'cart.add': { status: 500, times: 1 } } })
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Tente novamente')
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: false })).toBeVisible()
  await cart(page, 1)
})

test('erro de detalhe e recuperação real pela API', async ({ page }) => {
  await configure(page, { name: 'server-error', latencyMs: 20 })
  await page.goto('/nfts/nft-002')
  await expect(page.getByRole('alert')).toContainText('servidor do catálogo')
  await configure(page, { name: 'normal', latencyMs: 20 })
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Sage Nomad #002' })).toBeVisible()
})

test('login trata erro 500 e falha de conexão com nova tentativa', async ({ page }) => {
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'auth.login': { networkError: true, times: 1 } } })
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Verifique a conexão')
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'auth.login': { status: 500, times: 1 } } })
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Tente novamente')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
})

test('formulários por teclado, erros associados e controle de foco da galeria', async ({ page }) => {
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const email = page.getByLabel('E-mail', { exact: true })
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(await email.getAttribute('aria-describedby')).toBe('login-email-error')
  await email.fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByLabel('Senha', { exact: true }).press('Enter')
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
  await detail(page)
  const trigger = page.getByRole('button', { name: 'Ampliar arte do NFT' })
  await trigger.focus()
  await trigger.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

for (const width of [390, 768, 1440]) {
  test(`telas integradas sem overflow em ${width}px e skeletons sob latência`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await configure(page, { name: 'normal', latencyMs: 600 })
    await page.goto('/nfts/nft-002')
    await expect(page.getByText('Carregando detalhes do NFT', { exact: true })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Sage Nomad #002' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.goto('/carrinho')
    await expect(page.getByText('Carregando carrinho', { exact: true })).toBeAttached()
    await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.goto('/cadastro')
    if(width>=1024) await expect(page.getByRole('dialog')).toBeVisible()
    else await expect(page.getByRole('heading',{name:'Criar perfil de colecionador'})).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('API impede acesso de outra conta e revoga o token no logout', async ({ page }) => {
  await login(page)
  await add(page)
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeEnabled()
  const oldToken = await page.evaluate(() => sessionStorage.getItem('kurio.auth.token'))
  await logout(page)
  const revoked = await page.evaluate(async token => (await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })).status, oldToken)
  expect(revoked).toBe(401)
  await login(page, 'bob', '/favoritos')
  const result = await page.evaluate(async () => {
    const headers = { Authorization: `Bearer ${sessionStorage.getItem('kurio.auth.token')}`, 'Content-Type': 'application/json' }
    const favorites = await fetch('/api/favorites?userId=alice', { headers })
    const cart = await fetch('/api/cart/items/nft-002%3Aedition-002', { method: 'PATCH', headers, body: JSON.stringify({ quantity: 1 }) })
    return { favorites: await favorites.json(), cartStatus: cart.status }
  })
  expect(result.favorites.items).toEqual([])
  expect(result.cartStatus).toBe(404)
})

test('login encerra identidade visitante e rejeita escrita antiga após mesclagem', async ({ page }) => {
  await add(page)
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'cart.add': { latencyMs: 700 } } })
  const result = await page.evaluate(async () => {
    const headers = { 'X-Guest-ID': localStorage.getItem('kurio.guest.id')!, 'Content-Type': 'application/json' }
    const pending = fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify({ nftId: 'nft-003', editionId: 'edition-003', quantity: 1 }) })
    const signed = await fetch('/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'alice@kurio.test', password: 'Kurio123!' }) })
    const auth = await signed.json()
    const staleWrite = await pending
    const cart = await fetch('/api/cart', { headers: { Authorization: `Bearer ${auth.token}` } })
    return { status: staleWrite.status, cart: await cart.json() }
  })
  expect(result.status).toBe(401)
  expect(result.cart.items).toHaveLength(1)
  expect(result.cart.items[0].nftId).toBe('nft-002')
})

test('cotação rejeita estoque desatualizado e recupera após correção da quantidade', async ({ page }) => {
  await add(page, 'nft-002', 2)
  await mock(page, '/api/__mock/stock', { nftId: 'nft-002', editionId: 'edition-002', remaining: 1 })
  await page.goto('/carrinho')
  await expect(page.getByTestId('cart-item')).toHaveCount(1)
  await expect(page.getByText('O estoque ou cupom mudou. Revise os itens antes de continuar.', { exact: true })).toBeVisible()
  const row = page.getByTestId('cart-item')
  await row.getByLabel('Quantidade', { exact: true }).fill('1')
  await row.getByRole('button', { name: 'Salvar quantidade' }).click()
  await expect(page.getByTestId('total')).toHaveText('0.306 ETH')
})

test('falha ao verificar sessão oferece recuperação sem descartar credenciais', async ({ page }) => {
  await login(page)
  await configure(page, { name: 'normal', latencyMs: 20, faults: { 'auth.session': { status: 500 } } })
  await page.goto('/perfil')
  await expect(page.getByRole('alert')).toContainText('verificar a sessão')
  await configure(page, { name: 'normal', latencyMs: 20 })
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador', exact: true })).toBeVisible()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice')
})

test('retorno de login não permite redirecionar para domínio externo', async ({ page }) => {
  await login(page, 'alice', '//example.com')
  expect(new URL(page.url()).pathname).toBe('/')
  await expect(page.getByRole('heading', { name: /SEJA DONO D[OA]/ })).toBeVisible()
})
