export interface Nft {
  id: string
  name: string
  collection: string
  image: { src: string; alt: string }
  price: { amount: string; currency: string }
}

export interface FeaturedNft {
  nft: Nft
  description: string
}

export interface CatalogFilters {
  search: string
  collection: string
  minPrice: string
  maxPrice: string
  availableOnly: boolean
  sort: 'recent' | 'price-asc' | 'price-desc'
}

export interface FilterOption {
  value: string
  label: string
}

export interface CatalogPage {
  items: Nft[]
  total: number
  page: number
  pageCount: number
  collections: FilterOption[]
}

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
