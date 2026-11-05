import { useId } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CatalogControls, FilterOption } from '../types'

interface Props extends Pick<CatalogControls, 'filters' | 'onFiltersChange'> {
  collections: FilterOption[]
  disabled: boolean
}

export function CatalogFilters({ filters, onFiltersChange, collections, disabled }: Props) {
  const id = useId()
  const update = (patch: Partial<typeof filters>) => onFiltersChange({ ...filters, ...patch })
  return (
    <div className="catalog-filters">
      <div className="flex items-center justify-between gap-4 border-b pb-6">
        <h2 className="flex items-center gap-3 text-lg font-bold"><SlidersHorizontal aria-hidden="true" className="size-5" />Filtros</h2>
        <Button variant="link" className="px-0 text-xs" disabled={disabled} onClick={() => update({
          collection: '', minPrice: '', maxPrice: '', availableOnly: false,
        })}>Limpar</Button>
      </div>
      <fieldset disabled={disabled} aria-describedby={disabled ? `${id}-filters-unavailable` : undefined} className="space-y-7 pt-6 disabled:opacity-60">
        <legend className="sr-only">Filtrar catálogo de NFTs</legend>
        <div>
          <label htmlFor={`${id}-collection`} className="mb-4 block text-sm font-medium">Coleção</label>
          <select id={`${id}-collection`} className="kurio-select w-full" value={filters.collection} onChange={event => update({ collection: event.target.value })}>
            <option value="">Todas as coleções</option>
            {collections.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="border-t pt-6">
          <p id={`${id}-price-label`} className="mb-4 text-sm font-medium">Faixa de preço</p>
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
        </div>
        <div className="border-t pt-6">
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
