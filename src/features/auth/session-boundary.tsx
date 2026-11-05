import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { getToken, onSessionExpired, registerSessionCleanup } from '@/lib/identity'
import { Button } from '@/components/ui/button'
import { useSession, sessionKey } from './api'
import { clearScopedData } from './lifecycle'
import { safeReturnTo } from './redirect'

export function SessionBoundary() {
  const session = useSession()
  const { data: activeSession, refetch } = session
  const router = useRouter()
  const client = useQueryClient()
  useEffect(() => onSessionExpired(() => {
    void clearScopedData().then(() => {
      client.setQueryData(sessionKey, null)
      void router.navigate({ to: '/login', search: { redirect: safeReturnTo(router.state.location.href) }, replace: true })
    })
  }), [client, router])
  useEffect(() => {
    if (!activeSession) return
    const timer = window.setTimeout(() => { void refetch() }, Math.max(0, Date.parse(activeSession.expiresAt) - Date.now()))
    const storageChanged = (event: StorageEvent) => {
      if (event.key === 'kurio.mock.commerce.v1') {
        void client.invalidateQueries({ queryKey: sessionKey })
        void client.invalidateQueries({ predicate: query => query.queryKey[0] === 'private' || query.queryKey[0] === 'cart' })
      }
    }
    window.addEventListener('storage', storageChanged)
    const stop = () => { clearTimeout(timer); window.removeEventListener('storage', storageChanged) }
    const unregister = registerSessionCleanup(stop)
    return () => { stop(); unregister() }
  }, [client, activeSession, refetch])
  if (session.isError && getToken()) return <div role="alert" className="mb-6 rounded border p-4">Não foi possível verificar sua sessão. <Button onClick={() => void refetch()}>Verificar sessão novamente</Button></div>
  return null
}
