import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, House, Heart, ShoppingCart, UserRound, Wallet, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/api'
import { AuthActions } from '@/features/auth/auth-actions'
export function MobileNavigation() {
  const path = useRouterState({ select: state => state.location.pathname })
  const session = useSession(); const [open, setOpen] = useState(false)
  if (path === '/login' || path === '/cadastro') return null
  const home = path === '/'
  const bottom = home || ['/perfil', '/carteiras', '/favoritos', '/pedido/confirmacao'].includes(path)
  const labels: Record<string,string> = { '/carrinho': 'Carrinho de NFTs', '/checkout': 'Pagamento com carteira', '/perfil': 'Meu perfil', '/carteiras': 'Carteiras', '/favoritos': 'Favoritos', '/pedido/confirmacao': 'Meus pedidos' }
  const toggle = <Button variant="ghost" className="mobile-menu-toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-controls="main-navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : bottom ? <UserRound aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button>
  return <>
    {session.data && <span role="status" className="sr-only" aria-label="Usuário conectado">{session.data.user.name}</span>}
    {!home && <header className="mobile-page-bar"><Link to={path === '/checkout' ? '/carrinho' : '/'} aria-label="Voltar"><ArrowLeft aria-hidden="true" /></Link><span>{labels[path] ?? 'Detalhes do NFT'}</span>{!bottom && toggle}</header>}
    {bottom && <nav className="mobile-bottom-nav" aria-label="Menu inferior"><Link to="/" aria-label="Início" activeOptions={{ exact: true }} activeProps={{ className: 'is-active' }}><House aria-hidden="true" /></Link><Link to="/favoritos" aria-label="Favoritos"><Heart aria-hidden="true" /></Link><Link to="/carteiras" aria-label="Carteiras" className="mobile-floating-wallet"><Wallet aria-hidden="true" /></Link><Link to="/carrinho" aria-label="Carrinho"><ShoppingCart aria-hidden="true" /></Link>{toggle}</nav>}
    {open && <nav className={`mobile-account-panel ${bottom ? 'at-bottom' : ''}`} id="main-navigation" aria-label="Navegação principal">
      {([['/perfil','Perfil'],['/carteiras','Carteiras'],['/favoritos','Favoritos'],['/pedido/confirmacao','Pedidos'],['/login','Entrar'],['/cadastro','Cadastrar']] as const).map(([to,label]) => <Link key={to} to={to} onClick={() => setOpen(false)}>{label}</Link>)}<AuthActions showName={false} />
    </nav>}
  </>
}
