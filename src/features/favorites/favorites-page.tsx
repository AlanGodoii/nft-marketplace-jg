import { AccountLayout } from '@/components/layout/account-layout'
import { LoadingState, ErrorState } from '@/components/async-state'
import { apiErrorMessage } from '@/lib/api'
import { NftCard } from '@/features/catalog/components/nft-card'
import { FavoriteButton } from './favorite-button'
import { useFavorites } from './queries'
export function FavoritesPage() {
  const query = useFavorites()
  return <AccountLayout><section className="space-y-8"><h1 className="text-3xl font-bold">Favoritos</h1>
    {query.isPending ? <LoadingState label="Carregando favoritos" /> : query.isError ? <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} /> : query.data.items.length ? <div className="favorites-grid">{query.data.items.map(nft => <div key={nft.id} className="space-y-4"><NftCard nft={nft} /><FavoriteButton nft={nft} /></div>)}</div> : <p role="status">Você ainda não tem favoritos.</p>}
  </section></AccountLayout>
}
