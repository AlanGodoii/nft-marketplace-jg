import type { CatalogSearch } from '@/contracts/catalog'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (search: CatalogSearch) => [...nftKeys.lists(), search] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}
