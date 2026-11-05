import { redirect } from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import { sessionOptions } from './api'
import { safeReturnTo } from './redirect'
export async function requireSession({ location }: { location: { href: string } }) {
  const session = await queryClient.fetchQuery({ ...sessionOptions, staleTime: 0 })
  if (!session) throw redirect({ to: '/login', search: { redirect: safeReturnTo(location.href) } })
  return { session }
}
