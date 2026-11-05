import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Início" description="Explore o marketplace de NFTs da Jungle Gaming.">
      <Link to="/nfts/$nftId" params={{ nftId: 'exemplo' }} className={buttonVariants({ variant: 'outline' })}>
        Ver NFT de exemplo
      </Link>
    </PagePlaceholder>
  )
}
