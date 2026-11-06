import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Nft } from '@/contracts/nft'
const root = '/assets/figma/home/'
export function HomeSpotlight({ nft }: { nft?: Nft }) {
  if (!nft?.image.desktopSrc) return null
  return <div className="desktop-home-only home-spotlight">
    <p>NFT EM DESTAQUE</p><h3>DESCUBRA ESTA EDIÇÃO</h3>
    <Link to="/nfts/$nftId" params={{ nftId: nft.id }}><img src={nft.image.desktopSrc} alt={`Arte original de ${nft.name}`} width="310" height="310" loading="lazy" /><span>{nft.name}</span></Link>
  </div>
}
const articles = [
  { art: 'neon-vessel', date: '12 de setembro', minutes: 6, title: 'Como funciona a propriedade de NFTs', description: 'Aprenda a colecionar, negociar e verificar ativos digitais.' },
  { art: 'emerald-ape', date: '13 de setembro', minutes: 2, title: '10 artistas digitais para acompanhar', description: 'Conheça criadores que moldam a cultura digital.' },
  { art: 'sage-nomad', date: '15 de setembro', minutes: 3, title: 'Raridade, atributos e procedência', description: 'Entenda raridade, procedência, direitos autorais e utilidade.' },
  { art: 'golden-beat', date: '15 de setembro', minutes: 2, title: 'Como proteger sua carteira', description: 'Proteja sua carteira, seus ativos e sua identidade.' },
]
export function HomeEditorial() {
  const [article, setArticle] = useState<string | null>(null)
  return <div className="home-editorial desktop-home-only">
    <section aria-label="Explore o marketplace" className="home-promos">
      <div><img src={root + 'emerald-ape.webp'} alt="Arte Kurio: macaco de jaqueta verde" width="290" height="250" loading="lazy" /><div><h2>Lançamentos gênesis<br />de edição limitada</h2><p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p><Link to="/" search={previous => ({ ...previous, tab: 'new', page: 1 })} hash="catalogo" className={buttonVariants()}>Explorar <ArrowRight aria-hidden="true" /></Link></div></div>
      <div><img src={root + 'neon-vessel.webp'} alt="Arte Kurio: macaco de terno claro" width="290" height="250" loading="lazy" /><div><h2>Arte digital selecionada<br />e muito mais</h2><p>Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p><Link to="/" search={previous => ({ ...previous, tab: 'all', page: 1 })} hash="catalogo" className={buttonVariants()}>Explorar <ArrowRight aria-hidden="true" /></Link></div></div>
    </section>
    <section id="diario" aria-labelledby="diario-title" className="home-journal">
      <h2 id="diario-title">Diário da Cunhagem</h2><p>Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
      <div className="journal-grid">{articles.map(item => <article key={item.title}>
        <img src={root + item.art + '.webp'} alt="" width="270" height="198" loading="lazy" />
        <div><p className="article-meta">{item.date} | Leitura de {item.minutes} min</p><h3>{item.title}</h3><p>{item.description}</p><button type="button" onClick={() => setArticle(item.title)} aria-label={`Ler mais: ${item.title} (prévia editorial)`}>Ler mais →</button></div>
      </article>)}</div>
    </section>
    <Dialog open={article !== null} onOpenChange={open => { if (!open) setArticle(null) }}><DialogContent className="kurio-theme"><DialogHeader><DialogTitle>{article}</DialogTitle><DialogDescription>Prévia editorial do layout original. O conteúdo completo dos artigos está fora do escopo desta demonstração e não está disponível.</DialogDescription></DialogHeader></DialogContent></Dialog>
  </div>
}
