import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/login')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Login" description="Acesse sua conta na Jungle Gaming.">
      <Link to="/cadastro" className={buttonVariants({ variant: 'outline' })}>
        Criar conta
      </Link>
    </PagePlaceholder>
  )
}
