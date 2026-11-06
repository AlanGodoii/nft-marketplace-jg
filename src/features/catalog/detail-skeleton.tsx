import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'

export function DetailSkeleton() {
  return <section className="detail-skeleton space-y-12" role="status" aria-busy="true">
    <span className="sr-only">Carregando detalhes do NFT</span>
    <nav aria-label="Localização" className="text-sm"><Link to="/">Início</Link> / Detalhes do NFT</nav>
    <div className="detail-layout" aria-hidden="true">
      <div className="detail-gallery"><div className="detail-thumbnails">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="detail-thumb" />)}</div><Skeleton className="detail-art" /></div>
      <div className="detail-info space-y-6"><Skeleton className="h-9 w-3/4" /><Skeleton className="h-9 w-1/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-12 w-2/3" /><Skeleton className="h-28 w-full" /></div>
    </div>
    <div className="detail-skeleton-description space-y-4 border-t pt-6" aria-hidden="true"><Skeleton className="h-7 w-1/3" /><Skeleton className="h-14 w-full" /></div>
  </section>
}
