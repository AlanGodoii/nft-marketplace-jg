import { useQueryClient } from '@tanstack/react-query'
import { Route } from '@/routes/index'
import type { CatalogPage as CatalogResponse } from '@/contracts/nft'
import type { CatalogFilters } from '@/contracts/catalog'
import { apiErrorMessage } from '@/lib/api'
import { nftKeys } from '@/lib/query-keys'
import { HomePage } from './home-page'
import { useCatalog } from './queries'
import type { RemoteData } from './types'

export function CatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const query = useCatalog(search)
  const catalog: RemoteData<CatalogResponse> = query.isPending ? { status: 'loading' }
    : query.isError ? { status: 'error', message: apiErrorMessage(query.error) }
      : { status: 'success', data: query.data }
  const metadata = query.data ?? queryClient.getQueriesData<CatalogResponse>({ queryKey: nftKeys.lists() }).map(([, data]) => data).find(data => data !== undefined)
  const onFiltersChange = (filters: CatalogFilters) => void navigate({ search: previous => ({ ...previous, ...filters, page: 1 }), resetScroll: false })
  return <HomePage catalog={catalog} options={metadata} updating={query.isFetching && !query.isPending}
    onRefresh={() => void queryClient.invalidateQueries({ queryKey: nftKeys.list(search), exact: true })}
    onRetry={() => void query.refetch()}
    controls={{ filters: search, onFiltersChange,
      onPageChange: page => { void navigate({ search: previous => ({ ...previous, page }), resetScroll: false }) },
    }} />
}
