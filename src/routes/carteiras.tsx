import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/carteiras')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Carteiras" description="Gerencie suas carteiras digitais.">
      <Link to="/perfil" className={buttonVariants({ variant: 'outline' })}>
        Voltar ao perfil
      </Link>
    </PagePlaceholder>
  )
}
