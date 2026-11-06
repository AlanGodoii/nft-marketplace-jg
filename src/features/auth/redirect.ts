export function safeReturnTo(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/'
  const path = value.split(/[?#]/)[0]
  return ['/login', '/cadastro'].includes(path) ? '/' : value
}
export function authSearch(search: Record<string, unknown>): { redirect?: string } {
  return typeof search.redirect === 'string' ? { redirect: safeReturnTo(search.redirect) } : {}
}
