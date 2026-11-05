import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Nft } from '../types'

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <Card className="nft-card">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="nft-card-link">
        <img src={nft.image.src} alt={nft.image.alt} loading="lazy" width="258" height="258" />
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">{nft.collection}</p>
          <h3 className="truncate text-lg font-medium">{nft.name}</h3>
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
      <div className="space-y-4 p-5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
