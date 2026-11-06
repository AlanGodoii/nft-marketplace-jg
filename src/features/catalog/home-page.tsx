import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { CatalogSearch } from './components/catalog-search'
import { useDesktop } from '@/lib/use-desktop'
import { HomeEditorial, HomeSpotlight } from './components/home-editorial'
import { Hero } from './components/hero'
import { CatalogFilters } from './components/catalog-filters'
import { CatalogToolbar } from './components/catalog-toolbar'
import { CatalogGrid } from './components/catalog-grid'
import { CatalogPagination } from './components/catalog-pagination'
import type { Collection, Network } from '@/contracts/nft'
import { defaultCatalogSearch } from '@/contracts/catalog'
import { Button } from '@/components/ui/button'
import type { CatalogControls, CatalogPage, FeaturedNft, RemoteData } from './types'

interface HomePageProps {
  catalog?: RemoteData<CatalogPage>
  featured?: RemoteData<FeaturedNft | null>
  controls?: CatalogControls
  onRetry?: () => void
  onRefresh?: () => void
  editorial?: boolean
  updating?: boolean
  options?: { collections: Collection[]; networks: Network[] }
}

export function HomePage({
  catalog = { status: 'unavailable' },
  featured = { status: 'unavailable' },
  controls,
  editorial = true, onRetry, onRefresh, updating = false, options,
}: HomePageProps) {
  const desktop = useDesktop()
  const [filtersOpen,setFiltersOpen] = useState(false)
  const filters = controls?.filters ?? defaultCatalogSearch
  const onFiltersChange: CatalogControls['onFiltersChange'] = value => controls?.onFiltersChange(value)
  const onPageChange = (page: number) => controls?.onPageChange(page)
  const data = catalog.status === 'success' ? catalog.data : undefined
  const disabled = !controls
  const filterProps = { filters, onFiltersChange, collections: data?.collections ?? options?.collections ?? [], networks: data?.networks ?? options?.networks ?? [], disabled, facets: data?.facets }

  return (
    <div className="home-surface space-y-16 pb-16">
      {!desktop && <div className="mobile-home-search"><CatalogSearch filters={filters} onFiltersChange={onFiltersChange} disabled={disabled} /><Button aria-label="Abrir filtros do catálogo" aria-controls="mobile-catalog-filters" aria-expanded={filtersOpen} onClick={()=>{setFiltersOpen(!filtersOpen);requestAnimationFrame(()=>document.getElementById('mobile-catalog-filters')?.scrollIntoView({block:'center'}))}}><SlidersHorizontal aria-hidden="true" /></Button></div>}
      <Hero featured={featured} />
      <section id="catalogo" aria-labelledby="catalog-title" className="catalog-layout scroll-mt-6">
        <aside aria-label="Filtros do catálogo" className="desktop-filters"><CatalogFilters {...filterProps} />{desktop && <HomeSpotlight nft={data?.items.find(nft => nft.availability.status === 'available')} />}</aside>
        <div className="min-w-0">
          <details id="mobile-catalog-filters" open={filtersOpen} onToggle={event=>setFiltersOpen(event.currentTarget.open)} className="mobile-filters mb-6 rounded-sm border p-4">
            <summary className="cursor-pointer text-sm font-medium">Filtrar NFTs</summary>
            <div className="pt-5"><CatalogFilters {...filterProps} /></div>
          </details>
          <CatalogToolbar total={data?.total} filters={filters} onFiltersChange={onFiltersChange} disabled={disabled} />
          <div className="catalog-refresh mt-4 flex min-h-9 items-center justify-between gap-4">
            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{updating ? 'Atualizando catálogo…' : ''}</p>
            {onRefresh && <Button variant="link" disabled={updating} onClick={onRefresh}>Atualizar catálogo</Button>}
          </div>
          <div className="catalog-results py-8" aria-busy={updating}><CatalogGrid catalog={catalog} onRetry={onRetry} /></div>
          <CatalogPagination page={data?.page} pageCount={data?.pageCount} disabled={updating}
            onPageChange={onPageChange} />
        </div>
      </section>
      {desktop && editorial && <HomeEditorial />}
    </div>
  )
}
