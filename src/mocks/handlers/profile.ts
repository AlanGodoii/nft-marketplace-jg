import { http, HttpResponse } from 'msw'
import { avatarMaxBytes, avatarUpdateSchema, passwordChangeSchema, profileUpdateSchema, type Profile } from '@/contracts/profile'
import { commerceSnapshot, transact, type CommerceState } from '../commerce-db'
import { hashPassword, randomSecret } from '../password'
import { apiFailure, identity, operation, parseBody, unauthorized } from './shared'

function profileFor(state: CommerceState, userId: string): Profile {
  const user = state.accounts.find(account => account.id === userId)!
  return state.profiles[userId] ?? { id: user.id, name: user.name, email: user.email, username: '', bio: '', website: '', avatar: null, version: 1 }
}
async function validImage(data: string) {
  try {
    const [header, encoded] = data.split(',')
    const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0))
    if (!bytes.length || bytes.length > avatarMaxBytes) return false
    const mime = header.slice(5, header.indexOf(';'))
    const signature = mime === 'image/png' ? bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
      : mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    if (!signature) return false
    const image = await createImageBitmap(new Blob([bytes], { type: mime }))
    const valid = image.width > 0 && image.height > 0 && image.width <= 4096 && image.height <= 4096
    image.close()
    return valid
  } catch { return false }
}
export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    const failed = await operation(request, 'profile.read'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    return HttpResponse.json(profileFor(commerceSnapshot(), current.user.id))
  }),
  http.patch('/api/profile', async ({ request }) => {
    const failed = await operation(request, 'profile.update'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    const parsed = await parseBody(request, profileUpdateSchema); if (parsed.error) return parsed.error
    const input = parsed.data!
    const result = transact(state => {
      const profile = profileFor(state, current.user.id)
      if (profile.version !== input.version) return { error: 'stale' }
      if (state.accounts.some(account => account.id !== current.user.id && account.email === input.email)) return { error: 'email' }
      if (input.username && Object.values(state.profiles).some(p => p.id !== current.user.id && p.username.toLowerCase() === input.username.toLowerCase())) return { error: 'username' }
      const account = state.accounts.find(account => account.id === current.user.id)!
      account.name = input.name; account.email = input.email
      state.profiles[current.user.id] = { ...profile, ...input, version: profile.version + 1 }
      return { profile: state.profiles[current.user.id] }
    })
    if (result.error) return apiFailure(409, 'CONFLICT', result.error === 'stale' ? 'O perfil mudou. Recarregue antes de salvar.' : 'Este e-mail ou nome de usuário já está em uso.', result.error === 'stale' ? undefined : { [result.error]: ['Este valor já está em uso.'] })
    return HttpResponse.json(result.profile)
  }),
  http.put('/api/profile/avatar', async ({ request }) => {
    const failed = await operation(request, 'profile.avatar'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    const parsed = await parseBody(request, avatarUpdateSchema); if (parsed.error) return parsed.error
    if (parsed.data!.avatar && !await validImage(parsed.data!.avatar)) return apiFailure(400, 'VALIDATION_ERROR', 'Imagem inválida. Use PNG, JPEG ou WebP de até 256 KiB e 4096×4096 px.', { avatar: ['Imagem inválida ou acima dos limites.'] })
    // Decoding is asynchronous; revalidate authorization before committing.
    const active = await identity(request); if (!active?.user || active.user.id !== current.user.id) return unauthorized()
    const result = transact(state => {
      const profile = profileFor(state, current.user.id)
      if (profile.version !== parsed.data!.version) return null
      return state.profiles[current.user.id] = { ...profile, avatar: parsed.data!.avatar, version: profile.version + 1 }
    })
    return result ? HttpResponse.json(result) : apiFailure(409, 'CONFLICT', 'O perfil mudou. Recarregue antes de salvar.')
  }),
  http.post('/api/profile/password', async ({ request }) => {
    const failed = await operation(request, 'profile.password'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    const parsed = await parseBody(request, passwordChangeSchema); if (parsed.error) return parsed.error
    const account = commerceSnapshot().accounts.find(account => account.id === current.user.id)!
    if (await hashPassword(parsed.data!.currentPassword, account.salt) !== account.passwordHash) return apiFailure(400, 'VALIDATION_ERROR', 'Senha atual incorreta.', { currentPassword: ['Senha atual incorreta.'] })
    const salt = randomSecret(); const passwordHash = await hashPassword(parsed.data!.newPassword, salt)
    const active = await identity(request); if (!active?.user || active.user.id !== current.user.id) return unauthorized()
    const saved = transact(state => {
      const latest = state.accounts.find(user => user.id === current.user.id)!
      if (latest.passwordHash !== account.passwordHash) return false
      latest.salt = salt; latest.passwordHash = passwordHash
      const hashes = state.sessions.filter(session => session.userId === current.user.id).map(session => session.tokenHash)
      state.sessions = state.sessions.filter(session => session.userId !== current.user.id)
      for (const hash of hashes) delete state.connections[hash]
      return true
    })
    return saved ? new HttpResponse(null, { status: 204 }) : apiFailure(409, 'CONFLICT', 'A senha mudou durante esta operação. Entre novamente.')
  }),
]
