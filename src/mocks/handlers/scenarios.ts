import { http, HttpResponse } from 'msw'
import { getMockDatabase } from '../db'
import { configureScenario, scenarioSchema, scenarioSnapshot } from '../scenarios'

export const scenarioHandlers = [
  http.post('/api/__mock/reset', async ({ request }) => {
    let body: unknown
    try { body = await request.json() } catch { return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Informe um JSON válido.' } }, { status: 400 }) }
    const parsed = scenarioSchema.safeParse(body)
    if (!parsed.success) return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Cenário inválido.' } }, { status: 400 })
    getMockDatabase().reset()
    return HttpResponse.json({ config: configureScenario(parsed.data) })
  }),
  http.get('/api/__mock/scenario', () => HttpResponse.json(scenarioSnapshot())),
]
