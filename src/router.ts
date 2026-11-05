import { createRouter, defaultParseSearch } from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  parseSearch: search => {
    const parsed: Record<string, unknown> = { ...defaultParseSearch(search) }
    const raw = new URLSearchParams(search)
    // Direct links may contain unquoted decimals. Router's JSON parser would
    // turn them into numbers before validation and irreversibly lose precision.
    for (const key of ['minPrice', 'maxPrice']) {
      const value = raw.get(key)
      if (value !== null && typeof parsed[key] === 'number') parsed[key] = value
    }
    return parsed
  },
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
