import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Nft } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { LoadingState, ErrorState } from '@/components/async-state'
import { ApiRequestError, apiErrorMessage } from '@/lib/api'
import { useCartBusy, useCartMutation } from '@/features/cart/queries'
import { useSession } from '@/features/auth/api'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { useNft } from './queries'

function Detail({ nft }: { nft: Nft }) {
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
  return <section className="space-y-12">
    <nav aria-label="Localização" className="text-sm"><Link to="/">Início</Link> / Detalhes do NFT</nav>
    <div className="detail-layout">
      <div className="detail-gallery" aria-label="Galeria do NFT">
        <div className="detail-thumbnails">{gallery.map((entry, index) => <button type="button" className="detail-thumb" aria-label={`Ver imagem ${index + 1}`} aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)} key={index}>
          {entry.src ? <img src={entry.src} alt="" /> : <span>Vista {index + 1}</span>}
        </button>)}</div>
        <button type="button" className="detail-art" aria-label="Ampliar arte do NFT" onClick={() => setZoom(true)}>
          {image.src ? <img src={image.src} alt={image.alt} /> : <span role="img" aria-label={image.alt}>Arte original indisponível</span>}
        </button>
      </div>
      <div className="detail-info space-y-6">
        <h1 className="text-3xl font-bold break-words">{nft.name}</h1>
        <p className="text-2xl font-bold text-primary" data-testid="edition-price">{edition.price.amount} ETH</p>
        <div className="border-t pt-5"><h2 className="font-bold">Sobre este NFT</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{nft.description}</p></div>
        <form noValidate className="space-y-4" onSubmit={form.handleSubmit(values => add.mutate({ type: 'add', item: { nftId: nft.id, editionId: edition.id, quantity: values.quantity } }))}>
          <label htmlFor="nft-edition" className="block">Edição</label>
          <select id="nft-edition" className="kurio-select w-full" value={edition.id} onChange={event => { setEditionId(event.target.value); form.reset({ quantity: 1 }); add.reset() }}>
            {nft.editions.map(edition => <option key={edition.id} value={edition.id}>{edition.name}{edition.availability.remaining === 0 ? ' — esgotada' : ''}</option>)}
          </select>
          <p role="status" className="text-sm">{available ? `${edition.availability.remaining} unidades disponíveis` : 'Edição esgotada ou indisponível'}</p>
          <label htmlFor="nft-quantity" className="block">Quantidade</label>
          <Input className="max-w-32" id="nft-quantity" type="number" min="1" max={edition.availability.remaining} step="1" {...form.register('quantity', { valueAsNumber: true })} disabled={!available || busy} aria-invalid={!!form.formState.errors.quantity} aria-describedby="nft-quantity-error" />
          <p id="nft-quantity-error" className="field-error">{form.formState.errors.quantity?.message}</p>
          <Button type="submit" disabled={!available || busy || session.isPending || session.isError}>{add.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}</Button>
        </form>
        <FavoriteButton nft={nft} />
        {add.isSuccess && <p role="status">NFT adicionado ao carrinho. <Link to="/carrinho" className="underline">Ver carrinho</Link></p>}
        {add.isError && <p role="alert">{apiErrorMessage(add.error)}</p>}
        <dl className="space-y-2 text-sm text-muted-foreground"><div><dt className="inline">ID do token: </dt><dd className="inline">{nft.id}</dd></div><div><dt className="inline">Coleção: </dt><dd className="inline">{nft.collection.name}</dd></div><div><dt className="inline">Criador: </dt><dd className="inline">{nft.creator.name}</dd></div><div><dt className="inline">Rede: </dt><dd className="inline">{nft.network.name}</dd></div></dl>
      </div>
    </div>
    <section className="space-y-4 border-t pt-6"><h2 className="text-xl text-primary">Detalhes do NFT</h2><p className="text-sm leading-7 text-muted-foreground">{nft.description} Oferta total desta edição: {edition.supply}. A disponibilidade é validada novamente pela API ao adicionar ao carrinho.</p><p className="text-xs text-muted-foreground">As imagens originais desta obra ainda não estão disponíveis.</p></section>
    <Dialog open={zoom} onOpenChange={setZoom}><DialogContent className="kurio-theme"><DialogTitle>Arte de {nft.name}</DialogTitle>{image.src ? <img src={image.src} alt={image.alt} /> : <p>Arte original indisponível. Nenhuma imagem substituta foi utilizada.</p>}</DialogContent></Dialog>
  </section>
}
export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const query = useNft(nftId)
  if (query.isPending) return <LoadingState label="Carregando detalhes do NFT" />
  if (query.isError) return query.error instanceof ApiRequestError && query.error.status === 404 ? <section className="space-y-6"><h1 className="text-3xl">NFT não encontrado</h1><Link to="/">Voltar ao catálogo</Link></section> : <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />
  return <Detail nft={query.data} key={query.data.id} />
}
