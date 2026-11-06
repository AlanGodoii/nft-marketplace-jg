import type { CheckoutQuote } from '@/contracts/checkout'
// Presentation only: compare API strings/snapshots; never calculate money here.
export function quoteDifferences(previous: CheckoutQuote, next: CheckoutQuote) {
  const changes: string[] = []
  for (const item of next.items) {
    const before = previous.items.find(line => line.id === item.id)
    if (!before) { changes.push(`Item incluído: ${item.nft.name}.`); continue }
    if (before.edition.price.amount !== item.edition.price.amount) changes.push(`Preço de ${item.nft.name}: ${before.edition.price.amount} → ${item.edition.price.amount} ETH.`)
    if (before.quantity !== item.quantity) changes.push(`Quantidade de ${item.nft.name}: ${before.quantity} → ${item.quantity}.`)
    if (before.edition.availability.remaining !== item.edition.availability.remaining) changes.push(`Estoque de ${item.nft.name}: ${before.edition.availability.remaining} → ${item.edition.availability.remaining}.`)
  }
  for (const [field, label] of [['subtotal', 'Subtotal'], ['discount', 'Desconto'], ['networkFee', 'Taxa de rede']] as const) if (previous[field] !== next[field]) changes.push(`${label}: ${previous[field]} → ${next[field]} ETH.`)
  if (previous.couponCode !== next.couponCode) changes.push(`Cupom: ${previous.couponCode ?? 'nenhum'} → ${next.couponCode ?? 'nenhum'}.`)
  if (previous.wallet.version !== next.wallet.version) changes.push('Os dados da carteira foram atualizados.')
  return changes.join(' ') || 'A disponibilidade ou os dados da edição foram atualizados. Confira a seleção.'
}
