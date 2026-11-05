import { Link } from '@tanstack/react-router'
import { ArrowUpRight, ImageOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft } from '../types'

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <Card className="nft-card">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="nft-card-link">
        {nft.image.src ? <img src={nft.image.src} alt={nft.image.alt} loading="lazy" width="258" height="258" /> : (
          <div className="nft-art-placeholder" role="img" aria-label={nft.image.alt}>
            <ImageOff aria-hidden="true" className="size-7" /><span>Arte original indisponível</span>
          </div>
        )}
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">{nft.collection.name}</p>
          <h3 className="truncate text-lg font-medium">{nft.name}</h3>
          <p className="text-xs text-muted-foreground">{nft.network.name} · {nft.availability.status === 'available' ? `${nft.availability.remaining} disponíveis` : 'Esgotado'}</p>
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <div><p className="text-xs text-muted-foreground">Preço</p>
              <p className="mt-1 font-bold text-primary">{nft.price.amount} {nft.price.currency}</p>
            </div>
            <ArrowUpRight aria-hidden="true" className="size-5 text-primary" />
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true" className="nft-card overflow-hidden rounded-xl border">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
        <div className="border-t pt-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="mt-1 h-5 w-1/2" /></div>
      </div>
    </div>
  )
}
