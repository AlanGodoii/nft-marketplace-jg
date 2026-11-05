import { QueryClient } from '@tanstack/react-query'
import { ApiRequestError } from './api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: (failureCount, error) => failureCount < 1 && (!(error instanceof ApiRequestError) || !error.status || error.status >= 500),
    },
  },
})
