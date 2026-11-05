import { catalogPageSchema, nftResponseSchema } from '@/contracts/nft'
import type { CatalogSearch } from '@/contracts/catalog'
import { api } from '@/lib/api'

export async function listNfts(search: CatalogSearch, signal?: AbortSignal) {
  const { data } = await api.get<unknown>('/nfts', { params: search, signal })
  return catalogPageSchema.parse(data)
}
export async function getNft(id: string, signal?: AbortSignal) {
  const { data } = await api.get<unknown>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return nftResponseSchema.parse(data).item
}
