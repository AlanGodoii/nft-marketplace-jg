import { queryOptions, useQuery } from '@tanstack/react-query'
import { authResponseSchema, sessionSchema, type LoginInput, type RegisterInput } from '@/contracts/auth'
import { api, ApiRequestError } from '@/lib/api'
export const sessionKey = ['auth', 'session'] as const
export async function readSession(signal?: AbortSignal) {
  try { return sessionSchema.parse((await api.get<unknown>('/auth/session', { signal })).data) }
  catch (error) { if (error instanceof ApiRequestError && error.status === 401) return null; throw error }
}
export const sessionOptions = queryOptions({ queryKey: sessionKey, queryFn: ({ signal }) => readSession(signal), staleTime: 15000 })
export const useSession = () => useQuery(sessionOptions)
export async function login(input: LoginInput) { return authResponseSchema.parse((await api.post<unknown>('/auth/login', input)).data) }
export async function register(input: RegisterInput) { return authResponseSchema.parse((await api.post<unknown>('/auth/register', input)).data) }
export async function logout() { await api.post('/auth/logout') }
