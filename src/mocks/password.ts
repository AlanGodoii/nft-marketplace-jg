const encoder = new TextEncoder()
export async function hashPassword(password: string, salt: string) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' }, material, 256)
  return Array.from(new Uint8Array(bits), value => value.toString(16).padStart(2, '0')).join('')
}
export function randomSecret() { return crypto.randomUUID() + crypto.randomUUID() }
export async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('')
}
