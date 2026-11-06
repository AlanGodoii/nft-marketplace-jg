import { useCatalog } from '../queries'
import { defaultCatalogSearch } from '@/contracts/catalog'
import { NftCard, NftCardSkeleton } from './nft-card'
export function RelatedNfts({ exclude }: { exclude?: string }) {
  const query = useCatalog({ ...defaultCatalogSearch, pageSize: 6 })
  const items = query.data?.items.filter(nft => nft.id !== exclude).slice(0,5)
  return <section className="related-nfts" aria-labelledby="related-title"><h2 id="related-title">Você também pode gostar</h2>{query.isPending ? <div className="related-grid">{[0,1,2,3,4].map(i => <NftCardSkeleton key={i} />)}</div> : query.isError ? <p role="status">Não foi possível carregar as sugestões.</p> : <div className="related-grid">{items?.map(nft => <NftCard nft={nft} key={nft.id} />)}</div>}</section>
}
