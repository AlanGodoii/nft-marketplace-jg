import { useRouter } from '@tanstack/react-router'
import type { Nft } from '@/contracts/nft'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api'
import { useSession } from '@/features/auth/api'
import { useFavoriteMutation, useFavorites } from './queries'
export function FavoriteButton({ nft }: { nft: Nft }) {
  const session = useSession()
  const favorites = useFavorites()
  const mutation = useFavoriteMutation(nft)
  const router = useRouter()
  const selected = favorites.data?.items.some(item => item.id === nft.id) ?? false
  return <div className="space-y-2">
    <Button variant="outline" aria-pressed={selected} disabled={session.isPending || (!!session.data && (favorites.isPending || favorites.isError)) || mutation.isPending}
      onClick={() => { if (!session.data) { void router.navigate({ to: '/login', search: { redirect: router.state.location.href } }); return } mutation.mutate(!selected) }}>
      {selected ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    </Button>
    {mutation.isPending && <p role="status" className="text-xs">Salvando favorito…</p>}
    {mutation.isError && <p role="alert">{apiErrorMessage(mutation.error)} O estado anterior foi restaurado.</p>}
    {favorites.isError && <div role="alert">{apiErrorMessage(favorites.error)} <Button onClick={() => void favorites.refetch()}>Recarregar favoritos</Button></div>}
  </div>
}
