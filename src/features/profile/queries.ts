import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileSchema, type ProfileUpdate, type AvatarUpdate, type PasswordChange } from '@/contracts/profile'
import { sessionKey, useSession } from '@/features/auth/api'
import { api } from '@/lib/api'
import { identityEpoch } from '@/lib/identity'
import { scopedRequest } from '@/lib/scoped-request'

export const profileKey = (userId: string) => ['private', userId, 'profile'] as const
export function useProfile() {
  const session = useSession(); const userId = session.data?.user.id ?? ''
  return useQuery({ queryKey: profileKey(userId), enabled: !!userId, staleTime: 15000,
    queryFn: async ({ signal }) => profileSchema.parse((await api.get('/profile', { signal })).data),
  })
}
export function useSaveProfile(resource: 'data' | 'avatar') {
  const session = useSession(); const client = useQueryClient(); const epoch = identityEpoch()
  const userId = session.data?.user.id ?? ''
  return useMutation({ mutationKey: ['private', userId, 'profile', resource], retry: false,
    mutationFn: async (data: ProfileUpdate | AvatarUpdate) => profileSchema.parse((await scopedRequest({ method: resource === 'data' ? 'PATCH' : 'PUT', url: resource === 'data' ? '/profile' : '/profile/avatar', data }, epoch)).data),
    onSuccess: async profile => {
      if (epoch !== identityEpoch()) return
      client.setQueryData(profileKey(userId), profile)
      await client.invalidateQueries({ queryKey: sessionKey })
    },
  })
}
export function useChangePassword() {
  const session = useSession(); const epoch = identityEpoch()
  return useMutation({ mutationKey: ['private', session.data?.user.id, 'password'], retry: false,
    mutationFn: async (data: PasswordChange) => { await scopedRequest({ method: 'POST', url: '/profile/password', data }, epoch) },
  })
}
