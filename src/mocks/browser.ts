import { orderHandlers } from './handlers/orders'
import { scheduleOrders } from './order-domain'
import { checkoutHandlers } from './handlers/checkout'
import { walletHandlers } from './handlers/wallets'
import { http, HttpResponse } from 'msw'
import { authHandlers } from './handlers/auth'
import { favoriteHandlers } from './handlers/favorites'
import { cartHandlers } from './handlers/cart'
import { setupWorker } from 'msw/browser'
import { nftHandlers } from './handlers/nfts'
import { scenarioHandlers } from './handlers/scenarios'
import { initializeScenario } from './scenarios'

export const worker = setupWorker(...nftHandlers, ...scenarioHandlers, ...authHandlers, ...favoriteHandlers, ...cartHandlers, ...walletHandlers, ...checkoutHandlers, ...orderHandlers, http.all('/api/*', () => HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Endpoint não implementado na simulação.' } }, { status: 404 })))
export async function startMocks() {
  initializeScenario()
  scheduleOrders()
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
  })
}
