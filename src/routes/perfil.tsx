import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/perfil')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Perfil" description="Gerencie as informações da sua conta.">
      <Link to="/carteiras" className={buttonVariants({ variant: 'outline' })}>
        Ver carteiras
      </Link>
    </PagePlaceholder>
  )
}
