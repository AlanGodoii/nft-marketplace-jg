import type { Quote } from '@/contracts/cart'
export function QuoteValues({ quote }: { quote: Quote }) {
  return <dl className="quote-totals" aria-label="Valores da compra">
    <div><dt>Subtotal</dt><dd data-testid="checkout-subtotal">{quote.subtotal} ETH</dd></div>
    <div><dt>Desconto</dt><dd data-testid="checkout-discount">{quote.discount} ETH</dd></div>
    <div><dt>Taxa de rede</dt><dd>{quote.networkFee} ETH</dd></div>
    <div className="border-t pt-4 font-bold text-primary"><dt>Total</dt><dd data-testid="checkout-total">{quote.total} ETH</dd></div>
  </dl>
}
