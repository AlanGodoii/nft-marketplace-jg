import { publishNft, resetSocketDiagnostics } from '../socket-server'
import { clearOrderTimers } from '../order-domain'
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { resetCommerce, transact } from '../commerce-db'
import { apiFailure, identity } from './shared'
import { getMockDatabase } from '../db'
import { configureScenario, scenarioSchema, scenarioSnapshot } from '../scenarios'

export const scenarioHandlers = [
  http.post('/api/__mock/configure', async ({ request }) => {
    let body: unknown
    try { body = await request.json() } catch { return apiFailure(400, 'VALIDATION_ERROR', 'Informe um JSON válido.') }
    const parsed = scenarioSchema.safeParse(body)
    return parsed.success ? HttpResponse.json({ config: configureScenario(parsed.data) }) : HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Cenário inválido.' } }, { status: 400 })
  }),
  http.post('/api/__mock/session/expire', async ({ request }) => {
    const current = await identity(request)
    if (current?.user) transact(state => { for (const session of state.sessions) if (session.tokenHash === current.tokenHash) session.expiresAt = Date.now() - 1 })
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('/api/__mock/stock', async ({ request }) => {
    const parsed = z.object({ nftId: z.string(), editionId: z.string(), remaining: z.number().int().min(0).max(10) }).safeParse(await request.json())
    if (!parsed.success) return new HttpResponse(null, { status: 400 })
    const input = parsed.data
    const edition = getMockDatabase().snapshot().nfts.find(nft => nft.id === input.nftId)?.editions.find(edition => edition.id === input.editionId)
    if (!edition) return apiFailure(404, 'NOT_FOUND', 'NFT ou edição não encontrados.')
    if (input.remaining > edition.supply) return apiFailure(400, 'VALIDATION_ERROR', 'Disponibilidade não pode exceder a oferta da edição.')
    const updated = getMockDatabase().updateNft(input.nftId, nft => {
      const edition = nft.editions.find(edition => edition.id === input.editionId)
      if (edition) { edition.availability = { status: input.remaining ? 'available' : 'sold-out', remaining: input.remaining }; if (nft.editions[0].id === edition.id) nft.availability = { ...edition.availability } }
      nft.version += 1
      return nft
    })
    if (updated) publishNft(updated)
    return HttpResponse.json({ item: updated })
  }),
  http.post('/api/__mock/reset', async ({ request }) => {
    let body: unknown
    try { body = await request.json() } catch { return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Informe um JSON válido.' } }, { status: 400 }) }
    const parsed = scenarioSchema.safeParse(body)
    if (!parsed.success) return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Cenário inválido.' } }, { status: 400 })
    getMockDatabase().reset()
    resetSocketDiagnostics()
    clearOrderTimers()
    resetCommerce()
    return HttpResponse.json({ config: configureScenario(parsed.data) })
  }),
  http.get('/api/__mock/scenario', () => HttpResponse.json(scenarioSnapshot())),
]
