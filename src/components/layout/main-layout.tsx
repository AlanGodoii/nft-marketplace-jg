import { Outlet } from '@tanstack/react-router'
import { Header } from './header'
import { Footer } from './footer'

export function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:p-4">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
