import { delay, HttpResponse } from 'msw'
import type { ZodType } from 'zod'
import type { ApiErrorCode, ApiErrorResponse } from '@/contracts/error'
import { beginOperation } from '../scenarios'
import { commerceSnapshot } from '../commerce-db'
import { hashToken } from '../password'

export function apiFailure(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string[]>) {
  return HttpResponse.json<ApiErrorResponse>({ error: { code, message, ...(fields ? { fields } : {}) } }, { status })
}
export async function parseBody<T>(request: Request, schema: ZodType<T>) {
  let body: unknown
  try { body = await request.json() } catch { return { error: apiFailure(400, 'VALIDATION_ERROR', 'Informe um JSON válido.') } }
  const result = schema.safeParse(body)
  return result.success ? { data: result.data } : { error: apiFailure(400, 'VALIDATION_ERROR', 'Confira os campos informados.', result.error.flatten().fieldErrors as Record<string, string[]>) }
}
export async function operation(request: Request, name: string) {
  const run = beginOperation(name)
  await delay(run.latency)
  if (request.signal.aborted) return HttpResponse.error()
  if (run.networkError) return HttpResponse.error()
  if (run.status) return apiFailure(run.status, run.status === 401 ? 'UNAUTHORIZED' : run.status === 409 ? 'CONFLICT' : 'SERVER_ERROR', run.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível concluir a operação. Tente novamente.')
  return undefined
}
export async function identity(request: Request, guestAllowed = false) {
  const header = request.headers.get('Authorization')
  if (!header) {
    const guestId = request.headers.get('X-Guest-ID')
    if (!guestAllowed || !guestId || commerceSnapshot().retiredGuests.includes(guestId)) return null
    return { owner: `guest:${guestId}`, user: null }
  }
  if (!header.startsWith('Bearer ')) return null
  const tokenHash = await hashToken(header.slice(7))
  const state = commerceSnapshot()
  const session = state.sessions.find(item => item.tokenHash === tokenHash && item.expiresAt > Date.now())
  const user = session && state.accounts.find(item => item.id === session.userId)
  if (!user || !session) return null
  return { owner: `user:${user.id}`, user: { id: user.id, name: user.name, email: user.email }, session: { user: { id: user.id, name: user.name, email: user.email }, expiresAt: new Date(session.expiresAt).toISOString() }, tokenHash }
}
export const unauthorized = () => apiFailure(401, 'UNAUTHORIZED', 'Sua sessão expirou. Entre novamente.')
