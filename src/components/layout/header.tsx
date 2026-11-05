import { AuthActions } from '@/features/auth/auth-actions'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'

const links = [
  { to: '/', label: 'Início' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/carteiras', label: 'Carteiras' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/login', label: 'Entrar' },
  { to: '/cadastro', label: 'Cadastrar' },
] as const

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="kurio-header">
      <div className="kurio-container header-inner">
        <Link to="/" aria-label="Kurio — início" className="kurio-wordmark" onClick={() => setMenuOpen(false)}>kurio<span aria-hidden="true">.</span></Link>
        <nav id="main-navigation" aria-label="Navegação principal" className={`header-links ${menuOpen ? 'is-open' : ''}`}>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} className="header-link"
              activeProps={{ className: 'is-active', 'aria-current': 'page' }}
              onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3"><AuthActions />
          <Link to="/carrinho" aria-label="Carrinho" className={buttonVariants({ variant: 'outline', className: 'size-11 rounded-sm' })} onClick={() => setMenuOpen(false)}>
            <ShoppingBag aria-hidden="true" className="size-5" />
          </Link>
          <Button variant="outline" className="mobile-menu-toggle size-11 rounded-sm" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
