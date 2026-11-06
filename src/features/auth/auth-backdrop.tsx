import { useQuery } from '@tanstack/react-query'
import { defaultCatalogSearch } from '@/contracts/catalog'
import { listNfts } from '@/features/catalog/api'
import { HomePage } from '@/features/catalog/home-page'
export function AuthBackdrop() {
  const query = useQuery({ queryKey:['public','auth-backdrop',{...defaultCatalogSearch,pageSize:9}], queryFn:({signal})=>listNfts({...defaultCatalogSearch,pageSize:9},signal), retry:false, staleTime:60000 })
  return <div className="auth-backdrop home-desktop" inert aria-hidden="true"><HomePage editorial={false} catalog={query.isPending ? {status:'loading'} : query.isError ? {status:'error',message:'Catálogo indisponível.'} : {status:'success',data:query.data}} /></div>
}
