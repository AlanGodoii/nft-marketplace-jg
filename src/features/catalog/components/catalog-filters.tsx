import { useId } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Collection, Network } from '@/contracts/nft'
import type { CatalogControls } from '../types'

interface Props extends Pick<CatalogControls, 'filters' | 'onFiltersChange'> {
  collections: Collection[]
  networks: Network[]
  facets?: { collections: Record<string, number>; networks: Record<string, number> }
  disabled: boolean
}

export function CatalogFilters({ filters, onFiltersChange, collections, networks, disabled, facets }: Props) {
  const id = useId()
  const update = (patch: Partial<typeof filters>) => onFiltersChange({ ...filters, ...patch })
  return (
    <div className="catalog-filters">
      <div className="filter-top flex items-center justify-between gap-4 border-b pb-6">
        <h2 className="flex items-center gap-3 text-lg font-bold"><SlidersHorizontal aria-hidden="true" className="size-5" />Filtros</h2>
        <Button variant="link" className="px-0 text-xs" disabled={disabled} onClick={() => update({
          collection: '', network: '', minPrice: '', maxPrice: '', availableOnly: false,
        })}>Limpar</Button>
      </div>
      <fieldset disabled={disabled} aria-describedby={disabled ? `${id}-filters-unavailable` : undefined} className="space-y-7 pt-6 disabled:opacity-60">
        <legend className="sr-only">Filtrar catálogo de NFTs</legend>
        <div className="filter-collection">
          <p className="desktop-home-only filter-label">Coleções</p>
          <div className="desktop-home-only filter-option-list">{collections.map(option => <button type="button" key={option.id} aria-pressed={filters.collection === option.id} onClick={() => update({ collection: filters.collection === option.id ? '' : option.id })}><span>{option.name}</span><span>{facets?.collections[option.id] !== undefined ? `(${facets.collections[option.id]})` : ''}</span></button>)}</div>
          <label htmlFor={`${id}-collection`} className="mb-4 block text-sm font-medium">Coleção</label>
          <select id={`${id}-collection`} className="kurio-select w-full" value={filters.collection} onChange={event => update({ collection: event.target.value })}>
            <option value="">Todas as coleções</option>
            {filters.collection && !collections.some(option => option.id === filters.collection) && <option value={filters.collection}>{filters.collection}</option>}
            {collections.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </div>
        <div className="filter-network">
          <p className="desktop-home-only filter-label">Rede</p>
          <div className="desktop-home-only filter-option-list">{networks.map(option => <button type="button" key={option.id} aria-pressed={filters.network === option.id} onClick={() => update({ network: filters.network === option.id ? '' : option.id })}><span>{option.name}</span><span>{facets?.networks[option.id] !== undefined ? `(${facets.networks[option.id]})` : ''}</span></button>)}</div>
          <label htmlFor={`${id}-network`} className="mb-4 block text-sm font-medium">Rede</label>
          <select id={`${id}-network`} className="kurio-select w-full" value={filters.network} onChange={event => update({ network: event.target.value })}>
            <option value="">Todas as redes</option>
            {filters.network && !networks.some(option => option.id === filters.network) && <option value={filters.network}>{filters.network}</option>}
            {networks.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </div>
        <div className="filter-price border-t pt-6">
          <p id={`${id}-price-label`} className="mb-4 text-sm font-medium">Faixa de preço</p>
          <input className="desktop-home-only price-range" type="range" aria-label="Limite de preço em ETH" min="0" max="3" step="0.01" value={filters.maxPrice || '3'} onChange={event => update({ maxPrice: event.target.value })} />
          <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby={`${id}-price-label`}>
            <div><label htmlFor={`${id}-min-price`} className="mb-2 block text-xs text-muted-foreground">Mínimo</label>
              <Input id={`${id}-min-price`} type="number" min="0" step="any" placeholder="Mínimo" value={filters.minPrice}
                onChange={event => update({ minPrice: event.target.value })} className="h-11 rounded-sm" />
            </div>
            <div><label htmlFor={`${id}-max-price`} className="mb-2 block text-xs text-muted-foreground">Máximo</label>
              <Input id={`${id}-max-price`} type="number" min="0" step="any" placeholder="Máximo" value={filters.maxPrice}
                onChange={event => update({ maxPrice: event.target.value })} className="h-11 rounded-sm" />
            </div>
          </div>
          <Button className="desktop-home-only apply-price" type="button" onClick={() => update({ minPrice: filters.minPrice, maxPrice: filters.maxPrice })}>Aplicar</Button>
        </div>
        <div className="filter-availability border-t pt-6">
          <p className="mb-4 text-sm font-medium">Disponibilidade</p>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <input type="checkbox" className="size-4 accent-primary" checked={filters.availableOnly}
              onChange={event => update({ availableOnly: event.target.checked })} />
            Disponíveis para compra
          </label>
        </div>
      </fieldset>
      {disabled && <p id={`${id}-filters-unavailable`} className="mt-6 text-xs leading-6 text-muted-foreground">Os filtros serão habilitados quando o catálogo estiver disponível.</p>}
    </div>
  )
}
