import { createFileRoute, Link } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/cadastro')({
  component: Page,
})

function Page() {
  return (
    <PagePlaceholder title="Cadastro" description="Crie sua conta na Jungle Gaming.">
      <Link to="/login" className={buttonVariants({ variant: 'outline' })}>
        Já tenho uma conta
      </Link>
    </PagePlaceholder>
  )
}
