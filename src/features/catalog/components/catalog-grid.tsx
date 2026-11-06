import { useDesktop } from '@/lib/use-desktop'
import { PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CatalogPage, RemoteData } from '../types'
import { NftCard, NftCardSkeleton } from './nft-card'

export function CatalogGrid({ catalog, onRetry }: {
  catalog: RemoteData<CatalogPage>
  onRetry?: () => void
}) {
  const desktop = useDesktop()
  if (catalog.status === 'loading') {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Carregando catálogo de NFTs</span>
        <div className="nft-grid">{Array.from({ length: 6 }, (_, index) => <NftCardSkeleton key={index} />)}</div>
      </div>
    )
  }
  if (catalog.status === 'success' && catalog.data.items.length > 0) {
    return <div className="nft-grid">{catalog.data.items.map(nft => <NftCard nft={nft} showFavorite={!desktop} key={nft.id} />)}</div>
  }
  const isError = catalog.status === 'error'
  return (
    <div className="catalog-empty" role={isError ? 'alert' : 'status'}>
      <PackageOpen aria-hidden="true" className="size-10 text-primary" />
      <h3 className="text-lg font-medium">{isError ? 'Não foi possível carregar os NFTs' : catalog.status === 'success' ? 'Nenhum NFT encontrado' : 'Catálogo ainda não disponível'}</h3>
      <p className="max-w-sm text-sm leading-7 text-muted-foreground">
        {isError ? catalog.message : catalog.status === 'success' ? 'Tente ajustar os filtros da busca.' : 'Os NFTs aparecerão aqui quando a fonte de dados estiver conectada.'}
      </p>
      {isError && onRetry && <Button variant="outline" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  )
}
