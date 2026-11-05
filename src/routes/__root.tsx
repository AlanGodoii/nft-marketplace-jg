import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { RouteError } from '@/components/route-error'
import { MainLayout } from '@/components/layout/main-layout'
import { NotFound } from '@/components/not-found'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: MainLayout,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
})
