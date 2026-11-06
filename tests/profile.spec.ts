import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { configure, login, request, reset } from './helpers/market'

test.beforeEach(async ({ page }) => { await reset(page); await login(page, 'alice', '/perfil'); await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue('Alice') })

test('perfil: edição persiste, atualiza sessão e preserva coleção/carteiras', async ({ page }) => {
  await page.getByLabel('Nome de exibição', { exact: true }).fill('Alice Colecionadora')
  await page.getByLabel('Nome de usuário', { exact: true }).fill('alice_nft')
  await page.getByLabel('Biografia').fill('Coleciono NFTs na Kurio.')
  await page.getByLabel('Website').fill('https://example.org/alice')
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Usuário conectado')).toHaveText('Alice Colecionadora')
  await page.reload()
  await expect(page.getByLabel('Nome de usuário', { exact: true })).toHaveValue('alice_nft')
  await expect(page.getByLabel('Biografia')).toHaveValue('Coleciono NFTs na Kurio.')
  expect((await request(page, '/api/wallets', 'GET')).body.items).toHaveLength(1)
})

test('perfil: validação, conflito409 e versão obsoleta não sobrescrevem dados', async ({ page }) => {
  await page.getByLabel('Nome de exibição', { exact: true }).fill('A')
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Nome de exibição', { exact: true }).fill('Alice')
  await page.getByLabel('E-mail', { exact: true }).fill('bob@kurio.test')
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.locator('#profile-email-error')).toContainText('já está em uso')
  const p = (await request(page, '/api/profile', 'GET')).body
  const input = { name: p.name, email: p.email, username: 'alice_1', bio: '', website: '', version: p.version }
  expect((await request(page, '/api/profile', 'PATCH', { ...input, userId: 'bob' })).status).toBe(400)
  expect((await request(page, '/api/profile', 'PATCH', input)).status).toBe(200)
  expect((await request(page, '/api/profile', 'PATCH', { ...input, name: 'Perdido' })).status).toBe(409)
  expect((await request(page, '/api/profile', 'GET')).body.name).toBe('Alice')
})

test('perfil: avatar válido persiste e pode ser removido', async ({ page }) => {
  await page.getByLabel('Imagem do avatar', { exact: true }).setInputFiles('tests/fixtures/avatar.png')
  await expect(page.getByRole('img', { name: 'Prévia do avatar selecionado' })).toBeVisible()
  await page.getByRole('button', { name: 'Salvar avatar', exact: true }).click()
  await expect(page.getByText('Avatar atualizado.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Avatar de Alice', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remover avatar', exact: true }).click()
  await expect(page.getByText('Avatar removido.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('img', { name: 'Nenhum avatar cadastrado' })).toBeVisible()
})

test('perfil: avatar recusa SVG, tamanho excessivo e conteúdo corrompido', async ({ page }) => {
  const input = page.getByLabel('Imagem do avatar', { exact: true })
  await input.setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') })
  await expect(page.locator('#avatar-error')).toContainText('PNG, JPEG ou WebP')
  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(262145) })
  await expect(page.locator('#avatar-error')).toContainText('256 KiB')
  const p = (await request(page, '/api/profile', 'GET')).body
  expect((await request(page, '/api/profile/avatar', 'PUT', { version: p.version, avatar: 'data:image/png;base64,aW52YWxpZA==' })).status).toBe(400)
  expect((await request(page, '/api/profile', 'GET')).body.avatar).toBeNull()
})

test('perfil: senha atual incorreta, nova senha, revogação e login real', async ({ page }) => {
  const oldToken = await page.evaluate(() => sessionStorage.getItem('kurio.auth.token'))
  await page.getByLabel('Senha atual', { exact: true }).fill('Errada123!')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaKurio456!')
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaKurio456!')
  await page.getByRole('button', { name: 'Alterar senha e sair' }).click()
  await expect(page.locator('#currentPassword-error')).toContainText('Senha atual incorreta')
  await page.getByLabel('Senha atual', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Alterar senha e sair' }).click()
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
  expect((await request(page, '/api/profile', 'GET', undefined, { Authorization: `Bearer ${oldToken}` })).status).toBe(401)
  await page.getByLabel('E-mail', { exact: true }).fill('alice@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  await page.getByLabel('Senha', { exact: true }).fill('NovaKurio456!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain('NovaKurio456!')
})

test('perfil: troca de usuário mantém dados e avatar privados', async ({ page }) => {
  await page.getByLabel('Biografia').fill('Privado da Alice')
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  const p = (await request(page, '/api/profile', 'GET')).body
  const avatar = `data:image/png;base64,${readFileSync('tests/fixtures/avatar.png').toString('base64')}`
  expect((await request(page, '/api/profile/avatar', 'PUT', { version: p.version, avatar })).status).toBe(200)
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Descubra o seu/ })).toBeVisible()
  await login(page, 'bob', '/perfil')
  await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue('Bob')
  await expect(page.getByLabel('Biografia')).toHaveValue('')
  await expect(page.getByRole('img', { name: 'Nenhum avatar cadastrado' })).toBeVisible()
  expect((await request(page, '/api/profile', 'GET')).body.id).toBe('bob')
})

test('perfil: erro de leitura e mutation permitem recuperação sem perder formulário', async ({ page }) => {
  await configure(page, { name: 'normal', latencyMs: 10, faults: { 'profile.read': { status: 500 } } })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await configure(page, { name: 'normal', latencyMs: 10 })
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByLabel('Biografia')).toBeVisible()
  await page.getByLabel('Biografia').fill('Não perder')
  await configure(page, { name: 'normal', latencyMs: 10, faults: { 'profile.update': { status: 500 } } })
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByRole('form', { name: 'Dados do perfil' }).getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Biografia')).toHaveValue('Não perder')
  await configure(page, { name: 'normal', latencyMs: 10 })
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
})

test('perfil: expiração durante edição exige novo login e não grava dados', async ({ page }) => {
  await page.getByLabel('Biografia').fill('Não autorizado')
  await configure(page, { name: 'normal', latencyMs: 10, faults: { 'profile.update': { latencyMs: 800 } } })
  const sent = page.waitForRequest(r => r.url().endsWith('/api/profile') && r.method() === 'PATCH')
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await sent
  await request(page, '/api/__mock/session/expire')
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
  await login(page, 'alice', '/perfil')
  await expect(page.getByLabel('Biografia')).toHaveValue('')
})
