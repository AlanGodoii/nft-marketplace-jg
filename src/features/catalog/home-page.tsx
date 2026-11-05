import { useState } from 'react'
import { Hero } from './components/hero'
import { CatalogFilters } from './components/catalog-filters'
import { CatalogToolbar } from './components/catalog-toolbar'
import { CatalogGrid } from './components/catalog-grid'
import { CatalogPagination } from './components/catalog-pagination'
import type { CatalogControls, CatalogPage, FeaturedNft, RemoteData } from './types'

interface HomePageProps {
  catalog?: RemoteData<CatalogPage>
  featured?: RemoteData<FeaturedNft | null>
  controls?: CatalogControls
  onRetry?: () => void
}

export function HomePage({
  catalog = { status: 'unavailable' },
  featured = { status: 'unavailable' },
  controls,
  onRetry,
}: HomePageProps) {
  const [fallbackFilters] = useState<CatalogControls['filters']>({
    search: '', collection: '', minPrice: '', maxPrice: '', availableOnly: false, sort: 'recent',
  })
  const filters = controls?.filters ?? fallbackFilters
  const onFiltersChange: CatalogControls['onFiltersChange'] = value => controls?.onFiltersChange(value)
  const onPageChange = (page: number) => controls?.onPageChange(page)
  const data = catalog.status === 'success' ? catalog.data : undefined
  const disabled = !controls || catalog.status !== 'success'
  const filterProps = { filters, onFiltersChange, collections: data?.collections ?? [], disabled }

  return (
    <div className="space-y-16 pb-16">
      <Hero featured={featured} />
      <section id="catalogo" aria-labelledby="catalog-title" className="catalog-layout scroll-mt-6">
        <aside aria-label="Filtros do catálogo" className="desktop-filters"><CatalogFilters {...filterProps} /></aside>
        <div className="min-w-0">
          <details className="mobile-filters mb-6 rounded-sm border p-4">
            <summary className="cursor-pointer text-sm font-medium">Filtrar NFTs</summary>
            <div className="pt-5"><CatalogFilters {...filterProps} /></div>
          </details>
          <CatalogToolbar total={data?.total} filters={filters} onFiltersChange={onFiltersChange} disabled={disabled} />
          <div className="py-8"><CatalogGrid catalog={catalog} onRetry={onRetry} /></div>
          <CatalogPagination page={data?.page} pageCount={data?.pageCount}
            onPageChange={onPageChange} />
        </div>
      </section>
    </div>
  )
}
