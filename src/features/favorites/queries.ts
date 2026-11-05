import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { favoritesSchema, type Favorites } from '@/contracts/cart'
import type { Nft } from '@/contracts/nft'
import { api, ApiRequestError } from '@/lib/api'
import { scopedRequest } from '@/lib/scoped-request'
import { identityEpoch } from '@/lib/identity'
import { useSession } from '@/features/auth/api'
export const favoriteKey = (userId: string) => ['private', userId, 'favorites'] as const
export function useFavorites() {
  const session = useSession()
  const userId = session.data?.user.id ?? ''
  return useQuery({ queryKey: favoriteKey(userId), enabled: !!userId, staleTime: 30000,
    queryFn: async ({ signal }) => favoritesSchema.parse((await api.get<unknown>('/favorites', { signal })).data),
  })
}
export function useFavoriteMutation(nft: Nft) {
  const client = useQueryClient()
  const session = useSession()
  const userId = session.data?.user.id ?? ''
  const key = favoriteKey(userId)
  const epochAtRender = identityEpoch()
  return useMutation({
    mutationKey: ['private', userId, 'favorite-mutation'], retry: false,
    mutationFn: async (adding: boolean) => favoritesSchema.parse((await scopedRequest({ url: `/favorites/${encodeURIComponent(nft.id)}`, method: adding ? 'POST' : 'DELETE' }, epochAtRender)).data),
    onMutate: async adding => {
      const epoch = identityEpoch()
      await client.cancelQueries({ queryKey: key })
      if (epoch !== identityEpoch()) throw new ApiRequestError('A sessão mudou. Tente novamente.', 'SESSION_CHANGED')
      const previous = client.getQueryData<Favorites>(key)
      client.setQueryData<Favorites>(key, { items: adding ? [...(previous?.items ?? []).filter(item => item.id !== nft.id), nft] : (previous?.items ?? []).filter(item => item.id !== nft.id) })
      return { previous, epoch }
    },
    onError: (_error, _adding, context) => { if (context?.epoch === identityEpoch()) client.setQueryData(key, context.previous ?? { items: [] }) },
    onSuccess: (data, _adding, context) => { if (context?.epoch === identityEpoch()) client.setQueryData(key, data) },
    onSettled: (_data, _error, _adding, context) => { if (context?.epoch === identityEpoch()) return client.invalidateQueries({ queryKey: key }) },
  })
}
