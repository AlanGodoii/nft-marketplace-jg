import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { walletInputSchema } from '@/contracts/wallet'
import { commerceSnapshot, transact } from '../commerce-db'
import { walletConnectionOutcome } from '../scenarios'
import { apiFailure, identity, operation, parseBody, unauthorized } from './shared'
export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    const failed = await operation(request, 'wallets.read'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    return HttpResponse.json({ items: commerceSnapshot().wallets[current.user.id] ?? [] })
  }),
  ...(['POST', 'PATCH'] as const).map(method => http[method === 'POST' ? 'post' : 'patch'](method === 'POST' ? '/api/wallets' : '/api/wallets/:walletId', async ({ request, params }) => {
    const failed = await operation(request, method === 'POST' ? 'wallets.create' : 'wallets.update'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    const parsed = await parseBody(request, walletInputSchema); if (parsed.error) return parsed.error
    const result = transact(state => {
      const items = state.wallets[current.user!.id] ??= []
      const existing = method === 'PATCH' ? items.find(item => item.id === params.walletId) : undefined
      if (method === 'PATCH' && !existing) return { error: 'missing' }
      const input = parsed.data!
      if (items.some(item => item.id !== existing?.id && (item.role === input.role || (item.network === input.network && item.address.toLowerCase() === input.address.toLowerCase())))) return { error: 'conflict' }
      const wallet = { ...input, id: existing?.id ?? crypto.randomUUID(), version: (existing?.version ?? 0) + 1 }
      if (existing) items[items.indexOf(existing)] = wallet; else items.push(wallet)
      return { wallet }
    })
    if (result.error === 'missing') return apiFailure(404, 'NOT_FOUND', 'Carteira não encontrada nesta conta.')
    if (result.error) return apiFailure(409, 'CONFLICT', 'Já existe uma carteira com este papel ou endereço.')
    return HttpResponse.json(result.wallet, { status: method === 'POST' ? 201 : 200 })
  })),
  http.post('/api/wallets/:walletId/connection', async ({ request, params }) => {
    const failed = await operation(request, 'wallets.connection'); if (failed) return failed
    const current = await identity(request); if (!current?.user || !current.tokenHash) return unauthorized()
    const parsed = await parseBody(request, z.object({ action: z.enum(['connect', 'disconnect']) }).strict()); if (parsed.error) return parsed.error
    const wallet = commerceSnapshot().wallets[current.user.id]?.find(item => item.id === params.walletId)
    if (!wallet) return apiFailure(404, 'NOT_FOUND', 'Carteira não encontrada nesta conta.')
    const status = parsed.data!.action === 'disconnect' ? 'disconnected' : walletConnectionOutcome()
    const connection = { status, walletId: wallet.id, network: wallet.network, connectionId: status === 'connected' ? crypto.randomUUID() : null }
    transact(state => { state.connections[current.tokenHash!] = { ...connection, walletVersion: wallet.version } })
    return HttpResponse.json(connection)
  }),
]
