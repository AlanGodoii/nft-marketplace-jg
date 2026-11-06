import { useRouter } from '@tanstack/react-router'
import { ErrorState } from './async-state'
export function RouteError() {
  const router = useRouter()
  return <ErrorState message="Não foi possível carregar esta página ou verificar a sessão." retry={() => void router.invalidate()} />
}
