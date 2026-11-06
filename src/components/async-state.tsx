import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return <div role="status" aria-busy="true" className="space-y-4"><span className="sr-only">{label}</span><Skeleton className="h-10 w-2/3" /><Skeleton className="h-52 w-full" /><Skeleton className="h-20 w-full" /></div>
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="space-y-4 rounded border p-5"><p>{message}</p><Button onClick={retry}>Tentar novamente</Button></div>
}
