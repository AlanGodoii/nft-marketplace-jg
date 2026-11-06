import { HomeFooter } from './home-footer'
import { useDesktop } from '@/lib/use-desktop'
import { Link, useRouterState } from '@tanstack/react-router'

export function Footer() {
  const desktop = useDesktop()
  const isHome = useRouterState({ select: state => state.location.pathname === '/' })
  if (desktop && isHome) return <HomeFooter />
  return (
    <>
    <footer className="legacy-footer border-t">
      <div className="kurio-container flex flex-wrap items-center justify-between gap-6 py-8">
        <Link to="/" className="text-xl font-bold" aria-label="Kurio — início">kurio.</Link>
        <p className="text-xs text-muted-foreground">Kurio · NFT Marketplace</p>
      </div>
    </footer>
    </>
  )
}
