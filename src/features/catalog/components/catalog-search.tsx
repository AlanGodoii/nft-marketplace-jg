import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { CatalogControls } from '../types'
export function CatalogSearch({ filters, onFiltersChange, disabled }: Pick<CatalogControls,'filters'|'onFiltersChange'> & {disabled:boolean}) {
  return <div className="catalog-search-box relative min-w-0 flex-1"><label htmlFor="nft-search" className="sr-only">Buscar NFTs</label><Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" /><Input id="nft-search" type="search" placeholder="Explorar coleções" value={filters.search} disabled={disabled} onChange={event=>onFiltersChange({...filters,search:event.target.value})} className="h-11 rounded-sm pl-10" /></div>
}
