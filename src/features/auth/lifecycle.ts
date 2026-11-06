import type { Session } from '@/contracts/auth'
import { queryClient } from '@/lib/query-client'
import { setToken } from '@/lib/identity'
import { sessionKey } from './api'
export const isScopedKey = (key: readonly unknown[]) => key[0] === 'private' || key[0] === 'cart'
export async function clearScopedData() {
  await queryClient.cancelQueries({ predicate: query => isScopedKey(query.queryKey) })
  queryClient.removeQueries({ predicate: query => isScopedKey(query.queryKey) })
}
export async function adoptSession(token: string | null, session: Session | null) {
  await queryClient.cancelQueries({ queryKey: sessionKey })
  await clearScopedData()
  setToken(token)
  // An optimistic onMutate may have finished while cancellation was awaited.
  queryClient.removeQueries({ predicate: query => isScopedKey(query.queryKey) })
  queryClient.setQueryData(sessionKey, session)
}
