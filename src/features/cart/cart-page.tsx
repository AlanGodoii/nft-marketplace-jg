import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Cart } from '@/contracts/cart'
import { couponSchema } from '@/contracts/cart'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingState, ErrorState } from '@/components/async-state'
import { apiErrorMessage, ApiRequestError } from '@/lib/api'
import { useCart, useCartBusy, useCartMutation, useQuote } from './queries'

function CartLine({ item }: { item: Cart['items'][number] }) {
  const mutation = useCartMutation()
  const busy = useCartBusy()
  const form = useForm<{ quantity: number }>({ resolver: zodResolver(z.object({ quantity: z.number().int('Use uma quantidade inteira.').min(1, 'Use pelo menos 1 unidade.').max(item.edition.availability.remaining, 'A quantidade excede o estoque.') })), defaultValues: { quantity: item.quantity } })
  const fieldId = `quantity-${item.nftId}-${item.editionId}`
  return <article className="cart-line" data-testid="cart-item">
    <div className="cart-art">{item.nft.image.src ? <img src={item.nft.image.src} alt={item.nft.image.alt} /> : <span>Arte original indisponível</span>}</div>
    <div className="min-w-0 space-y-2"><Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="font-bold break-words">{item.nft.name}</Link><p className="text-xs text-muted-foreground">{item.edition.name} · {item.edition.price.amount} ETH</p><p className="text-xs">Estoque: {item.edition.availability.remaining}</p></div>
    <form className="cart-quantity" noValidate onSubmit={form.handleSubmit(values => mutation.mutate({ type: 'update', id: item.id, quantity: values.quantity }))}>
      <label htmlFor={fieldId} className="text-xs">Quantidade</label>
      <Input id={fieldId} type="number" min="1" max={item.edition.availability.remaining} step="1" {...form.register('quantity', { valueAsNumber: true })} aria-invalid={!!form.formState.errors.quantity} aria-describedby={`${fieldId}-error`} disabled={busy} />
      <p id={`${fieldId}-error`} className="field-error">{form.formState.errors.quantity?.message}</p>
      <Button type="submit" variant="outline" disabled={busy}>Salvar quantidade</Button>
    </form>
    <div className="space-y-3"><p className="text-primary break-all" aria-label={`Total de ${item.nft.name}`}>{item.lineTotal} ETH</p><Button variant="ghost" disabled={busy} onClick={() => mutation.mutate({ type: 'remove', id: item.id })}>Remover item</Button></div>
    {!item.available && <p role="alert" className="cart-line-message">Estoque alterado ou edição esgotada. Ajuste a quantidade ou remova este item.</p>}
    {mutation.isError && <p role="alert" className="cart-line-message">{apiErrorMessage(mutation.error)} Os itens foram preservados.</p>}
  </article>
}
function CartSummary({ cart }: { cart: Cart }) {
  const quote = useQuote(cart)
  const mutation = useCartMutation()
  const busy = useCartBusy()
  const form = useForm<{ code: string }>({ resolver: zodResolver(couponSchema), defaultValues: { code: '' } })
  const totals = quote.data?.cartVersion === cart.version ? quote.data : undefined
  return <aside className="cart-summary space-y-6" aria-labelledby="summary-title">
    <h2 id="summary-title" className="text-xl font-bold">Resumo do carrinho</h2>
    <form noValidate className="space-y-3" onSubmit={form.handleSubmit(async values => {
      try { await mutation.mutateAsync({ type: 'coupon', code: values.code }); form.reset() }
      catch (error) { if (error instanceof ApiRequestError) form.setError('code', { message: error.fields?.code?.[0] ?? error.message }) }
    })}>
      <label htmlFor="coupon-code">Cupom</label><Input id="coupon-code" {...form.register('code')} aria-invalid={!!form.formState.errors.code} aria-describedby="coupon-error" disabled={busy} />
      <p id="coupon-error" className="field-error">{form.formState.errors.code?.message}</p>
      <Button type="submit" disabled={busy}>Aplicar cupom</Button>
    </form>
    {cart.couponCode && <p className="text-sm">Cupom aplicado: {cart.couponCode} <Button variant="link" disabled={busy} onClick={() => mutation.mutate({ type: 'remove-coupon' })}>Remover cupom</Button></p>}
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)}</p>}
    {quote.isError ? <ErrorState message={apiErrorMessage(quote.error)} retry={() => void quote.refetch()} /> : !totals ? <div role="status" aria-busy="true"><span className="sr-only">Calculando cotação</span><Skeleton className="h-44 w-full" /></div> : <>
      <dl className="quote-totals" aria-label="Valores da cotação">
        <div><dt>Subtotal</dt><dd data-testid="subtotal">{totals.subtotal} ETH</dd></div>
        <div><dt>Desconto</dt><dd data-testid="discount">{totals.discount} ETH</dd></div>
        <div><dt>Taxa de rede</dt><dd data-testid="network-fee">{totals.networkFee} ETH</dd></div>
        <div className="border-t pt-4 font-bold text-primary"><dt>Total</dt><dd data-testid="total">{totals.total} ETH</dd></div>
      </dl>
      <p className="text-xs break-all text-muted-foreground">Referência: {totals.reference}</p>
      <p className="text-xs text-muted-foreground">Cotação estimada. Preço, estoque e taxas serão revalidados no futuro checkout.</p>
      <Link to="/checkout" className={buttonVariants({ className: 'w-full', variant: 'outline' })}>Revisar no checkout</Link>
      <p className="text-xs">A finalização da compra ainda não está disponível.</p>
    </>}
    {quote.isFetching && totals && <p role="status">Atualizando cotação…</p>}
  </aside>
}
export function CartPage() {
  const query = useCart()
  return <section className="space-y-8"><h1 className="text-3xl font-bold">Carrinho</h1>
    {query.isPending ? <LoadingState label="Carregando carrinho" /> : query.isError ? <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} /> : <>
      {query.data.notices.map((notice, index) => <p role="status" key={index}>{notice}</p>)}
      <div className="cart-layout"><div className="min-w-0 space-y-4">{query.data.items.length ? query.data.items.map(item => <CartLine item={item} key={`${item.id}:${item.quantity}:${item.edition.availability.remaining}`} />) : <p role="status">Seu carrinho está vazio.</p>}
        <Link to="/" className="inline-block pt-6 text-primary">Continuar explorando</Link>
        {query.isFetching && <p role="status">Atualizando carrinho…</p>}
      </div><CartSummary cart={query.data} /></div>
    </>}
  </section>
}
