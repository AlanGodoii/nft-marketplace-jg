import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Search, ShoppingCart, LogIn, UserRound } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthActions } from '@/features/auth/auth-actions'
import { useSession } from '@/features/auth/api'
import { useCart } from '@/features/cart/queries'

export function DesktopHomeHeader() {
  const isHome = useRouterState({ select: state => state.location.pathname === '/' })
  // Mount only on Home: other screens retain their header and query lifecycles.
  return isHome ? <HomeHeader /> : null
}
function HomeHeader() {
  const hash = useRouterState({ select: state => state.location.hash })
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')
  const currentSearch = useRouterState({ select: state => typeof state.location.search.search === 'string' ? state.location.search.search : '' })
  const searchInput = useRef<HTMLInputElement>(null)
  const searchToggle = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (searchOpen) searchInput.current?.focus() }, [searchOpen])
  const navigate = useNavigate()
  const session = useSession()
  const cart = useCart()
  const quantity = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0)
  const revisit = (target: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (target !== hash || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    // Re-selecting the current section must scroll again, without a new history entry.
    event.preventDefault()
    if (!target) window.scrollTo({ top: 0, behavior: 'instant' })
    else document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  return <header className="desktop-home-header desktop-home-only">
    <div className="kurio-container desktop-header-inner">
      <Link to="/" aria-label="Kurio — início" className="desktop-wordmark">KURIO</Link>
      <nav aria-label="Navegação principal" className="desktop-primary-nav">
        <Link to="/" search={true} hash="" resetScroll activeOptions={{ exact: true, includeHash: true, includeSearch: false }} activeProps={{ className: 'is-active', 'aria-current': 'page' }} onClick={revisit('')}>Início</Link>
        {([['catalogo', 'Mercado'], ['criadores', 'Criadores'], ['diario', 'Aprenda']] as const).map(([target, label]) => <Link key={target} to="/" search={true} hash={target} hashScrollIntoView={{ block: 'start', behavior: 'instant' }} activeOptions={{ exact: true, includeHash: true, includeSearch: false }} activeProps={{ className: 'is-active', 'aria-current': 'page' }} onClick={revisit(target)} title={`Ir à seção ${label} desta página`}>{label}</Link>)}
      </nav>
      <div className="desktop-header-actions">
        <Button ref={searchToggle} variant="ghost" aria-label="Abrir busca do mercado" aria-expanded={searchOpen} aria-controls="header-market-search" onClick={() => { if (!searchOpen) setTerm(currentSearch); setSearchOpen(value => !value) }}><Search aria-hidden="true" /></Button>
        <Link to="/carrinho" aria-label={quantity === undefined ? 'Carrinho' : `Carrinho, ${quantity} itens`} className="desktop-cart"><ShoppingCart aria-hidden="true" />{quantity !== undefined && <span aria-hidden="true">{quantity}</span>}</Link>
        {session.data ? <><details className="desktop-account"><summary><UserRound aria-hidden="true" /><span role="status" aria-label="Usuário conectado">{session.data.user.name}</span></summary>
          <div><Link to="/perfil">Perfil</Link><Link to="/carteiras">Carteiras</Link><Link to="/favoritos">Favoritos</Link><Link to="/pedido/confirmacao">Pedidos</Link></div>
        </details><AuthActions showName={false} /></> : <Link to="/login" className={buttonVariants({ className: 'desktop-login' })}><LogIn aria-hidden="true" />Entrar</Link>}
      </div>
      {searchOpen && <form id="header-market-search" className="desktop-header-search" onSubmit={event => {
        event.preventDefault(); void navigate({ to: '/', search: previous => ({ ...previous, search: term, page: 1 }), hash: 'catalogo' }); setSearchOpen(false)
      }}>
        <label htmlFor="header-search">Buscar no mercado</label><Input ref={searchInput} id="header-search" type="search" value={term} maxLength={120} onChange={event => setTerm(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setSearchOpen(false); searchToggle.current?.focus() } }} /><Button type="submit">Buscar</Button>
      </form>}
    </div>
  </header>
}
