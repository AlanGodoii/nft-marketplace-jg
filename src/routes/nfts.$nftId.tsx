import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/catalog/nft-detail-page'
import { nftOptions } from '@/features/catalog/queries'
export const Route = createFileRoute('/nfts/$nftId')({
  // Start REST concurrently with the lazy component, retaining query errors,
  // cancellation, cache keys and the visible loading state in the page.
  loader: ({ context, params }) => { void context.queryClient.prefetchQuery(nftOptions(params.nftId)) },
  component: NftDetailPage,
})
