import { z } from 'zod'

const faultSchema = z.object({ status: z.number().int().min(400).max(599).optional(), networkError: z.boolean().optional(), latencyMs: z.number().int().min(0).max(30000).optional(), times: z.number().int().positive().optional() })
export const scenarioSchema = z.object({
  name: z.enum(['normal', 'empty', 'server-error', 'transient-error', 'slow', 'out-of-order', 'network-error']).default('normal'),
  faults: z.record(z.string(), faultSchema).optional(),
  orderOutcome: z.enum(['pending', 'confirmed', 'rejected']).optional(),
  orderDelayMs: z.number().int().min(0).max(3600000).optional(),
  orderResponseDelayMs: z.number().int().min(0).max(30000).optional(),
  networkFeeEth: z.string().regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/).optional(),
  expireCoupon: z.boolean().optional(),
  quoteTtlMs: z.number().int().min(100).max(600000).optional(),
  walletConnection: z.enum(['connected', 'refused', 'disconnected']).optional(),
  sessionTtlMs: z.number().int().min(100).max(86400000).optional(),
  latencyMs: z.number().int().min(0).max(30000).optional(),
  delaysBySearch: z.record(z.string(), z.number().int().min(0).max(30000)).optional(),
})
export type Scenario = z.infer<typeof scenarioSchema>
export const scenarioStorageKey = 'kurio.mock.scenario'
export interface MockRequest { id: number; search: string; startedAt: number; completedAt?: number; outcome?: string }
let config: Scenario = { name: 'normal' }
let requests: MockRequest[] = []
let generation = 0
let requestSequence = 0
let operationCounts: Record<string, number> = {}

export function configureScenario(next: Scenario) {
  config = scenarioSchema.parse(next)
  requests = []
  generation += 1
  requestSequence = 0
  operationCounts = {}
  try { sessionStorage.setItem(scenarioStorageKey, JSON.stringify(config)) } catch { /* Session-only fallback. */ }
  return config
}
export function initializeScenario() {
  try {
    const saved = sessionStorage.getItem(scenarioStorageKey)
    configureScenario(scenarioSchema.parse(saved ? JSON.parse(saved) : { name: import.meta.env.VITE_MOCK_SCENARIO ?? 'normal' }))
  } catch { configureScenario({ name: 'normal' }) }
}
export function beginRequest(search: string) {
  const currentGeneration = generation
  const current = structuredClone(config)
  const request: MockRequest = { id: ++requestSequence, search, startedAt: Date.now() }
  requests.push(request)
  // Bounded diagnostics, available only in builds that explicitly enable MSW.
  if (requests.length > 200) requests.shift()
  const delays = current.delaysBySearch ?? (current.name === 'out-of-order' ? { Emerald: 1000, Sage: 100 } : {})
  const latency = delays[search] ?? current.latencyMs ?? (current.name === 'slow' ? 1600 : 150)
  return {
    config: current, latency,
    fail: current.name === 'server-error' || (current.name === 'transient-error' && request.id === 1),
    finish: (outcome: string) => { if (currentGeneration === generation) { request.completedAt = Date.now(); request.outcome = outcome } },
  }
}
export function scenarioSnapshot() { return { config: structuredClone(config), requests: structuredClone(requests) } }

export function beginOperation(name: string) {
  const count = operationCounts[name] = (operationCounts[name] ?? 0) + 1
  const fault = config.faults?.[name]
  const active = fault && (!fault.times || count <= fault.times)
  return { latency: fault?.latencyMs ?? config.latencyMs ?? 100, status: active ? fault.status : undefined, networkError: active ? fault.networkError : false }
}
export function sessionTtl() { return config.sessionTtlMs ?? 1800000 }

export function walletConnectionOutcome() { return config.walletConnection ?? 'connected' }

export function quoteTtl() { return config.quoteTtlMs ?? 60000 }

export function networkFee() { return config.networkFeeEth ?? '0.016' }
export function couponExpired() { return config.expireCoupon ?? false }

export function orderScenario() { return { outcome: config.orderOutcome ?? 'confirmed', delay: config.orderDelayMs ?? 1500, responseDelay: config.orderResponseDelayMs ?? 0 } }
