import type { CheckoutInput, CheckoutQuote } from '@/contracts/checkout'
import type { CommerceState } from './commerce-db'
import { storedCart } from './commerce-db'
import { cartView, createQuote } from './cart-domain'
import { quoteTtl } from './scenarios'
export function prepareCheckout(state: CommerceState, userId: string, tokenHash: string, input: CheckoutInput): { quote?: CheckoutQuote; status: number; message?: string } {
  const wallet = state.wallets[userId]?.find(item => item.id === input.walletId)
  if (!wallet) return { status: 404, message: 'Carteira não encontrada nesta conta.' }
  if (wallet.network !== input.network) return { status: 400, message: 'A carteira não pertence à rede selecionada.' }
  const connection = state.connections[tokenHash]
  if (!connection || connection.status !== 'connected' || connection.walletId !== wallet.id || connection.network !== input.network || connection.walletVersion !== wallet.version) return { status: 409, message: 'Conecte novamente a carteira selecionada.' }
  const owner = `user:${userId}`
  const cart = storedCart(state, owner)
  if (new Set(input.items.map(item => item.itemId)).size !== input.items.length) return { status: 400, message: 'Não repita uma edição na seleção.' }
  const selection = input.items.map(item => {
    const line = cart.items.find(line => line.id === item.itemId)
    return line && item.quantity <= line.quantity ? { ...line, quantity: item.quantity } : null
  })
  if (selection.some(item => !item)) return { status: 409, message: 'As quantidades do carrinho mudaram. Revise os itens.' }
  const selectedCart = { ...cart, items: selection.filter(item => item !== null) }
  const view = cartView(selectedCart)
  if (view.items.some(item => item.nft.network.id !== input.network)) return { status: 400, message: 'Todos os itens selecionados devem usar a mesma rede da carteira.' }
  const totals = createQuote(selectedCart, owner)
  if (!totals) return { status: 409, message: 'Estoque, edição ou cupom indisponível. Revise o carrinho.' }
  const fingerprint = JSON.stringify({ reference: totals.reference, subtotal: totals.subtotal, discount: totals.discount, networkFee: totals.networkFee, total: totals.total, coupon: totals.couponCode, wallet, collector: input.collector, network: input.network, items: view.items.map(item => ({ id: item.id, quantity: item.quantity, price: item.edition.price.amount, lineTotal: item.lineTotal, version: item.nft.version, available: item.available })) })
  return { status: 200, quote: { ...totals, id: crypto.randomUUID(), expiresAt: new Date(Date.now() + quoteTtl()).toISOString(), fingerprint, items: view.items, wallet: structuredClone(wallet), collector: structuredClone(input.collector), network: input.network } }
}
