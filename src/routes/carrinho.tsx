import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/carrinho')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Carrinho" description="Confira os NFTs selecionados.">
      <Link to="/checkout" className={buttonVariants({ variant: 'outline' })}>
        Ir para o checkout
      </Link>
    </PagePlaceholder>
  )
}
