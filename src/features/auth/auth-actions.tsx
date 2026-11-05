import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api'
import { logout, useSession } from './api'
import { adoptSession } from './lifecycle'
export function AuthActions() {
  const session = useSession()
  const router = useRouter()
  const mutation = useMutation({ mutationFn: logout, retry: false, onSuccess: async () => {
    await adoptSession(null, null)
    await router.navigate({ to: '/' })
    await router.invalidate()
  } })
  if (!session.data) return null
  return <div className="session-actions">
    <span className="text-xs" aria-label="Usuário conectado">{session.data.user.name}</span>
    <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Sair</Button>
    {mutation.isError && <span role="alert" className="text-xs">{apiErrorMessage(mutation.error)}</span>}
  </div>
}
