import { z } from 'zod'
import { nftSchema } from './nft'
import { orderSchema } from './order'
const base = { eventId: z.string().min(1), resourceId: z.string().min(1), version: z.number().int().positive() }
export const marketEventSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('nft.updated'), payload: nftSchema }),
  z.object({ ...base, type: z.literal('order.updated'), userId: z.string(), sessionId: z.string(), payload: orderSchema }),
]).refine(event => event.resourceId === event.payload.id && event.version === event.payload.version && (event.type !== 'order.updated' || event.userId === event.payload.userId), 'Identidade/versão do evento incoerente.')
export const sessionReadySchema = z.object({ userId: z.string().nullable(), sessionId: z.string().nullable() })
export type MarketEvent = z.infer<typeof marketEventSchema>
export type NftUpdated = Extract<MarketEvent, { type: 'nft.updated' }>
export type OrderUpdated = Extract<MarketEvent, { type: 'order.updated' }>
export interface ServerEvents {
  'session.ready': (session: z.infer<typeof sessionReadySchema>) => void
  'nft.updated': (event: NftUpdated) => void
  'order.updated': (event: OrderUpdated) => void
}
export interface ClientEvents { 'event.ack': (ack: { eventId: string; status: 'accepted' | 'ignored' }) => void }
