import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUpRight, ImageOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FeaturedNft, RemoteData } from '../types'

export function Hero({ featured }: { featured: RemoteData<FeaturedNft | null> }) {
  return (
    <section className="kurio-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Kurio · NFT Marketplace</p>
        <h1 id="hero-title" className="mt-6 text-4xl leading-tight font-bold sm:text-5xl">
          Descubra o seu<br /><span className="text-primary">próximo NFT.</span>
        </h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
          Explore o universo dos colecionáveis digitais.
        </p>
        <a href="#catalogo" className={buttonVariants({ className: 'mt-8 h-12 rounded-sm px-6' })}>
          Explorar NFTs <ArrowDown aria-hidden="true" />
        </a>
      </div>
      <div className="hero-art">
        {featured.status === 'loading' ? (
          <><span className="sr-only" role="status">Carregando destaque</span><Skeleton aria-hidden="true" className="size-full rounded-none" /></>
        ) : featured.status === 'success' && featured.data ? (
          <Link to="/nfts/$nftId" params={{ nftId: featured.data.nft.id }} className="relative block size-full">
            <img src={featured.data.nft.image.src} alt={featured.data.nft.image.alt} width="450" height="450" className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-background/95 p-5">
              <div><h2 className="font-bold">{featured.data.nft.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{featured.data.description}</p>
              </div>
              <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
            </div>
          </Link>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-4 border border-dashed p-8 text-center text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-8" />
            <p className="text-sm">{featured.status === 'error' ? featured.message : 'Destaque indisponível'}</p>
          </div>
        )}
      </div>
    </section>
  )
}
