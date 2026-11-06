import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import { WalletsPage } from '@/features/wallets/wallets-page'
export const Route = createFileRoute('/carteiras')({ beforeLoad: requireSession, component: WalletsPage })
