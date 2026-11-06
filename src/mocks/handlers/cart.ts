import { http, HttpResponse } from 'msw'
import { cartItemInputSchema, couponSchema, quantitySchema } from '@/contracts/cart'
import { commerceSnapshot, storedCart, transact } from '../commerce-db'
import { getMockDatabase } from '../db'
import { cartView, createQuote, validateCoupon } from '../cart-domain'
import { apiFailure, identity, operation, parseBody, unauthorized } from './shared'

const conflict = () => apiFailure(409, 'CONFLICT', 'Quantidade indisponível. Confira o estoque da edição.', { quantity: ['A quantidade excede o estoque disponível.'] })
export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    const failed = await operation(request, 'cart.read'); if (failed) return failed
    const current = await identity(request, true); if (!current) return unauthorized()
    return HttpResponse.json(cartView(storedCart(commerceSnapshot(), current.owner)))
  }),
  http.post('/api/cart/items', async ({ request }) => {
    const failed = await operation(request, 'cart.add'); if (failed) return failed
    const parsed = await parseBody(request, cartItemInputSchema); if (parsed.error) return parsed.error
    const current = await identity(request, true); if (!current) return unauthorized()
    const input = parsed.data!
    const edition = getMockDatabase().snapshot().nfts.find(nft => nft.id === input.nftId)?.editions.find(edition => edition.id === input.editionId)
    if (!edition) return apiFailure(404, 'NOT_FOUND', 'NFT ou edição não encontrados.')
    const result = transact(state => {
      const cart = storedCart(state, current.owner)
      const id = `${input.nftId}:${input.editionId}`
      const existing = cart.items.find(item => item.id === id)
      const quantity = (existing?.quantity ?? 0) + input.quantity
      if (edition.availability.status !== 'available' || quantity > edition.availability.remaining) return null
      if (existing) existing.quantity = quantity
      else cart.items.push({ id, generation: crypto.randomUUID(), ...input })
      cart.version += 1
      return cart
    })
    return result ? HttpResponse.json(cartView(result)) : conflict()
  }),
  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const failed = await operation(request, 'cart.update'); if (failed) return failed
    const parsed = await parseBody(request, quantitySchema); if (parsed.error) return parsed.error
    const current = await identity(request, true); if (!current) return unauthorized()
    const cart = storedCart(commerceSnapshot(), current.owner)
    const item = cart.items.find(item => item.id === params.itemId)
    if (!item) return apiFailure(404, 'NOT_FOUND', 'Item não encontrado neste carrinho.')
    const edition = getMockDatabase().snapshot().nfts.find(nft => nft.id === item.nftId)?.editions.find(edition => edition.id === item.editionId)
    if (!edition || parsed.data!.quantity > edition.availability.remaining || edition.availability.status !== 'available') return conflict()
    const result = transact(state => {
      const target = storedCart(state, current.owner)
      target.items.find(line => line.id === item.id)!.quantity = parsed.data!.quantity
      target.version += 1
      return target
    })
    return HttpResponse.json(cartView(result))
  }),
  http.delete('/api/cart/items/:itemId', async ({ request, params }) => {
    const failed = await operation(request, 'cart.remove'); if (failed) return failed
    const current = await identity(request, true); if (!current) return unauthorized()
    const result = transact(state => {
      const cart = storedCart(state, current.owner)
      cart.items = cart.items.filter(item => item.id !== params.itemId)
      cart.version += 1
      return cart
    })
    return HttpResponse.json(cartView(result))
  }),
  http.post('/api/cart/coupon', async ({ request }) => {
    const failed = await operation(request, 'cart.coupon'); if (failed) return failed
    const parsed = await parseBody(request, couponSchema); if (parsed.error) return parsed.error
    const current = await identity(request, true); if (!current) return unauthorized()
    const code = parsed.data!.code.toUpperCase()
    const invalid = validateCoupon(code)
    if (invalid) return apiFailure(400, 'VALIDATION_ERROR', invalid, { code: [invalid] })
    const result = transact(state => { const cart = storedCart(state, current.owner); cart.couponCode = code; cart.version += 1; return cart })
    return HttpResponse.json(cartView(result))
  }),
  http.delete('/api/cart/coupon', async ({ request }) => {
    const failed = await operation(request, 'cart.coupon'); if (failed) return failed
    const current = await identity(request, true); if (!current) return unauthorized()
    const result = transact(state => { const cart = storedCart(state, current.owner); cart.couponCode = null; cart.version += 1; return cart })
    return HttpResponse.json(cartView(result))
  }),
  http.get('/api/cart/quote', async ({ request }) => {
    const failed = await operation(request, 'quote.read'); if (failed) return failed
    const current = await identity(request, true); if (!current) return unauthorized()
    const quote = createQuote(storedCart(commerceSnapshot(), current.owner), current.owner)
    return quote ? HttpResponse.json(quote) : apiFailure(409, 'CONFLICT', 'O estoque ou cupom mudou. Revise os itens antes de continuar.')
  }),
]
