import { publishOrder } from '../socket-server'
import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { orderInputSchema } from '@/contracts/order'
import { commerceSnapshot } from '../commerce-db'
import { createOrder, publicOrder, scheduleOrders, settleDueOrders, settleOrder, withOrderLock } from '../order-domain'
import { orderScenario } from '../scenarios'
import { apiFailure, identity, operation, parseBody, unauthorized } from './shared'
export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const failed = await operation(request, 'orders.create'); if (failed) return failed
    const current = await identity(request); if (!current?.user || !current.tokenHash) return unauthorized()
    const parsed = await parseBody(request, orderInputSchema); if (parsed.error) return parsed.error
    const key = request.headers.get('Idempotency-Key')
    if (!key || !/^[a-zA-Z0-9:_-]{8,128}$/.test(key)) return apiFailure(400, 'VALIDATION_ERROR', 'Informe uma chave de idempotência estável.', { idempotencyKey: ['Chave inválida.'] })
    const result = await withOrderLock(() => createOrder(current.user!.id, current.tokenHash!, key, parsed.data!))
    if (!result.order) return apiFailure(result.status!, result.status === 404 ? 'NOT_FOUND' : 'CONFLICT', result.error!, { [result.field!]: [result.field === 'attempt' ? 'not-created' : result.error!] })
    if (!result.replay) await publishOrder(result.order)
    scheduleOrders()
    // A slow response is independent from the committed order; cancellation or
    // timeout here must never undo or duplicate the already persisted attempt.
    if (!result.replay) await delay(orderScenario().responseDelay)
    return HttpResponse.json(publicOrder(commerceSnapshot().orders[result.order.id]), { status: result.replay ? 200 : 201 })
  }),
  http.get('/api/orders', async ({ request }) => {
    const failed = await operation(request, 'orders.list'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    await settleDueOrders()
    return HttpResponse.json({ items: Object.values(commerceSnapshot().orders).filter(order => order.userId === current.user!.id).map(publicOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })
  }),
  http.get('/api/orders/:orderId', async ({ request, params }) => {
    const failed = await operation(request, 'orders.read'); if (failed) return failed
    const current = await identity(request); if (!current?.user) return unauthorized()
    await settleDueOrders()
    const order = commerceSnapshot().orders[String(params.orderId)]
    return order?.userId === current.user.id ? HttpResponse.json(publicOrder(order)) : apiFailure(404, 'NOT_FOUND', 'Pedido não encontrado nesta conta.')
  }),
  http.post('/api/__mock/orders/:orderId/settle', async ({ request, params }) => {
    const current = await identity(request); if (!current?.user) return unauthorized()
    const parsed = await parseBody(request, z.object({ status: z.enum(['confirmed', 'rejected']) }).strict()); if (parsed.error) return parsed.error
    const previous = commerceSnapshot().orders[String(params.orderId)]
    if (!previous || previous.userId !== current.user.id) return apiFailure(404, 'NOT_FOUND', 'Pedido não encontrado nesta conta.')
    if (previous.status !== 'pending' && previous.status !== parsed.data!.status) return apiFailure(409, 'CONFLICT', 'Um pedido terminal não pode mudar de estado.')
    return HttpResponse.json((await settleOrder(previous.id, parsed.data!.status))!.order)
  }),
]
