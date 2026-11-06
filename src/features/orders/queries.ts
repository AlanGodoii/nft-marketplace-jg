import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderSchema, ordersSchema, type PurchaseAttempt } from '@/contracts/order'
import { useSession } from '@/features/auth/api'
import { api } from '@/lib/api'
import { identityEpoch } from '@/lib/identity'
import { scopedRequest } from '@/lib/scoped-request'
export const orderKeys = {
  all: (userId: string) => ['private', userId, 'orders'] as const,
  detail: (userId: string, id: string) => ['private', userId, 'orders', id] as const,
}
export function useOrders() {
  const session = useSession(); const userId = session.data?.user.id ?? ''
  return useQuery({ queryKey: orderKeys.all(userId), enabled: !!userId, staleTime: 0,
    queryFn: async ({ signal }) => ordersSchema.parse((await api.get('/orders', { signal })).data),
  })
}
export function useOrder(id?: string) {
  const session = useSession(); const userId = session.data?.user.id ?? ''; const client = useQueryClient()
  const query = useQuery({ queryKey: orderKeys.detail(userId, id ?? ''), enabled: !!userId && !!id, staleTime: 0,
    queryFn: async ({ signal }) => orderSchema.parse((await api.get(`/orders/${id}`, { signal })).data),
  })
  const status = query.data?.status; const version = query.data?.version
  useEffect(() => {
    if (status === 'confirmed') { void client.invalidateQueries({ queryKey: ['cart', `user:${userId}`] }); void client.invalidateQueries({ queryKey: ['nfts'] }); void client.invalidateQueries({ queryKey: orderKeys.all(userId), exact: true }) }
  }, [client, userId, status, version])
  return query
}
export function useCreateOrder() {
  const session = useSession(); const userId = session.data?.user.id ?? ''; const client = useQueryClient(); const epoch = identityEpoch()
  return useMutation({ mutationKey: ['private', userId, 'order-create'], retry: false,
    mutationFn: async (attempt: PurchaseAttempt) => orderSchema.parse((await scopedRequest({ method: 'POST', url: '/orders', data: attempt.input, headers: { 'Idempotency-Key': attempt.key } }, epoch)).data),
    onSuccess: order => { if (epoch === identityEpoch()) { client.setQueryData(orderKeys.detail(userId, order.id), (previous: unknown) => { const parsed = orderSchema.safeParse(previous); return parsed.success && (parsed.data.version > order.version || (parsed.data.status !== 'pending' && order.status === 'pending')) ? parsed.data : order }); void client.invalidateQueries({ queryKey: orderKeys.all(userId), exact: true }) } },
  })
}
