import { http, HttpResponse } from 'msw'
import { loginSchema, registerSchema } from '@/contracts/auth'
import { commerceSnapshot, transact } from '../commerce-db'
import { hashPassword, hashToken, randomSecret } from '../password'
import { sessionTtl } from '../scenarios'
import { mergeGuestCart } from '../cart-domain'
import { apiFailure, identity, operation, parseBody, unauthorized } from './shared'

async function signIn(request: Request, userId: string) {
  const token = randomSecret()
  const tokenHash = await hashToken(token)
  const expiresAt = Date.now() + sessionTtl()
  const previous = await identity(request)
  const result = transact(state => {
    const account = state.accounts.find(user => user.id === userId)!
    // Switching account revokes the token presented by this tab, not another tab's sessions.
    state.sessions = state.sessions.filter(session => session.expiresAt > Date.now() && (!previous?.user || session.tokenHash !== previous.tokenHash))
    state.sessions.push({ userId, tokenHash, expiresAt })
    const notices = mergeGuestCart(state, request.headers.get('X-Guest-ID') ?? 'anonymous', userId)
    return { token, session: { user: { id: account.id, name: account.name, email: account.email }, expiresAt: new Date(expiresAt).toISOString() }, notices }
  })
  return HttpResponse.json(result)
}
export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    const failed = await operation(request, 'auth.register'); if (failed) return failed
    const parsed = await parseBody(request, registerSchema); if (parsed.error) return parsed.error
    const input = parsed.data!
    const salt = randomSecret()
    const passwordHash = await hashPassword(input.password, salt)
    const userId = transact(state => {
      if (state.accounts.some(user => user.email === input.email)) return null
      const id = crypto.randomUUID()
      state.accounts.push({ id, name: input.name, email: input.email, salt, passwordHash })
      return id
    })
    if (!userId) return apiFailure(409, 'CONFLICT', 'Este e-mail já está cadastrado.', { email: ['Este e-mail já está cadastrado.'] })
    return signIn(request, userId)
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const failed = await operation(request, 'auth.login'); if (failed) return failed
    const parsed = await parseBody(request, loginSchema); if (parsed.error) return parsed.error
    const account = commerceSnapshot().accounts.find(user => user.email === parsed.data!.email)
    if (!account || await hashPassword(parsed.data!.password, account.salt) !== account.passwordHash) return apiFailure(401, 'UNAUTHORIZED', 'E-mail ou senha incorretos.')
    return signIn(request, account.id)
  }),
  http.get('/api/auth/session', async ({ request }) => {
    const failed = await operation(request, 'auth.session'); if (failed) return failed
    const current = await identity(request)
    return current?.user ? HttpResponse.json(current.session) : unauthorized()
  }),
  http.post('/api/auth/logout', async ({ request }) => {
    const failed = await operation(request, 'auth.logout'); if (failed) return failed
    const current = await identity(request)
    if (!current?.user) return unauthorized()
    transact(state => { state.sessions = state.sessions.filter(session => session.tokenHash !== current.tokenHash) })
    return new HttpResponse(null, { status: 204 })
  }),
]
