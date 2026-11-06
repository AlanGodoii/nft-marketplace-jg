import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { marketEventSchema } from '@/contracts/event'
import { injectEvent, pauseSocket, resumeSocket, socketDiagnostics } from '../socket-server'
import { identity, parseBody } from './shared'
export const socketControlHandlers = [
  http.get('/api/__mock/socket/stats', async ({ request }) => {
    const current = await identity(request)
    return HttpResponse.json(socketDiagnostics(current?.user?.id ?? null, current?.tokenHash ?? null))
  }),
  http.post('/api/__mock/socket', async ({ request }) => {
    const parsed = await parseBody(request, z.object({ action: z.enum(['disconnect', 'resume']) }).strict()); if (parsed.error) return parsed.error
    if (parsed.data!.action === 'disconnect') pauseSocket(); else resumeSocket()
    return HttpResponse.json({ paused: parsed.data!.action === 'disconnect' })
  }),
  http.post('/api/__mock/socket/event', async ({ request }) => {
    const parsed = await parseBody(request, z.object({ event: marketEventSchema, audience: z.enum(['owner', 'all']).default('owner') }).strict()); if (parsed.error) return parsed.error
    await injectEvent(parsed.data!.event, parsed.data!.audience === 'all')
    return HttpResponse.json({ eventId: parsed.data!.event.eventId })
  }),
]
