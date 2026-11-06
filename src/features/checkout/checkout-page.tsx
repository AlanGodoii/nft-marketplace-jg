import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Cart } from '@/contracts/cart'
import { checkoutInputSchema, type CheckoutInput, type CheckoutQuote } from '@/contracts/checkout'
import { walletInputSchema, type Wallet, type WalletInput } from '@/contracts/wallet'
import { useCart, useCartMutation } from '@/features/cart/queries'
import { CollectorFields } from '@/features/wallets/collector-fields'
import { useWalletConnection, useWallets } from '@/features/wallets/queries'
import { LoadingState, ErrorState } from '@/components/async-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { apiErrorMessage } from '@/lib/api'
import { useCheckoutQuote } from './queries'
import { QuoteValues } from './quote-values'
function CheckoutCoupon({ cart }: { cart: Cart }) {
  const mutation = useCartMutation(); const [code, setCode] = useState('')
  return <div className="space-y-3"><form onSubmit={event => { event.preventDefault(); mutation.mutate({ type: 'coupon', code }) }} className="space-y-2"><label htmlFor="checkout-coupon">Cupom</label><Input id="checkout-coupon" value={code} onChange={event => setCode(event.target.value)} required aria-describedby="checkout-coupon-error" /><Button type="submit" disabled={mutation.isPending}>Aplicar cupom</Button></form>
    {cart.couponCode && <p>{cart.couponCode} <Button variant="link" disabled={mutation.isPending} onClick={() => mutation.mutate({ type: 'remove-coupon' })}>Remover cupom</Button></p>}
    <p id="checkout-coupon-error" role={mutation.isError ? 'alert' : undefined}>{mutation.isError ? apiErrorMessage(mutation.error) : ''}</p>
  </div>
}
function CheckoutForm({ cart, wallet }: { cart: Cart; wallet: Wallet }) {
  const connection = useWalletConnection(); const quoteMutation = useCheckoutQuote()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [excluded, setExcluded] = useState<string[]>([])
  const [network, setNetwork] = useState(wallet.network)
  const [reviewState, setReviewState] = useState<{ value: CheckoutQuote; revision: string } | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const form = useForm<WalletInput>({ resolver: zodResolver(walletInputSchema), defaultValues: { label: wallet.label, role: wallet.role, network: wallet.network, address: wallet.address, provider: wallet.provider, secondaryAddress: wallet.secondaryAddress, collector: wallet.collector } })
  const revision = `${cart.version}:${cart.items.map(item => `${item.id}:${item.quantity}:${item.nft.version}`).join('|')}`
  const review = reviewState?.revision === revision ? reviewState.value : null
  const setReview = (value: CheckoutQuote | null) => setReviewState(value ? { value, revision } : null)
  useEffect(() => {
    if (!review) return
    const timer = setTimeout(() => { setReviewState(null); setAccepted(false); setNotice('A cotação expirou. Revalide antes de confirmar.') }, Math.max(0, Date.parse(review.expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [review])
  const connected = connection.data?.status === 'connected' && connection.data.walletId === wallet.id && connection.data.network === network
  const inputFor = (values: WalletInput): CheckoutInput => checkoutInputSchema.parse({ walletId: wallet.id, network, collector: values.collector, items: cart.items.filter(item => !excluded.includes(item.id)).map(item => ({ itemId: item.id, quantity: quantities[item.id] ?? item.quantity })) })
  async function reviewInput(values: WalletInput) {
    setError(''); setNotice(''); setAccepted(false)
    try { setReview(await quoteMutation.mutateAsync(inputFor(values))) }
    catch (error) { setReview(null); setError(apiErrorMessage(error)) }
  }
  async function validateConfirmedQuote() {
    if (!review || !accepted || !connected) return
    setError('')
    try {
      const next = await quoteMutation.mutateAsync(inputFor(form.getValues()))
      if (next.fingerprint !== review.fingerprint || Date.parse(review.expiresAt) <= Date.now()) {
        setNotice(`A cotação mudou: total anterior ${review.total} ETH; total atualizado ${next.total} ETH. Revise os itens, preço, estoque, desconto e taxas e confirme novamente.`)
        setReview(next); setAccepted(false); return
      }
      setReview(next); setNotice('Cotação revalidada pela API. Nenhum pedido foi enviado neste checkpoint.')
    } catch (error) { setReview(null); setAccepted(false); setError(apiErrorMessage(error)) }
  }
  return <div className="checkout-layout"><div className="space-y-6 min-w-0">
    <section className="commerce-panel space-y-4"><h2 className="text-xl font-bold">Carteira e rede</h2><p className="break-all">{wallet.label} · {wallet.provider} · {wallet.address}</p>
      <label htmlFor="checkout-network">Rede de pagamento</label><select id="checkout-network" className="commerce-select" value={network} onChange={event => { setNetwork(event.target.value as Wallet['network']); setReview(null); setAccepted(false) }}><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option><option value="solana">Solana</option></select>
      <div className="flex flex-wrap gap-3"><Button disabled={connection.isPending} onClick={() => { setReview(null); connection.mutate({ walletId: wallet.id, action: 'connect' }) }}>Conectar carteira</Button><Button variant="outline" disabled={connection.isPending} onClick={() => { setReview(null); setAccepted(false); connection.mutate({ walletId: wallet.id, action: 'disconnect' }) }}>Desconectar carteira</Button></div>
      <p role="status">{connection.isPending ? 'Conectando…' : connected ? 'Carteira conectada (simulação).' : connection.data?.status === 'refused' ? 'Conexão recusada. Tente novamente.' : 'Carteira desconectada.'}</p>
      {connection.isError && <p role="alert">{apiErrorMessage(connection.error)}</p>}
    </section>
    <form noValidate className="commerce-panel space-y-6" aria-label="Dados do pagamento" onChange={() => { setReview(null); setAccepted(false) }} onSubmit={form.handleSubmit(reviewInput)}><h2 className="text-xl font-bold">Perfil do colecionador</h2><CollectorFields form={form} prefix="checkout" />
      <label htmlFor="checkout-notes">Observação do colecionador (opcional)</label><textarea id="checkout-notes" {...form.register('collector.notes')} className="commerce-select min-h-24" aria-describedby="checkout-notes-error" /><p id="checkout-notes-error" className="field-error">{form.formState.errors.collector?.notes?.message}</p>
      <Button type="submit" disabled={!connected || quoteMutation.isPending}>{quoteMutation.isPending ? 'Revalidando cotação…' : 'Revalidar e revisar compra'}</Button>
    </form>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </div><aside className="commerce-panel space-y-6"><h2 className="text-xl font-bold">Seus NFTs</h2><p>Escolha as edições e quantidades desta compra. Itens não selecionados ficam no carrinho.</p>
    {cart.items.map(item => <article className="checkout-item space-y-2" key={item.id}><label className="flex gap-2"><input type="checkbox" checked={!excluded.includes(item.id)} onChange={event => { setExcluded(old => event.target.checked ? old.filter(id => id !== item.id) : [...old, item.id]); setReview(null) }} />Comprar {item.nft.name}</label><p>{item.edition.name} · {item.nft.network.name} · {item.edition.price.amount} ETH</p>
      <label htmlFor={`buy-${item.id}`}>Quantidade a comprar de {item.nft.name}</label><Input id={`buy-${item.id}`} type="number" min="1" step="1" max={item.quantity} value={quantities[item.id] ?? item.quantity} onChange={event => { setQuantities(old => ({ ...old, [item.id]: event.target.valueAsNumber })); setReview(null) }} />
      {!item.available && <p role="alert">Edição indisponível ou estoque esgotado. Corrija o carrinho.</p>}
    </article>)}
    <CheckoutCoupon cart={cart} />{review && <QuoteValues quote={review} />}
  </aside>
  <Dialog open={!!review} onOpenChange={open => { if (!open) { setReview(null); setAccepted(false) } }}><DialogContent className="kurio-theme review-dialog"><DialogTitle>Revisar compra</DialogTitle><DialogDescription>Confira os valores e a carteira antes de autorizar o envio.</DialogDescription>
    {review && <><p className="break-all">{review.wallet.label} · {review.network} · {review.wallet.address}</p>{review.items.map(item => <p key={item.id}>{item.nft.name} · {item.edition.name} · {item.quantity} × {item.edition.price.amount} ETH = {item.lineTotal} ETH</p>)}<QuoteValues quote={review} />
      <label className="flex gap-3"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />Confirmo os itens, a carteira e os valores desta cotação.</label>
      <Button disabled={!accepted || quoteMutation.isPending || !connected} onClick={() => void validateConfirmedQuote()}>Validar cotação confirmada</Button>
      {notice && <p role="status">{notice}</p>}
    </>}
  </DialogContent></Dialog>
  </div>
}
export function CheckoutPage() {
  const cart = useCart(); const wallets = useWallets(); const [selected, setSelected] = useState('')
  if (cart.isPending || wallets.isPending) return <LoadingState label="Carregando checkout" />
  if (cart.isError || wallets.isError) return <ErrorState message={apiErrorMessage(cart.error ?? wallets.error)} retry={() => { void cart.refetch(); void wallets.refetch() }} />
  const wallet = wallets.data.items.find(wallet => wallet.id === selected) ?? wallets.data.items[0]
  return <section className="space-y-8"><h1 className="text-3xl font-bold">Checkout</h1><Link to="/carrinho" className="text-primary">Voltar ao carrinho</Link>
    {!cart.data.items.length ? <p role="status">Seu carrinho está vazio.</p> : !wallet ? <p role="status">Cadastre uma carteira para continuar. <Link to="/carteiras" className="text-primary">Gerenciar carteiras</Link></p> : <>
      <div className="max-w-lg space-y-2"><label htmlFor="checkout-wallet">Carteira cadastrada</label><select id="checkout-wallet" className="commerce-select" value={wallet.id} onChange={event => setSelected(event.target.value)}>{wallets.data.items.map(wallet => <option value={wallet.id} key={wallet.id}>{wallet.label} · {wallet.network}</option>)}</select></div>
      <CheckoutForm wallet={wallet} cart={cart.data} key={`${wallet.id}:${wallet.version}`} />
    </>}
  </section>
}
