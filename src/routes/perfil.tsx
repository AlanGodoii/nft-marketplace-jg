import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import { ProfilePage } from '@/features/profile/profile-page'

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireSession,
  component: ProfilePage,
})
