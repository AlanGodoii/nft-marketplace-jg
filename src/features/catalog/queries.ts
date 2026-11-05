import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { CatalogSearch } from '@/contracts/catalog'
import { nftKeys } from '@/lib/query-keys'
import { getNft, listNfts } from './api'

export const catalogOptions = (search: CatalogSearch) => queryOptions({
  queryKey: nftKeys.list(search),
  queryFn: ({ signal }) => listNfts(search, signal),
  placeholderData: keepPreviousData,
})
export const nftOptions = (id: string) => queryOptions({
  queryKey: nftKeys.detail(id), queryFn: ({ signal }) => getNft(id, signal),
})
export const useCatalog = (search: CatalogSearch) => useQuery(catalogOptions(search))
export const useNft = (id: string) => useQuery(nftOptions(id))
