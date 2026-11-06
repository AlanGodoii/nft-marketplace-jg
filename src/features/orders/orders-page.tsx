import { useState } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import type { Order } from '@/contracts/order'
import { LoadingState, ErrorState } from '@/components/async-state'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { apiErrorMessage } from '@/lib/api'
import { QuoteValues } from '@/features/checkout/quote-values'
import { useOrder, useOrders } from './queries'
function Receipt({ order }: { order: Order }) {
  const snapshot = order.snapshot; const [explore, setExplore] = useState(false)
  return <div className="space-y-6" data-testid="order-receipt"><p className="text-primary">Seus NFTs foram confirmados pela simulação.</p>
    <dl className="receipt-meta"><div><dt>Pedido</dt><dd data-testid="order-id">{order.id}</dd></div><div><dt>Transação simulada</dt><dd>{order.transactionReference}</dd></div><div><dt>Data</dt><dd>{order.updatedAt}</dd></div><div><dt>Rede</dt><dd>{snapshot.network}</dd></div><div><dt>Carteira</dt><dd>{snapshot.wallet.label} · {snapshot.wallet.provider} · {snapshot.wallet.address}</dd></div><div><dt>Estado</dt><dd>Confirmado</dd></div></dl>
    <h3 className="font-bold">Detalhes da transação</h3>
    {snapshot.items.map(item => <article className="receipt-line" key={item.id}><div className="cart-art">{item.nft.image.src ? <img src={item.nft.image.src} alt={item.nft.image.alt} /> : <span>Arte original indisponível</span>}</div><div className="min-w-0"><p className="font-bold break-words">{item.nft.name}</p><p>{item.edition.name}</p><p>{item.quantity} × {item.edition.price.amount} ETH</p></div><p className="break-all">{item.lineTotal} ETH</p></article>)}
    <QuoteValues quote={snapshot} />
    <p className="text-xs">Recibo histórico da simulação. Não representa uma transação real em blockchain.</p>
    <Button variant="outline" onClick={() => setExplore(!explore)}>Explorar transação simulada</Button>{explore && <p role="status" className="break-all">Referência fictícia: {order.transactionReference}. Nenhum explorador de blockchain real é utilizado.</p>}
  </div>
}
function OrderDetail({ id }: { id: string }) {
  const query = useOrder(id); const router = useRouter()
  if (query.isPending) return <LoadingState label="Consultando pedido" />
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />
  const order = query.data
  return <section className="commerce-panel space-y-6" aria-live="polite"><h2 className="text-xl font-bold" data-testid="order-status">{order.status === 'pending' ? 'Pedido pendente' : order.status === 'confirmed' ? 'Compra confirmada' : 'Pagamento recusado'}</h2>
    <p className="break-all">Pedido: {order.id}</p>
    {order.status === 'pending' && <><p role="status">Aguardando o resultado do pagamento simulado. Seu carrinho foi preservado.</p><p>Você pode atualizar esta página para recuperar o mesmo pedido.</p></>}
    {order.status === 'rejected' && <><p role="alert">{order.reason}</p><Link to="/carrinho" className="text-primary">Revisar carrinho para uma nova tentativa</Link></>}
    <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Consultar estado do pedido</Button>
    <Link to="/pedido/confirmacao" search={{ orderId: undefined }} className="text-primary">Ver meus pedidos</Link>
    <Dialog open={order.status === 'confirmed'} onOpenChange={open => { if (!open) void router.navigate({ to: '/pedido/confirmacao', search: { orderId: undefined } }) }}><DialogContent className="kurio-theme review-dialog"><DialogTitle>Compra confirmada</DialogTitle><DialogDescription>Recibo imutável fornecido pela API simulada.</DialogDescription><Receipt order={order} /></DialogContent></Dialog>
  </section>
}
function OrdersList() {
  const query = useOrders()
  if (query.isPending) return <LoadingState label="Carregando pedidos" />
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />
  return <div className="space-y-4">{query.data.items.length ? query.data.items.map(order => <article className="commerce-panel space-y-3" key={order.id}><p className="break-all">{order.id}</p><p>{order.status} · {order.snapshot.total} ETH</p><Link className="text-primary" to="/pedido/confirmacao" search={{ orderId: order.id }}>Acompanhar pedido</Link></article>) : <p role="status">Nenhum pedido selecionado. Você ainda não tem pedidos.</p>}</div>
}
export function OrdersPage() {
  const { orderId } = useSearch({ strict: false }) as { orderId?: string }
  return <section className="space-y-8"><h1 className="text-3xl font-bold">Confirmação do pedido</h1>{orderId ? <OrderDetail id={orderId} key={orderId} /> : <OrdersList />}</section>
}
