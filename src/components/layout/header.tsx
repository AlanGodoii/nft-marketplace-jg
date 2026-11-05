import { Link } from '@tanstack/react-router'

const links = [
  { to: '/', label: 'Início' },
  { to: '/carrinho', label: 'Carrinho' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/carteiras', label: 'Carteiras' },
  { to: '/login', label: 'Entrar' },
  { to: '/cadastro', label: 'Cadastrar' },
] as const

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link to="/" className="text-xl font-bold">Jungle Gaming</Link>
        <nav aria-label="Navegação principal" className="flex flex-wrap gap-4 text-sm">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }}
              className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2"
              activeProps={{ className: 'font-semibold text-foreground', 'aria-current': 'page' }}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
