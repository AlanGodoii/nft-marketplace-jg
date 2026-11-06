import { HomeFooter } from './home-footer'
import { useDesktop } from '@/lib/use-desktop'
export function Footer() { const desktop = useDesktop(); return desktop ? <HomeFooter /> : null }
