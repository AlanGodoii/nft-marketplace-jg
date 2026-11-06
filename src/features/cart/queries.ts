import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartSchema, quoteSchema, type CartItemInput, type Cart } from '@/contracts/cart'
import { api } from '@/lib/api'
import { getGuestId, identityEpoch } from '@/lib/identity'
import { scopedRequest } from '@/lib/scoped-request'
import { useRealtime } from '@/features/realtime/state'
import { useSession } from '@/features/auth/api'
export function useCartScope() {
  const session = useSession()
  return { scope: session.data?.user.id ? `user:${session.data.user.id}` : `guest:${getGuestId()}`, ready: session.isSuccess }
}
export const cartKey = (scope: string) => ['cart', scope, 'data'] as const
export function useCart() {
  const { scope, ready } = useCartScope()
  return useQuery({ queryKey: cartKey(scope), enabled: ready, staleTime: 0,
    queryFn: async ({ signal }) => cartSchema.parse((await api.get<unknown>('/cart', { signal })).data),
  })
}
export function useQuote(cart?: Cart) {
  const { scope, ready } = useCartScope(); const live = useRealtime()
  const snapshotCurrent = !!cart && cart.items.every(item => item.nft.version >= (live.nftVersions[item.nftId] ?? 0))
  const query = useQuery({ queryKey: ['cart', scope, 'quote', cart?.version, cart?.items.map(item => `${item.id}:${item.nft.version}`)], enabled: ready && snapshotCurrent, staleTime: 0,
    queryFn: async ({ signal }) => quoteSchema.parse((await api.get<unknown>('/cart/quote', { signal })).data),
  })
  return { ...query, snapshotCurrent }
}
type CartAction = { type: 'add'; item: CartItemInput } | { type: 'update'; id: string; quantity: number } | { type: 'remove'; id: string } | { type: 'coupon'; code: string } | { type: 'remove-coupon' }
export function useCartMutation() {
  const client = useQueryClient()
  const { scope } = useCartScope()
  const epochAtRender = identityEpoch()
  return useMutation({ mutationKey: ['cart', scope, 'mutation'], retry: false,
    mutationFn: async (action: CartAction) => {
      const config = action.type === 'add' ? { method: 'POST', url: '/cart/items', data: action.item }
        : action.type === 'update' ? { method: 'PATCH', url: `/cart/items/${encodeURIComponent(action.id)}`, data: { quantity: action.quantity } }
          : action.type === 'remove' ? { method: 'DELETE', url: `/cart/items/${encodeURIComponent(action.id)}` }
            : action.type === 'coupon' ? { method: 'POST', url: '/cart/coupon', data: { code: action.code } }
              : { method: 'DELETE', url: '/cart/coupon' }
      return cartSchema.parse((await scopedRequest(config, epochAtRender)).data)
    },
    onMutate: async () => { const epoch = identityEpoch(); await client.cancelQueries({ queryKey: ['cart', scope] }); return { epoch } },
    onSuccess: (data, _action, context) => { if (context?.epoch === identityEpoch()) client.setQueryData(cartKey(scope), data) },
    onSettled: (_data, _error, _action, context) => { if (context?.epoch === identityEpoch()) return client.invalidateQueries({ queryKey: ['cart', scope] }) },
  })
}
export function useCartBusy() { const { scope } = useCartScope(); return useIsMutating({ mutationKey: ['cart', scope] }) > 0 }
