import type { Cart, Quote } from '@/contracts/cart'
import type { StoredCart, CommerceState } from './commerce-db'
import { storedCart } from './commerce-db'
import { getMockDatabase } from './db'
import { eth, money } from './money'

export function cartView(cart: StoredCart): Cart {
  const nfts = getMockDatabase().snapshot().nfts
  return {
    ...structuredClone(cart),
    items: cart.items.map(item => {
      const nft = nfts.find(nft => nft.id === item.nftId)!
      const edition = nft.editions.find(edition => edition.id === item.editionId)!
      return { ...item, nft, edition, available: item.quantity <= edition.availability.remaining && edition.availability.status === 'available', lineTotal: eth(money(edition.price.amount).mul(item.quantity)) }
    }),
  }
}
export function mergeGuestCart(state: CommerceState, guestId: string, userId: string) {
  if (!state.retiredGuests.includes(guestId)) state.retiredGuests.push(guestId)
  const guestOwner = `guest:${guestId}`
  const guest = state.carts[guestOwner]
  const target = storedCart(state, `user:${userId}`)
  if (!guest?.items.length) return target.notices
  const nfts = getMockDatabase().snapshot().nfts
  const notices: string[] = []
  for (const item of guest.items) {
    const edition = nfts.find(nft => nft.id === item.nftId)?.editions.find(edition => edition.id === item.editionId)
    if (!edition) { notices.push('Uma edição removida do catálogo não pôde ser mesclada.'); continue }
    const existing = target.items.find(line => line.id === item.id)
    const requested = (existing?.quantity ?? 0) + item.quantity
    // Never silently discard a sold-out visitor line: keep it visible for removal.
    const quantity = edition.availability.remaining > 0 ? Math.min(requested, edition.availability.remaining) : requested
    if (quantity !== requested || edition.availability.remaining === 0) notices.push('A disponibilidade de uma edição mudou. Confira o carrinho mesclado.')
    if (existing) existing.quantity = quantity
    else target.items.push({ ...item, quantity })
  }
  target.couponCode ??= guest.couponCode
  target.version += 1
  target.notices = notices
  delete state.carts[guestOwner]
  return notices
}
export function validateCoupon(code: string): string | null {
  if (code === 'EXPIRADO') return 'Este cupom expirou.'
  if (code !== 'KURIO10') return 'Cupom inválido.'
  return null
}
export function createQuote(cart: StoredCart, owner: string): Quote | undefined {
  const view = cartView(cart)
  if (view.items.some(item => !item.available) || (cart.couponCode && validateCoupon(cart.couponCode))) return undefined
  const subtotal = view.items.reduce((sum, item) => sum.add(item.lineTotal), money('0'))
  const discount = cart.couponCode === 'KURIO10' ? subtotal.mul('0.10').toDecimalPlaces(18) : money('0')
  const networkFee = view.items.length ? money('0.016') : money('0')
  const revision = view.items.map(item => `${item.nft.id}.${item.nft.version}`).join('-') || 'empty'
  return { reference: `quote:${owner}:${cart.version}:${revision}`, cartVersion: cart.version, expiresAt: new Date(Date.now() + 60000).toISOString(), currency: 'ETH', subtotal: eth(subtotal), discount: eth(discount), networkFee: eth(networkFee), total: eth(subtotal.minus(discount).add(networkFee)), couponCode: cart.couponCode }
}
