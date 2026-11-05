const tokenKey = 'kurio.auth.token'
const guestKey = 'kurio.guest.id'
let tokenMemory: string | null = null
let guestMemory: string | undefined
let epoch = 0
const cleanup = new Set<() => void>()
const listeners = new Set<() => void>()
export function getToken() { try { return sessionStorage.getItem(tokenKey) } catch { return tokenMemory } }
export function getGuestId() {
  try {
    let id = localStorage.getItem(guestKey)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(guestKey, id) }
    return id
  } catch { return guestMemory ??= crypto.randomUUID() }
}
function rotateGuest() {
  guestMemory = crypto.randomUUID()
  try { localStorage.setItem(guestKey, guestMemory) } catch { /* In-memory identity. */ }
}
export function identityEpoch() { return epoch }
export function setToken(token: string | null) {
  epoch += 1
  tokenMemory = token
  if (token) rotateGuest()
  try { if (token) sessionStorage.setItem(tokenKey, token); else sessionStorage.removeItem(tokenKey) } catch { /* Session memory only. */ }
  for (const stop of cleanup) stop()
  cleanup.clear()
}
export function registerSessionCleanup(stop: () => void) { cleanup.add(stop); return () => { cleanup.delete(stop) } }
export function onSessionExpired(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function reportSessionExpired(requestToken: string | undefined) {
  if (!requestToken || requestToken !== getToken()) return
  setToken(null)
  for (const listener of listeners) listener()
}
