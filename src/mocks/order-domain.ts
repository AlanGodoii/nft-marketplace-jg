import type { Order, OrderInput } from '@/contracts/order'
import { commerceSnapshot, storedCart, transact, type CommerceState } from './commerce-db'
import { prepareCheckout } from './checkout-domain'
import { getMockDatabase } from './db'
import { orderScenario } from './scenarios'
export type StoredOrder = CommerceState['orders'][string]
export function publicOrder(order: StoredOrder): Order {
  const { settleAt: _settleAt, outcome: _outcome, purchasedLines: _purchasedLines, ...result } = order
  return structuredClone(result)
}
export async function withOrderLock<T>(run: () => T | Promise<T>): Promise<T> {
  if (globalThis.navigator?.locks) return navigator.locks.request('kurio-order-transaction', run)
  return run()
}
export function createOrder(userId: string, tokenHash: string, key: string, input: OrderInput) {
  return transact(state => {
    const operationKey = `${userId}:${key}`
    const fingerprint = JSON.stringify(input)
    const previous = state.idempotency[operationKey]
    if (previous) return previous.fingerprint === fingerprint ? { order: publicOrder(state.orders[previous.orderId]), replay: true } : { error: 'A chave de idempotência já foi usada com outro conteúdo.', field: 'idempotencyKey', status: 409 }
    const quote = state.quotes[input.quoteId]
    if (!quote || quote.userId !== userId) return { error: 'Cotação não encontrada nesta conta. Revise novamente.', field: 'attempt', status: 404 }
    if (Date.parse(quote.expiresAt) <= Date.now()) return { error: 'A cotação expirou. Revalide e confirme novamente.', field: 'attempt', status: 409 }
    if (state.connections[tokenHash]?.connectionId !== input.connectionId) return { error: 'A carteira foi desconectada. Conecte e revise novamente.', field: 'attempt', status: 409 }
    const prepared = prepareCheckout(state, userId, tokenHash, { walletId: quote.wallet.id, network: quote.network, collector: quote.collector, items: quote.items.map(item => ({ itemId: item.id, quantity: item.quantity })) })
    if (!prepared.quote || prepared.quote.fingerprint !== quote.fingerprint) return { error: prepared.message ?? 'Preço, estoque, cupom ou taxas mudaram. Revalide a cotação e confirme novamente.', field: 'attempt', status: prepared.status === 200 ? 409 : prepared.status }
    const scenario = orderScenario(); const now = Date.now(); const id = crypto.randomUUID()
    const cart = storedCart(state, `user:${userId}`)
    const { userId: _owner, ...snapshot } = quote
    const order: StoredOrder = { id, userId, version: 1, status: 'pending', createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), snapshot, transactionReference: null, reason: null,
      settleAt: scenario.outcome === 'pending' ? null : now + scenario.delay, outcome: scenario.outcome === 'rejected' ? 'rejected' : 'confirmed',
      purchasedLines: quote.items.map(item => ({ id: item.id, quantity: item.quantity, generation: cart.items.find(line => line.id === item.id)?.generation })),
    }
    state.orders[id] = order
    state.idempotency[operationKey] = { fingerprint, orderId: id }
    return { order: publicOrder(order), replay: false }
  })
}
export async function settleOrder(id: string, outcome?: 'confirmed' | 'rejected') {
  return withOrderLock(() => transact(state => {
    const order = state.orders[id]
    if (!order) return undefined
    if (order.status !== 'pending') return { order: publicOrder(order), changed: false }
    const nfts = getMockDatabase().snapshot().nfts
    const stockAvailable = order.snapshot.items.every(item => {
      const edition = nfts.find(nft => nft.id === item.nftId)?.editions.find(edition => edition.id === item.editionId)
      return edition?.availability.status === 'available' && edition.availability.remaining >= item.quantity
    })
    const result = outcome ?? order.outcome
    order.status = result === 'confirmed' && stockAvailable ? 'confirmed' : 'rejected'
    order.version += 1; order.updatedAt = new Date().toISOString(); order.settleAt = null
    order.reason = order.status === 'rejected' ? (!stockAvailable ? 'Estoque indisponível durante o processamento. Nenhum item foi removido do carrinho.' : 'Pagamento recusado pela simulação. Seu carrinho foi preservado.') : null
    if (order.status === 'confirmed') {
      order.transactionReference = `simulated:${order.id}`
      const cart = storedCart(state, `user:${order.userId}`)
      let changed = false
      for (const purchased of order.purchasedLines) {
        const line = cart.items.find(line => line.id === purchased.id && line.generation === purchased.generation)
        if (line) { line.quantity = Math.max(0, line.quantity - purchased.quantity); changed = true }
      }
      cart.items = cart.items.filter(line => line.quantity > 0)
      if (changed) { cart.version += 1; if (!cart.items.length) cart.couponCode = null }
    }
    return { order: publicOrder(order), changed: true }
  }))
}
const timers = new Map<string, ReturnType<typeof setTimeout>>()
export function scheduleOrders() {
  for (const order of Object.values(commerceSnapshot().orders)) {
    if (order.status !== 'pending' || order.settleAt === null || timers.has(order.id)) continue
    timers.set(order.id, setTimeout(() => { timers.delete(order.id); void settleOrder(order.id) }, Math.max(0, order.settleAt - Date.now())))
  }
}
export function clearOrderTimers() { for (const timer of timers.values()) clearTimeout(timer); timers.clear() }
export async function settleDueOrders() {
  for (const order of Object.values(commerceSnapshot().orders)) if (order.status === 'pending' && order.settleAt !== null && order.settleAt <= Date.now()) await settleOrder(order.id)
}
