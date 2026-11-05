import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/features/auth/auth-page'
import { authSearch } from '@/features/auth/redirect'
export const Route = createFileRoute('/login')({ validateSearch: authSearch, component: LoginPage })
