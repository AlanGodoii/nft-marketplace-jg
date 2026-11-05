import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { nftHandlers } from './handlers/nfts'
import { scenarioHandlers } from './handlers/scenarios'
import { initializeScenario } from './scenarios'

export const worker = setupWorker(...nftHandlers, ...scenarioHandlers, http.all('/api/*', () => HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Endpoint não implementado na simulação.' } }, { status: 404 })))
export async function startMocks() {
  initializeScenario()
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
  })
}
