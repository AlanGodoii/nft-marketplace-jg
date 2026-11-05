import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/nfts/$nftId')({
  component: Page,
})

function Page() {
  const { nftId } = Route.useParams()
  return (
    <PagePlaceholder title="Detalhes do NFT" description="Conheça os detalhes deste NFT.">
      <p className="text-sm">Identificador: {nftId}</p>
      <Link to="/carrinho" className={buttonVariants({ variant: 'outline' })}>
        Ver carrinho
      </Link>
    </PagePlaceholder>
  )
}
