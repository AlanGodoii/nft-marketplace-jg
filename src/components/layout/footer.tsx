import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t">
      <div className="kurio-container flex flex-wrap items-center justify-between gap-6 py-8">
        <Link to="/" className="text-xl font-bold" aria-label="Kurio — início">kurio.</Link>
        <p className="text-xs text-muted-foreground">Kurio · NFT Marketplace</p>
      </div>
    </footer>
  )
}
