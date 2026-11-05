import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/pedido/confirmacao')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Confirmação do pedido" description="Aqui você acompanhará a confirmação da sua compra.">
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Voltar ao início
      </Link>
    </PagePlaceholder>
  )
}
