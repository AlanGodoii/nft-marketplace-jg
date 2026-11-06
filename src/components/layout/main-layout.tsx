import { Outlet, useRouterState } from '@tanstack/react-router'
import { RealtimeBoundary } from '@/features/realtime/realtime-boundary'
import { SessionBoundary } from '@/features/auth/session-boundary'
import { Header } from './header'
import { Footer } from './footer'

export function MainLayout() {
  const isHome = useRouterState({ select: state => state.location.pathname === '/' })
  return (
    <div className={`flex min-h-dvh flex-col kurio-theme`}>
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
