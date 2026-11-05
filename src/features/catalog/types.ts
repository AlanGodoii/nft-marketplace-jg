export type { Nft, CatalogPage } from '@/contracts/nft'
export type { CatalogFilters } from '@/contracts/catalog'
import type { Nft } from '@/contracts/nft'
import type { CatalogFilters } from '@/contracts/catalog'

export interface FeaturedNft { nft: Nft; description: string }
export interface FilterOption { value: string; label: string }
export type RemoteData<T> =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }
export interface CatalogControls {
  filters: CatalogFilters
  onFiltersChange: (filters: CatalogFilters) => void
  onPageChange: (page: number) => void
}
