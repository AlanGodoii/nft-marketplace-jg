import { http, HttpResponse } from 'msw'
import { commerceSnapshot, transact } from '../commerce-db'
import { getMockDatabase } from '../db'
import { apiFailure, identity, operation, unauthorized } from './shared'

function view(userId: string) {
  const ids = commerceSnapshot().favorites[userId] ?? []
  return { items: getMockDatabase().snapshot().nfts.filter(nft => ids.includes(nft.id)) }
}
export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    const failed = await operation(request, 'favorites.read'); if (failed) return failed
    const current = await identity(request)
    return current?.user ? HttpResponse.json(view(current.user.id)) : unauthorized()
  }),
  ...(['post', 'delete'] as const).map(method => http[method]('/api/favorites/:nftId', async ({ request, params }) => {
    const failed = await operation(request, method === 'post' ? 'favorites.add' : 'favorites.remove'); if (failed) return failed
    const current = await identity(request)
    if (!current?.user) return unauthorized()
    const id = String(params.nftId)
    if (!getMockDatabase().snapshot().nfts.some(nft => nft.id === id)) return apiFailure(404, 'NOT_FOUND', 'NFT não encontrado.')
    transact(state => {
      const favorites = new Set(state.favorites[current.user.id] ?? [])
      if (method === 'post') favorites.add(id); else favorites.delete(id)
      state.favorites[current.user.id] = [...favorites]
    })
    return HttpResponse.json(view(current.user.id))
  })),
]
