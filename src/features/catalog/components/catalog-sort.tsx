import type {CatalogControls} from '../types'
export function CatalogSort({filters,onFiltersChange,disabled,id='nft-sort'}:Pick<CatalogControls,'filters'|'onFiltersChange'> & {disabled:boolean;id?:string}) {
 return <div className="flex items-center gap-3"><label htmlFor={id} className="shrink-0 text-xs text-muted-foreground">Ordenar por</label><select id={id} className="kurio-select min-w-0 flex-1 sm:w-40" disabled={disabled} value={filters.sort} onChange={event=>onFiltersChange({...filters,sort:event.target.value as typeof filters.sort})}><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></div>
}
