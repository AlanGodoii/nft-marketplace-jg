import { Outlet, useRouterState } from '@tanstack/react-router'
import { RealtimeBoundary } from '@/features/realtime/realtime-boundary'
import { SessionBoundary } from '@/features/auth/session-boundary'
import { Header } from './header'
import { Footer } from './footer'

export function MainLayout() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const isHome = pathname === '/'
  const page = pathname.startsWith('/nfts/') ? 'detail' : ({ '/': 'home', '/carrinho': 'cart', '/checkout': 'checkout', '/perfil': 'profile', '/carteiras': 'wallets', '/favoritos': 'favorites', '/pedido/confirmacao': 'orders', '/login': 'auth', '/cadastro': 'auth' } as Record<string, string>)[pathname] ?? 'other'
  return (
    <div className={`flex min-h-dvh flex-col kurio-theme figma-app page-${page} ${isHome ? 'home-desktop' : ''}`}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:p-4">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" className={isHome ? 'kurio-container flex-1 pt-10' : 'kurio-container flex-1 py-12'}>
        <SessionBoundary />
        <RealtimeBoundary />
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
