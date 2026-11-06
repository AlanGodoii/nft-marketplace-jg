import { ws } from 'msw'
import type { Nft } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { MarketEvent, NftUpdated } from '@/contracts/event'
import { identity } from './handlers/shared'
// MSW3 raw WebSocket transport; Engine.IO4 + Socket.IO5 default namespace.
// The application uses the unmodified socket.io-client parser/manager/transport.
const link = ws.link(/^wss?:\/\/[^/]+\/kurio-live\/$/)
type Peer = { id: string; token?: string; userId: string | null; sessionId: string | null; ready: boolean; closed: boolean; send: (data: string) => void; close: () => void }
const peers = new Map<string, Peer>()
let paused = false
let engineOpens = 0; let namespaceConnects = 0; let pongs = 0; let eventsSent = 0
let clientFrames: Record<string, number> = {}
const receipts: { eventId: string; status: 'accepted' | 'ignored'; userId: string | null }[] = []
async function authenticated(token?: string) {
  return token ? identity(new Request(`${location.origin}/api/auth/session`, { headers: { Authorization: `Bearer ${token}` } })) : null
}
function frame(peer: Peer, name: string, payload: unknown) { if (!peer.closed && peer.ready) { eventsSent += 1; peer.send(`42${JSON.stringify([name, payload])}`) } }
export const socketHandlers = [link.addEventListener('connection', ({ client }) => {
  const id = crypto.randomUUID()
  const peer: Peer = { id, userId: null, sessionId: null, ready: false, closed: false, send: data => client.send(data), close: () => client.close(4001, 'Simulação: transporte interrompido') }
  peers.set(id, peer)
  let heartbeat: ReturnType<typeof setInterval> | undefined
  const cleanup = () => { peer.closed = true; peer.ready = false; if (heartbeat) clearInterval(heartbeat); peers.delete(id) }
  client.addEventListener('close', cleanup)
  if (paused) { peer.close(); return }
  engineOpens += 1
  client.send(`0${JSON.stringify({ sid: id, upgrades: [], pingInterval: 10000, pingTimeout: 20000, maxPayload: 1000000 })}`)
  let lastPong = Date.now()
  heartbeat = setInterval(() => { if (Date.now() - lastPong > 45000) peer.close(); else if (!peer.closed) peer.send('2') }, 10000)
  client.addEventListener('message', async event => {
    event.preventDefault()
    const data = event.data
    if (typeof data !== 'string') { peer.close(); return }
    clientFrames[data.slice(0, 2)] = (clientFrames[data.slice(0, 2)] ?? 0) + 1
    if (data === '3') { lastPong = Date.now(); pongs += 1; return }
    if (data === '1' || data === '41') { peer.close(); return }
    if (data.startsWith('40')) {
      try {
        const auth: unknown = data.length > 2 ? JSON.parse(data.slice(2)) : {}
        const token = auth && typeof auth === 'object' && 'token' in auth && typeof auth.token === 'string' ? auth.token : undefined
        const current = await authenticated(token)
        if (peer.closed) return
        if (token && !current?.user) { client.send(`44${JSON.stringify({ message: 'Sessão inválida ou expirada.' })}`); return }
        peer.token = token; peer.userId = current?.user?.id ?? null; peer.sessionId = current?.tokenHash ?? null; peer.ready = true
        namespaceConnects += 1
        client.send(`40${JSON.stringify({ sid: id })}`)
        frame(peer, 'session.ready', { userId: peer.userId, sessionId: peer.sessionId })
      } catch { peer.close() }
      return
    }
    if (data.startsWith('42') && peer.ready) {
      try {
        const packet: unknown = JSON.parse(data.slice(2))
        if (Array.isArray(packet) && packet[0] === 'event.ack' && packet[1] && typeof packet[1].eventId === 'string' && ['accepted', 'ignored'].includes(packet[1].status)) {
          receipts.push({ eventId: packet[1].eventId, status: packet[1].status, userId: peer.userId })
          if (receipts.length > 500) receipts.shift()
        }
      } catch { peer.close() }
    }
  })
})]
export function publishNft(nft: Nft): NftUpdated {
  const event: NftUpdated = { type: 'nft.updated', eventId: `nft:${nft.id}:${nft.version}`, resourceId: nft.id, version: nft.version, payload: structuredClone(nft) }
  for (const peer of peers.values()) frame(peer, event.type, event)
  return event
}
export async function publishOrder(order: Order) {
  for (const peer of peers.values()) {
    if (peer.closed || !peer.ready || peer.userId !== order.userId) continue
    const current = await authenticated(peer.token)
    if (peer.closed) continue
    if (!current?.user || current.tokenHash !== peer.sessionId) { peer.close(); continue }
    const event: MarketEvent = { type: 'order.updated', eventId: `order:${order.id}:${order.version}:${peer.sessionId!.slice(0, 12)}`, resourceId: order.id, version: order.version, userId: order.userId, sessionId: peer.sessionId!, payload: structuredClone(order) }
    frame(peer, event.type, event)
  }
}
export async function injectEvent(event: MarketEvent, all = false) {
  for (const peer of peers.values()) {
    if (event.type === 'order.updated' && !all) {
      const current = await authenticated(peer.token)
      if (!current?.user || current.user.id !== event.userId || current.tokenHash !== event.sessionId) continue
    }
    frame(peer, event.type, event)
  }
}
export function pauseSocket() { paused = true; for (const peer of peers.values()) peer.close() }
export function resumeSocket() { paused = false }
export function resetSocketDiagnostics() { paused = false; engineOpens = 0; namespaceConnects = 0; pongs = 0; eventsSent = 0; clientFrames = {}; receipts.length = 0 }
export function socketDiagnostics(userId: string | null, sessionId: string | null) {
  return { protocol: 'Engine.IO4 / Socket.IO5 / WebSocket', paused, engineOpens, namespaceConnects, pongs, eventsSent, clientFrames: { ...clientFrames }, active: [...peers.values()].filter(peer => peer.ready && !peer.closed).length, sessionId, receipts: receipts.filter(receipt => receipt.userId === userId).map(({ eventId, status }) => ({ eventId, status })) }
}
