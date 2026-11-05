import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'

export function NotFound() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe.</p>
      <Link to="/" className={buttonVariants()}>Voltar ao início</Link>
    </section>
  )
}
