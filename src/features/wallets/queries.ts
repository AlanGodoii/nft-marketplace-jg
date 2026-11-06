import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletSchema, walletsSchema, connectionSchema, type WalletInput } from '@/contracts/wallet'
import { useSession } from '@/features/auth/api'
import { api } from '@/lib/api'
import { identityEpoch } from '@/lib/identity'
import { scopedRequest } from '@/lib/scoped-request'
export const walletKey = (userId: string) => ['private', userId, 'wallets'] as const
export function useWallets() {
  const session = useSession(); const userId = session.data?.user.id ?? ''
  return useQuery({ queryKey: walletKey(userId), enabled: !!userId, staleTime: 0,
    queryFn: async ({ signal }) => walletsSchema.parse((await api.get('/wallets', { signal })).data),
  })
}
export function useSaveWallet() {
  const client = useQueryClient(); const session = useSession(); const epoch = identityEpoch()
  return useMutation({ mutationKey: ['private', session.data?.user.id, 'wallet-save'], retry: false,
    mutationFn: async ({ id, input }: { id?: string; input: WalletInput }) => walletSchema.parse((await scopedRequest({ method: id ? 'PATCH' : 'POST', url: id ? `/wallets/${id}` : '/wallets', data: input }, epoch)).data),
    onSuccess: () => { if (epoch === identityEpoch()) return client.invalidateQueries({ queryKey: walletKey(session.data?.user.id ?? '') }) },
  })
}
export function useWalletConnection() {
  const session = useSession(); const epoch = identityEpoch()
  return useMutation({ mutationKey: ['private', session.data?.user.id, 'wallet-connection'], retry: false,
    mutationFn: async ({ walletId, action }: { walletId: string; action: 'connect' | 'disconnect' }) => connectionSchema.parse((await scopedRequest({ method: 'POST', url: `/wallets/${walletId}/connection`, data: { action } }, epoch)).data),
  })
}
