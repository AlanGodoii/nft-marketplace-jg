import { MobileNavigation } from './mobile-navigation'
import { useDesktop } from '@/lib/use-desktop'
import { DesktopHomeHeader } from './desktop-home-header'

export function Header() {
  const desktop = useDesktop()
  if (desktop) return <DesktopHomeHeader />
  return <MobileNavigation />
}
