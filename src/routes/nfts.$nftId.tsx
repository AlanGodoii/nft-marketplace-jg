import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/catalog/nft-detail-page'
export const Route = createFileRoute('/nfts/$nftId')({ component: NftDetailPage })
