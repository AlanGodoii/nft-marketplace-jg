import { useDesktop } from '@/lib/use-desktop'
import { Minus, Plus, Search, Share2 } from 'lucide-react'
import { RelatedNfts } from './components/related-nfts'
import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Nft } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/async-state'
import { DetailSkeleton } from './detail-skeleton'
import { ApiRequestError, apiErrorMessage } from '@/lib/api'
import { useCartBusy, useCartMutation } from '@/features/cart/queries'
import { useSession } from '@/features/auth/api'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { useNft } from './queries'

function Detail({ nft }: { nft: Nft }) {
  const desktop = useDesktop()
  const [infoTab,setInfoTab] = useState('details')
  const [shareNotice,setShareNotice] = useState('')
  const [editionId, setEditionId] = useState(nft.editions[0].id)
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoom, setZoom] = useState(false)
  const edition = nft.editions.find(edition => edition.id === editionId) ?? nft.editions[0]
  const gallery = nft.gallery.length ? nft.gallery : [nft.image]
  const image = gallery[selectedImage] ?? gallery[0]
  const add = useCartMutation()
  const busy = useCartBusy()
  const session = useSession()
  const available = edition.availability.status === 'available' && edition.availability.remaining > 0
  const form = useForm<{ quantity: number }>({ resolver: zodResolver(z.object({ quantity: z.number().int('Use uma quantidade inteira.').min(1, 'Use pelo menos 1 unidade.').max(edition.availability.remaining, 'A quantidade excede o estoque da edição.') })), defaultValues: { quantity: 1 } })
  const quantity = useWatch({control:form.control,name:'quantity'})
  const changeEdition = (id: string) => { setEditionId(id); form.reset({ quantity: 1 }); add.reset() }
  const stepQuantity = (delta: number) => { const current = form.getValues('quantity'); const next = (Number.isInteger(current) ? current : 1) + delta; if (next >= 1 && next <= edition.availability.remaining) form.setValue('quantity', next, { shouldValidate: true }) }
  return <section className="nft-detail-page space-y-12">
    <nav aria-label="Localização" className="text-sm"><Link to="/">Início</Link> / <Link to="/" hash="catalogo">Mercado</Link><span className="sr-only"> / Detalhes do NFT</span></nav>
    <div className="detail-layout">
      <div className="detail-gallery" aria-label="Galeria do NFT">
        {!desktop && <div className="detail-mobile-favorite"><FavoriteButton nft={nft} compact /></div>}
        <div className="detail-thumbnails">{gallery.map((entry, index) => <button type="button" className="detail-thumb" aria-label={`Ver imagem ${index + 1}`} aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)} key={index}>
          {entry.src ? <img src={entry.src} alt="" /> : <span>Vista {index + 1}</span>}
        </button>)}</div>
        <button type="button" className="detail-art" aria-label="Ampliar arte do NFT" onClick={() => setZoom(true)}>
          {image.src ? <img src={image.src} alt={image.alt} /> : <span role="img" aria-label={image.alt}>Arte original indisponível</span>}
          <Search aria-hidden="true" className="gallery-zoom-icon" />
        </button>
      </div>
      <div className="detail-info space-y-6">
        <h1 className="text-3xl font-bold break-words">{nft.name}</h1>
        {desktop && <p className="text-2xl font-bold text-primary" data-testid="edition-price">{edition.price.amount} ETH</p>}
        <div className="detail-about border-t pt-5"><h2 className="font-bold">Sobre este NFT</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{nft.description}</p></div>
        <form noValidate className="detail-purchase-form space-y-4" onSubmit={form.handleSubmit(values => add.mutate({ type: 'add', item: { nftId: nft.id, editionId: edition.id, quantity: values.quantity } }))}>
          <label htmlFor="nft-edition" className="block">Edição</label>
          <div className="edition-pills" role="group" aria-label="Edições disponíveis">{nft.editions.map(option => <button type="button" key={option.id} aria-label={`Selecionar ${option.name}`} aria-pressed={edition.id === option.id} onClick={() => changeEdition(option.id)}>1/{option.supply}</button>)}</div>
          <select id="nft-edition" className="kurio-select w-full" value={edition.id} onChange={event => changeEdition(event.target.value)}>
            {nft.editions.map(edition => <option key={edition.id} value={edition.id}>{edition.name}{edition.availability.remaining === 0 ? ' — esgotada' : ''}</option>)}
          </select>
          <p role="status" className="text-sm">{available ? `${edition.availability.remaining} unidades disponíveis` : 'Edição esgotada ou indisponível'}</p>
          <label htmlFor="nft-quantity" className="block">Quantidade</label>
          <div className="quantity-stepper"><Button variant="ghost" type="button" aria-label="Diminuir quantidade" disabled={!available || busy || quantity <= 1} onClick={() => stepQuantity(-1)}><Minus aria-hidden="true" /></Button>
          <Input className="max-w-32" id="nft-quantity" type="number" min="1" max={edition.availability.remaining} step="1" {...form.register('quantity', { valueAsNumber: true })} disabled={!available || busy} aria-invalid={!!form.formState.errors.quantity} aria-describedby="nft-quantity-error" />
          <Button variant="ghost" type="button" aria-label="Aumentar quantidade" disabled={!available || busy || quantity >= edition.availability.remaining} onClick={() => stepQuantity(1)}><Plus aria-hidden="true" /></Button></div>
          {!desktop && <p className="mobile-detail-price" data-testid="edition-price">{edition.price.amount} ETH</p>}
          <p id="nft-quantity-error" className="field-error">{form.formState.errors.quantity?.message}</p>
          <Button type="submit" disabled={!available || busy || session.isPending || session.isError}>{add.isPending ? 'Adicionando…' : 'Comprar'}</Button>
        </form>
        {desktop && <div className="detail-desktop-favorite"><FavoriteButton nft={nft} compact /></div>}
        {add.isSuccess && <p role="status">NFT adicionado ao carrinho. <Link to="/carrinho" className="underline">Ver carrinho</Link></p>}
        {add.isError && <p role="alert">{apiErrorMessage(add.error)}</p>}
        <dl className="detail-metadata space-y-2 text-sm text-muted-foreground"><div><dt className="inline">ID do token: </dt><dd className="inline">{nft.id}</dd></div><div><dt className="inline">Coleção: </dt><dd className="inline">{nft.collection.name}</dd></div><div><dt className="inline">Criador: </dt><dd className="inline">{nft.creator.name}</dd></div><div><dt className="inline">Rede: </dt><dd className="inline">{nft.network.name}</dd></div></dl>
      </div>
    </div>
    <section className="detail-description space-y-4 border-t pt-6"><div className="detail-description-tabs" role="group" aria-label="Informações da obra"><button type="button" aria-pressed={infoTab === 'details'} onClick={() => setInfoTab('details')}>Detalhes do NFT</button><button type="button" aria-pressed={infoTab === 'reviews'} onClick={() => setInfoTab('reviews')}>Avaliações de colecionadores</button></div>
      {infoTab === 'details' ? <><p>{nft.description} Oferta total desta edição: {edition.supply}.</p><p>A arte faz parte da coleção {nft.collection.name}, criada por {nft.creator.name}. Os valores, a rede e a disponibilidade são fornecidos pela API simulada e revalidados antes da compra.</p><dl><dt>Rede:</dt><dd>{nft.network.name} · ambiente de demonstração, sem transação real em blockchain.</dd><dt>Contrato:</dt><dd>Simulado. Nenhum contrato real foi publicado.</dd><dt>Direitos autorais:</dt><dd>Não há transferência ou royalties reais nesta demonstração.</dd></dl></> : <p role="status">Ainda não há avaliações nesta demonstração. Nenhuma nota ou contagem de avaliações foi inventada.</p>}
      <Button variant="link" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setShareNotice('Link do NFT copiado.') } catch { setShareNotice(`Link do NFT: ${location.href}`) } }}><Share2 aria-hidden="true" />Compartilhar NFT</Button><p role="status">{shareNotice}</p>
    </section>
    {desktop && <RelatedNfts exclude={nft.id} />}
    <Dialog open={zoom} onOpenChange={setZoom}><DialogContent className="kurio-theme"><DialogTitle>Arte de {nft.name}</DialogTitle>{image.src ? <img src={image.src} alt={image.alt} /> : <p>Arte original indisponível. Nenhuma imagem substituta foi utilizada.</p>}</DialogContent></Dialog>
  </section>
}
export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const query = useNft(nftId)
  if (query.isPending) return <DetailSkeleton />
  if (query.isError) return query.error instanceof ApiRequestError && query.error.status === 404 ? <section className="space-y-6"><h1 className="text-3xl">NFT não encontrado</h1><Link to="/">Voltar ao catálogo</Link></section> : <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />
  return <Detail nft={query.data} key={query.data.id} />
}
