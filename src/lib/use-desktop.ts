import { useSyncExternalStore } from 'react'
const query = '(min-width: 1024px)'
function subscribe(listener: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
// The server fallback also keeps an eventual SSR render safe.
export function useDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
