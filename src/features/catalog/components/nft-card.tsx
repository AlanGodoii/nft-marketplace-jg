import { FavoriteButton } from '@/features/favorites/favorite-button'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, ImageOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft } from '../types'

export function NftCard({ nft, showFavorite = false }: { nft: Nft; showFavorite?: boolean }) {
  return (
    <Card className="nft-card">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="nft-card-link">
        {nft.image.desktopSrc && <picture className="desktop-card-art"><source media="(min-width: 1024px)" srcSet={nft.image.desktopSrc} /><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt={`Arte original Kurio de ${nft.name}`} width="258" height="258" loading="lazy" /></picture>}
        <div className={nft.image.desktopSrc ? 'legacy-card-art' : ''}>{nft.image.src ? <img src={nft.image.src} alt={nft.image.alt} loading="lazy" width="258" height="258" /> : (
          <div className="nft-art-placeholder" role="img" aria-label={nft.image.alt}>
            <ImageOff aria-hidden="true" className="size-7" /><span>Arte original indisponível</span>
          </div>
        )}</div>
        <CardContent className="nft-card-content space-y-3 p-5">
          <p className="card-metadata text-xs text-muted-foreground">{nft.collection.name}</p>
          <h3 className="truncate text-lg font-medium">{nft.name}</h3>
          <p className="card-metadata text-xs text-muted-foreground">{nft.network.name} · {nft.availability.status === 'available' ? `${nft.availability.remaining} disponíveis` : 'Esgotado'}</p>
          <div className="card-price flex items-center justify-between gap-3 border-t pt-4">
            <div><p className="card-metadata text-xs text-muted-foreground">Preço</p>
              <p className="mt-1 font-bold text-primary">{nft.price.amount} {nft.price.currency}</p>
            </div>
            <ArrowUpRight aria-hidden="true" className="size-5 text-primary" />
          </div>
        </CardContent>
      </Link>
      {showFavorite && <div className="card-favorite"><FavoriteButton nft={nft} compact /></div>}
    </Card>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true" className="nft-card nft-card-skeleton overflow-hidden rounded-xl border">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="nft-card-content space-y-3 p-5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
        <div className="border-t pt-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="mt-1 h-5 w-1/2" /></div>
      </div>
    </div>
  )
}
