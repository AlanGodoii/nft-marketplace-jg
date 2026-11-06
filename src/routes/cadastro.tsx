import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '@/features/auth/auth-page'
import { authSearch } from '@/features/auth/redirect'
export const Route = createFileRoute('/cadastro')({ validateSearch: authSearch, component: RegisterPage })
