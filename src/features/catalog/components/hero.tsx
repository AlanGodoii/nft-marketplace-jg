import { useDesktop } from '@/lib/use-desktop'
import { ArrowUpRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import type { FeaturedNft, RemoteData } from '../types'

export function Hero(_props: { featured: RemoteData<FeaturedNft | null> }) {
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
  return <section className="mobile-hero-banner" aria-labelledby="hero-title"><div><p>Bem-vindo à Kurio</p><h1 id="hero-title">SEJA DONO DA<br />CULTURA DIGITAL</h1><p>Descubra NFTs selecionados de criadores do mundo todo.</p><a href="#catalogo">EXPLORAR <ArrowUpRight aria-hidden="true" /></a></div><div className="mobile-hero-art"><img src="/assets/figma/home/emerald-ape.webp" alt="Arte original Kurio: macaco de jaqueta verde" width="180" height="180" fetchPriority="high" /><img src="/assets/figma/home/sage-nomad.webp" alt="" width="62" height="62" /></div><div className="banner-indicators" aria-hidden="true"><span /><span /><span /></div></section>
}
