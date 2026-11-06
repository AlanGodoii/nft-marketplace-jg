import { useDesktop } from '@/lib/use-desktop'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUpRight, ImageOff } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FeaturedNft, RemoteData } from '../types'

export function Hero({ featured }: { featured: RemoteData<FeaturedNft | null> }) {
  const desktop = useDesktop()
  if (desktop) return (
      <section className="desktop-home-hero desktop-home-only" aria-labelledby="desktop-hero-title">
        <div className="desktop-hero-copy">
          <p>Bem-vindo à Kurio</p>
          <h1 id="desktop-hero-title">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</h1>
          <p className="desktop-hero-description">Descubra NFTs selecionados de criadores emergentes e consagrados.<br />Colecione arte digital rara, apoie artistas e tenha uma parte da<br />cultura da internet.</p>
          <a href="#catalogo" className={buttonVariants({ className: 'desktop-explore' })}>EXPLORAR</a>
          <div className="banner-indicators" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <picture><source media="(min-width: 1024px)" srcSet="/assets/figma/home/emerald-ape.webp" /><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="Macaco com jaqueta verde e óculos, arte original Kurio" width="450" height="450" fetchPriority="high" /></picture>
      </section>
  )
  return (
    <section className="kurio-hero legacy-hero" aria-labelledby="hero-title">
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
            {featured.data.nft.image.src ? (
              <img src={featured.data.nft.image.src} alt={featured.data.nft.image.alt} width="450" height="450" className="size-full object-cover" />
            ) : (
              <div role="img" aria-label={featured.data.nft.image.alt} className="nft-art-placeholder size-full">
                <ImageOff aria-hidden="true" className="size-8" /><span>Arte original indisponível</span>
              </div>
            )}
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
