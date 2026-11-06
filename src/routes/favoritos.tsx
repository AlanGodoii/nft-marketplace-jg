import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import { FavoritesPage } from '@/features/favorites/favorites-page'
export const Route = createFileRoute('/favoritos')({ beforeLoad: requireSession, component: FavoritesPage })
