import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/checkout')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Checkout" description="Revise as informações da sua compra.">
      <Link to="/pedido/confirmacao" className={buttonVariants({ variant: 'outline' })}>
        Ver página de confirmação
      </Link>
    </PagePlaceholder>
  )
}
