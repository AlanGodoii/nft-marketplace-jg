import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  // Engine.IO captures the WebSocket constructor at module evaluation time.
  // Load the application only after MSW has installed its network interceptors.
  const { default: App } = await import('./App.tsx')
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
}

void bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicação:', error)
  // Startup failures must never silently fall back to fake UI data or a real API.
  const root = document.getElementById('root')!
  const alert = document.createElement('p')
  alert.setAttribute('role', 'alert')
  alert.textContent = 'Não foi possível iniciar a aplicação. Verifique a configuração dos mocks e recarregue a página.'
  root.replaceChildren(alert)
})
