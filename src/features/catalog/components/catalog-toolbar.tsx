import { useDesktop } from '@/lib/use-desktop'
import { CatalogSort } from './catalog-sort'
import { CatalogSearch } from './catalog-search'
import type { CatalogControls } from '../types'

interface Props extends Pick<CatalogControls, 'filters' | 'onFiltersChange'> {
  total?: number
  disabled: boolean
}

export function CatalogToolbar({ total, filters, onFiltersChange, disabled }: Props) {
  const desktop = useDesktop()
  return (
    <div className="catalog-toolbar">
      <div className="desktop-catalog-tabs desktop-home-only" role="group" aria-label="Categorias do catálogo" aria-describedby="catalog-tabs-policy">
        {([['all', 'Todos os NFTs'], ['new', 'Novos lançamentos'], ['trending', 'Em alta']] as const).map(([tab, label]) => <button key={tab} type="button" disabled={disabled} aria-pressed={(filters.tab ?? 'all') === tab} onClick={() => onFiltersChange({ ...filters, tab })}>{label}</button>)}
      </div>
      <p id="catalog-tabs-policy" className="sr-only">Novos lançamentos: publicados desde 1 de novembro de 2026. Em alta: seleção de edições disponíveis, sem estatística de vendas.</p>
      <div className="catalog-heading flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="catalog-title" className="text-2xl font-bold">Explore os NFTs</h2>
        <p className="text-xs text-muted-foreground">{total !== undefined ? `${total} NFTs encontrados` : 'Catálogo indisponível'}</p>
      </div>
      {desktop && <div className="mt-6 flex flex-col gap-3 sm:flex-row"><CatalogSearch filters={filters} onFiltersChange={onFiltersChange} disabled={disabled} /><CatalogSort filters={filters} onFiltersChange={onFiltersChange} disabled={disabled} /></div>}
    </div>
  )
}
