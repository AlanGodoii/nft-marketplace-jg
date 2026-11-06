import { useDesktop } from '@/lib/use-desktop'
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
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {desktop && <CatalogSearch filters={filters} onFiltersChange={onFiltersChange} disabled={disabled} />}
        <div className="flex items-center gap-3">
          <label htmlFor="nft-sort" className="shrink-0 text-xs text-muted-foreground">Ordenar por</label>
          <select id="nft-sort" className="kurio-select min-w-0 flex-1 sm:w-40" disabled={disabled} value={filters.sort}
            onChange={event => onFiltersChange({ ...filters, sort: event.target.value as typeof filters.sort })}>
            <option value="recent">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </div>
      </div>
    </div>
  )
}
