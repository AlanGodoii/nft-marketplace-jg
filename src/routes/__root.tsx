import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { NotFound } from '@/components/not-found'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: MainLayout,
  notFoundComponent: NotFound,
})
