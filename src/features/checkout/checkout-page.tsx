import { useEffect, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
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
import { useSession } from '@/features/auth/api'
import { readCheckoutDraft, saveCheckoutDraft, type CheckoutDraft } from './draft'
import { useRealtime } from '@/features/realtime/state'
import { usePurchaseAttempt } from '@/features/orders/attempt'
import { identityEpoch } from '@/lib/identity'
import { useCreateOrder, useOrder } from '@/features/orders/queries'
import type { PurchaseAttempt } from '@/contracts/order'
import { apiErrorMessage, ApiRequestError } from '@/lib/api'
import { useCheckoutQuote } from './queries'
import { quoteDifferences } from './quote-differences'
import { QuoteValues } from './quote-values'
function CheckoutCoupon({ cart }: { cart: Cart }) {
  const mutation = useCartMutation(); const [code, setCode] = useState('')
  return <div className="space-y-3"><form onSubmit={event => { event.preventDefault(); mutation.mutate({ type: 'coupon', code }) }} className="space-y-2"><label htmlFor="checkout-coupon">Cupom</label><Input id="checkout-coupon" value={code} onChange={event => setCode(event.target.value)} required aria-describedby="checkout-coupon-error" /><Button type="submit" disabled={mutation.isPending}>Aplicar cupom</Button></form>
    {cart.couponCode && <p>{cart.couponCode} <Button variant="link" disabled={mutation.isPending} onClick={() => mutation.mutate({ type: 'remove-coupon' })}>Remover cupom</Button></p>}
    <p id="checkout-coupon-error" role={mutation.isError ? 'alert' : undefined}>{mutation.isError ? apiErrorMessage(mutation.error) : ''}</p>
  </div>
}
function PreviousAttempt({ attempt, clear, recover, pending }: { attempt: PurchaseAttempt; clear: () => void; recover: () => void; pending: boolean }) {
  const previous = useOrder(attempt.orderId)
  return <section className="commerce-panel space-y-4"><h2 className="font-bold">Tentativa anterior</h2><p>Consulte a mesma tentativa para recuperar seu pedido, inclusive após timeout ou refresh.</p><Button disabled={pending} onClick={recover}>Recuperar tentativa anterior</Button><Link to="/pedido/confirmacao" search={{ orderId: attempt.orderId }} className="text-primary">Ver meus pedidos</Link>{previous.data && previous.data.status !== 'pending' && <Button variant="outline" onClick={clear}>Começar outra compra</Button>}</section>
}
function CheckoutForm({ cart, wallet }: { cart: Cart; wallet: Wallet }) {
  const connection = useWalletConnection(); const quoteMutation = useCheckoutQuote(); const live = useRealtime()
  const createOrder = useCreateOrder(); const { attempt, saveAttempt } = usePurchaseAttempt(); const router = useRouter()
  const session = useSession(); const userId = session.data?.user.id ?? ''; const draft = readCheckoutDraft(userId, wallet)
  const reviewButton = useRef<HTMLButtonElement>(null); const reviewConsent = useRef<HTMLInputElement>(null)
  const submitLock = useRef(false); const sendLock = useRef(false); const renderedEpoch = identityEpoch()
  const [quantities, setQuantities] = useState<Record<string, number>>(draft?.quantities ?? {})
  const [excluded, setExcluded] = useState<string[]>(draft?.excluded ?? [])
  const [network, setNetwork] = useState(draft?.network ?? wallet.network)
  const [reviewState, setReviewState] = useState<{ value: CheckoutQuote; revision: string } | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const form = useForm<WalletInput>({ resolver: zodResolver(walletInputSchema), defaultValues: { label: wallet.label, role: wallet.role, network: wallet.network, address: wallet.address, provider: wallet.provider, secondaryAddress: wallet.secondaryAddress, collector: draft?.collector ?? wallet.collector } })
  const persistDraft = (patch: Partial<CheckoutDraft> = {}) => saveCheckoutDraft(userId, wallet.id, { walletVersion: wallet.version, collector: form.getValues('collector'), network, quantities, excluded, ...patch })
  const revision = `${cart.items.map(item => live.nftVersions[item.nftId] ?? 0).join()}:${cart.version}:${cart.items.map(item => `${item.id}:${item.quantity}:${item.nft.version}`).join('|')}`
  const review = reviewState?.revision === revision ? reviewState.value : null
  const setReview = (value: CheckoutQuote | null) => setReviewState(value ? { value, revision } : null)
  useEffect(() => {
    if (!review) return
    const timer = setTimeout(() => { setReviewState(null); setAccepted(false); setNotice('A cotação expirou. Revalide antes de confirmar.') }, Math.max(0, Date.parse(review.expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [review])
  const liveChanges = live.lastNft ? cart.items.filter(item => item.nftId === live.lastNft!.id).map(item => {
    const edition = live.lastNft!.editions.find(edition => edition.id === item.editionId)
    return edition ? `${item.nft.name} · ${edition.name}: preço ${edition.price.amount} ETH, estoque ${edition.availability.remaining}.` : `${item.nft.name}: edição indisponível.`
  }) : []
  const connected = connection.data?.status === 'connected' && connection.data.walletId === wallet.id && connection.data.network === network
  const quantityErrors = Object.fromEntries(cart.items.filter(item => !excluded.includes(item.id)).flatMap(item => {
    const quantity = quantities[item.id] ?? item.quantity
    const parsed = checkoutInputSchema.shape.items.element.shape.quantity.safeParse(quantity)
    const message = !parsed.success ? parsed.error.issues[0].message : quantity > item.quantity ? 'Não ultrapasse a quantidade do carrinho.' : ''
    return message ? [[item.id, message]] : []
  }))
  const inputFor = (values: WalletInput): CheckoutInput => checkoutInputSchema.parse({ walletId: wallet.id, network, collector: values.collector, items: cart.items.filter(item => !excluded.includes(item.id)).map(item => ({ itemId: item.id, quantity: quantities[item.id] ?? item.quantity })) })
  async function reviewInput(values: WalletInput) {
    setError(''); setNotice(''); setAccepted(false)
    if (Object.keys(quantityErrors).length) { setError('Corrija as quantidades indicadas.'); return }
    if (!cart.items.some(item => !excluded.includes(item.id))) { setError('Selecione pelo menos um item para comprar.'); return }
    try { setReview(await quoteMutation.mutateAsync(inputFor(values))) }
    catch (error) { setReview(null); setError(apiErrorMessage(error)) }
  }
  async function sendAttempt(purchase: PurchaseAttempt) {
    if (sendLock.current) return
    sendLock.current = true
    saveAttempt(purchase)
    try {
      const order = await createOrder.mutateAsync(purchase)
      if (renderedEpoch !== identityEpoch()) return
      saveAttempt({ ...purchase, orderId: order.id })
      await router.navigate({ to: '/pedido/confirmacao', search: { orderId: order.id } })
    } catch (error) {
      if (renderedEpoch !== identityEpoch()) return
      if (error instanceof ApiRequestError && error.fields?.attempt?.includes('not-created')) saveAttempt(null)
      setReview(null); setAccepted(false)
      setError(`${apiErrorMessage(error)}${error instanceof ApiRequestError && error.fields?.attempt ? '' : ' O resultado do envio pode ser desconhecido. Recupere a mesma tentativa; não inicie outra compra.'}`)
    } finally { sendLock.current = false }
  }
  async function validateConfirmedQuote() {
    if (submitLock.current || createOrder.isPending || quoteMutation.isPending) return
    if (!review || !accepted || !connected) return
    submitLock.current = true
    setError('')
    try {
      const next = await quoteMutation.mutateAsync(inputFor(form.getValues()))
      if (next.fingerprint !== review.fingerprint || Date.parse(review.expiresAt) <= Date.now()) {
        setNotice(`A cotação mudou: total anterior ${review.total} ETH; total atualizado ${next.total} ETH. ${quoteDifferences(review, next)} Revise e confirme novamente.`)
        setReview(next); setAccepted(false); return
      }
      const purchase = attempt ?? { key: crypto.randomUUID(), input: { quoteId: next.id, connectionId: connection.data!.connectionId! } }
      await sendAttempt(purchase)
    } catch (error) { setReview(null); setAccepted(false); setError(apiErrorMessage(error)) } finally { submitLock.current = false }
  }
  return <div className="checkout-layout"><div className="space-y-6 min-w-0">
    {liveChanges.length > 0 && <p role="status" className="commerce-panel">Atualização ao vivo: {liveChanges.join(' ')} A cotação anterior foi invalidada. Revalide e confirme os valores atualizados.</p>}
    {attempt && <PreviousAttempt attempt={attempt} clear={() => saveAttempt(null)} recover={() => void sendAttempt(attempt)} pending={createOrder.isPending} />}
    <section className="commerce-panel space-y-4"><h2 className="text-xl font-bold">Carteira e rede</h2><p className="break-all">{wallet.label} · {wallet.provider} · {wallet.address}</p>
      <label htmlFor="checkout-network">Rede de pagamento</label><select id="checkout-network" className="commerce-select" value={network} onChange={event => { setNetwork(event.target.value as Wallet['network']); persistDraft({ network: event.target.value as Wallet['network'] }); setReview(null); setAccepted(false) }}><option value="ethereum">Ethereum</option><option value="polygon">Polygon</option><option value="solana">Solana</option></select>
      <div className="flex flex-wrap gap-3"><Button disabled={connection.isPending} onClick={() => { setReview(null); connection.mutate({ walletId: wallet.id, action: 'connect' }) }}>Conectar carteira</Button><Button variant="outline" disabled={connection.isPending} onClick={() => { setReview(null); setAccepted(false); connection.mutate({ walletId: wallet.id, action: 'disconnect' }) }}>Desconectar carteira</Button></div>
      <p role="status">{connection.isPending ? 'Conectando…' : connected ? 'Carteira conectada (simulação).' : connection.data?.status === 'refused' ? 'Conexão recusada. Tente novamente.' : 'Carteira desconectada.'}</p>
      {connection.isError && <p role="alert">{apiErrorMessage(connection.error)}</p>}
    </section>
    <form noValidate className="commerce-panel space-y-6" aria-label="Dados do pagamento" onChange={() => { persistDraft(); setReview(null); setAccepted(false) }} onSubmit={form.handleSubmit(reviewInput)}><h2 className="text-xl font-bold">Perfil do colecionador</h2><CollectorFields form={form} prefix="checkout" />
      <label htmlFor="checkout-notes">Observação do colecionador (opcional)</label><textarea id="checkout-notes" {...form.register('collector.notes')} className="commerce-select min-h-24" aria-describedby="checkout-notes-error" /><p id="checkout-notes-error" className="field-error">{form.formState.errors.collector?.notes?.message}</p>
      <Button type="submit" ref={reviewButton} disabled={!connected || quoteMutation.isPending || createOrder.isPending || !!attempt}>{quoteMutation.isPending ? 'Revalidando cotação…' : 'Revalidar e revisar compra'}</Button>
    </form>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </div><aside className="commerce-panel space-y-6"><h2 className="text-xl font-bold">Seus NFTs</h2><p>Escolha as edições e quantidades desta compra. Itens não selecionados ficam no carrinho.</p>
    {cart.items.map(item => <article className="checkout-item space-y-2" key={item.id}><label className="flex gap-2"><input type="checkbox" checked={!excluded.includes(item.id)} onChange={event => { const next = event.target.checked ? excluded.filter(id => id !== item.id) : [...excluded, item.id]; setExcluded(next); persistDraft({ excluded: next }); setReview(null) }} />Comprar {item.nft.name}</label><p>{item.edition.name} · {item.nft.network.name} · {item.edition.price.amount} ETH</p>
      <label htmlFor={`buy-${item.id}`}>Quantidade a comprar de {item.nft.name}</label><Input id={`buy-${item.id}`} type="number" min="1" step="1" max={item.quantity} aria-invalid={!!quantityErrors[item.id]} aria-describedby={`buy-${item.id}-error`} value={Number.isFinite(quantities[item.id] ?? item.quantity) ? quantities[item.id] ?? item.quantity : ''} onChange={event => { const next = { ...quantities, [item.id]: event.target.valueAsNumber }; setQuantities(next); persistDraft({ quantities: next }); setReview(null) }} />
      <p className="field-error" id={`buy-${item.id}-error`}>{quantityErrors[item.id]}</p>
      {!item.available && <p role="alert">Edição indisponível ou estoque esgotado. Corrija o carrinho.</p>}
    </article>)}
    <CheckoutCoupon cart={cart} />{review && <QuoteValues quote={review} />}
  </aside>
  <Dialog open={!!review} onOpenChange={open => { if (!open) { setReview(null); setAccepted(false) } }}><DialogContent className="kurio-theme review-dialog" initialFocus={reviewConsent} finalFocus={reviewButton}><DialogTitle>Revisar compra</DialogTitle><DialogDescription>Confira os valores e a carteira antes de autorizar o envio.</DialogDescription>
    {review && <><p className="break-all">{review.wallet.label} · {review.network} · {review.wallet.address}</p>{review.items.map(item => <p key={item.id}>{item.nft.name} · {item.edition.name} · {item.quantity} × {item.edition.price.amount} ETH = {item.lineTotal} ETH</p>)}<QuoteValues quote={review} />
      <label className="flex gap-3"><input type="checkbox" ref={reviewConsent} checked={accepted} onChange={event => setAccepted(event.target.checked)} />Confirmo os itens, a carteira e os valores desta cotação.</label>
      <Button disabled={!accepted || quoteMutation.isPending || createOrder.isPending || !connected} onClick={() => void validateConfirmedQuote()}>{createOrder.isPending ? 'Enviando pedido…' : 'Finalizar compra'}</Button>
      {notice && <p role="status">{notice}</p>}
    </>}
  </DialogContent></Dialog>
  </div>
}
function EmptyCheckoutRecovery() {
  const { attempt, saveAttempt } = usePurchaseAttempt(); const mutation = useCreateOrder(); const router = useRouter(); const epoch = identityEpoch()
  return <section className="commerce-panel space-y-4">
    {attempt && <><h2 className="font-bold">Tentativa anterior</h2><p>Recupere a tentativa anterior para consultar o resultado, mesmo com o carrinho vazio.</p>
      <Button disabled={mutation.isPending} onClick={() => mutation.mutate(attempt, {
        onSuccess: order => { if (epoch === identityEpoch()) { saveAttempt({ ...attempt, orderId: order.id }); void router.navigate({ to: '/pedido/confirmacao', search: { orderId: order.id } }) } },
        onError: error => { if (epoch === identityEpoch() && error instanceof ApiRequestError && error.fields?.attempt?.includes('not-created')) saveAttempt(null) },
      })}>{mutation.isPending ? 'Consultando tentativa…' : 'Recuperar tentativa anterior'}</Button>
    </>}
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)}</p>}
    <Link to="/pedido/confirmacao" search={{ orderId: attempt?.orderId }} className="text-primary">Ver meus pedidos</Link>
  </section>
}
export function CheckoutPage() {
  const cart = useCart(); const wallets = useWallets(); const [selected, setSelected] = useState('')
  if (cart.isPending || wallets.isPending) return <LoadingState label="Carregando checkout" />
  if (cart.isError || wallets.isError) return <ErrorState message={apiErrorMessage(cart.error ?? wallets.error)} retry={() => { void cart.refetch(); void wallets.refetch() }} />
  const wallet = wallets.data.items.find(wallet => wallet.id === selected) ?? wallets.data.items[0]
  return <section className="space-y-8"><h1 className="text-3xl font-bold">Checkout</h1><Link to="/carrinho" className="text-primary">Voltar ao carrinho</Link>
    {!cart.data.items.length ? <><p role="status">Seu carrinho está vazio.</p><EmptyCheckoutRecovery /></> : !wallet ? <p role="status">Cadastre uma carteira para continuar. <Link to="/carteiras" className="text-primary">Gerenciar carteiras</Link></p> : <>
      <div className="max-w-lg space-y-2"><label htmlFor="checkout-wallet">Carteira cadastrada</label><select id="checkout-wallet" className="commerce-select" value={wallet.id} onChange={event => setSelected(event.target.value)}>{wallets.data.items.map(wallet => <option value={wallet.id} key={wallet.id}>{wallet.label} · {wallet.network}</option>)}</select></div>
      <CheckoutForm wallet={wallet} cart={cart.data} key={`${wallet.id}:${wallet.version}`} />
    </>}
  </section>
}
