import { z } from 'zod'
import { ethSchema } from '@/contracts/nft'
import { getMockDatabase } from '../db'
import { http, HttpResponse } from 'msw'
import { checkoutInputSchema } from '@/contracts/checkout'
import { transact } from '../commerce-db'
import { prepareCheckout } from '../checkout-domain'
import { apiFailure, identity, operation, parseBody, unauthorized } from './shared'
export const checkoutHandlers = [http.post('/api/__mock/nft', async ({ request }) => {
  const parsed = await parseBody(request, z.object({ nftId: z.string(), editionId: z.string(), price: ethSchema.optional(), remaining: z.number().int().nonnegative().optional() }).strict()); if (parsed.error) return parsed.error
  const input = parsed.data!
  const edition = getMockDatabase().snapshot().nfts.find(nft => nft.id === input.nftId)?.editions.find(edition => edition.id === input.editionId)
  if (!edition) return apiFailure(404, 'NOT_FOUND', 'Edição não encontrada.')
  if (input.remaining !== undefined && input.remaining > edition.supply) return apiFailure(400, 'VALIDATION_ERROR', 'Estoque maior que a oferta.')
  const item = getMockDatabase().updateNft(input.nftId, nft => {
    const edition = nft.editions.find(edition => edition.id === input.editionId)!
    if (input.price !== undefined) { edition.price.amount = input.price; if (edition.id === nft.editions[0].id) nft.price.amount = input.price }
    if (input.remaining !== undefined) { edition.availability = { status: input.remaining ? 'available' : 'sold-out', remaining: input.remaining }; if (edition.id === nft.editions[0].id) nft.availability = { ...edition.availability } }
    nft.version += 1; return nft
  })
  return HttpResponse.json({ item })
}), http.post('/api/checkout/quote', async ({ request }) => {
  const failed = await operation(request, 'checkout.quote'); if (failed) return failed
  const current = await identity(request); if (!current?.user || !current.tokenHash) return unauthorized()
  const parsed = await parseBody(request, checkoutInputSchema); if (parsed.error) return parsed.error
  const result = transact(state => {
    const prepared = prepareCheckout(state, current.user!.id, current.tokenHash!, parsed.data!)
    if (prepared.quote) {
      // Expired snapshots cannot authorize a later purchase. Bound storage growth.
      for (const [id, quote] of Object.entries(state.quotes)) if (Date.parse(quote.expiresAt) <= Date.now()) delete state.quotes[id]
      state.quotes[prepared.quote.id] = { ...prepared.quote, userId: current.user!.id }
    }
    return prepared
  })
  return result.quote ? HttpResponse.json(result.quote) : apiFailure(result.status, result.status === 400 ? 'VALIDATION_ERROR' : result.status === 404 ? 'NOT_FOUND' : 'CONFLICT', result.message!)
})]
