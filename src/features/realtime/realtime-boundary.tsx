import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { marketEventSchema, sessionReadySchema, type MarketEvent, type ServerEvents, type ClientEvents } from '@/contracts/event'
import type { Nft, CatalogPage } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import { useSession, sessionOptions } from '@/features/auth/api'
import { getToken, identityEpoch, registerSessionCleanup } from '@/lib/identity'
import { nftKeys } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import { realtimeSnapshot, retryRealtime, setRealtimeRetry, updateRealtime, useRealtime } from './state'
export function RealtimeBoundary() {
  const session = useSession(); const client = useQueryClient(); const state = useRealtime()
  const token = getToken(); const userId = session.data?.user.id ?? null; const ready = session.isSuccess
  useEffect(() => {
    if (!ready) return
    const lifetime = new AbortController(); let connectedBefore = false; let sessionId: string | null = null
    const epoch = identityEpoch(); const seen = new Set<string>(); const versions = new Map<string, number>()
    const socket: Socket<ServerEvents, ClientEvents> = io(location.origin, {
      path: '/kurio-live', transports: ['websocket'], autoConnect: false, forceNew: true,
      auth: { token }, reconnection: true, reconnectionDelay: 100, reconnectionDelayMax: 1000, randomizationFactor: 0,
    })
    const current = () => !lifetime.signal.aborted && epoch === identityEpoch() && token === getToken()
    async function reconcile() {
      if (!current()) return
      updateRealtime({ syncing: true })
      try {
        const valid = await client.fetchQuery({ ...sessionOptions, staleTime: 0 })
        if (!current() || (valid?.user.id ?? null) !== userId) return
        await client.cancelQueries({ predicate: query => query.queryKey[0] === 'nfts' || query.queryKey[0] === 'cart' || (query.queryKey[0] === 'private' && query.queryKey[1] === userId) })
        if (!current()) return
        await client.invalidateQueries({ predicate: query => query.queryKey[0] === 'nfts' || query.queryKey[0] === 'cart' || (query.queryKey[0] === 'private' && query.queryKey[1] === userId) })
        if (current()) updateRealtime({ syncing: false })
      } catch { if (current()) updateRealtime({ status: 'error', syncing: false }) }
    }
    function cachedVersion(event: MarketEvent) {
      if (event.type === 'order.updated') {
        const previous = client.getQueryData<Order>(['private', userId, 'orders', event.resourceId])
        if (previous && previous.status !== 'pending' && event.payload.status !== previous.status) return Infinity
        return previous?.version ?? 0
      }
      let version = client.getQueryData<Nft>(nftKeys.detail(event.resourceId))?.version ?? 0
      for (const [, page] of client.getQueriesData<CatalogPage>({ queryKey: nftKeys.lists() })) version = Math.max(version, page?.items.find(item => item.id === event.resourceId)?.version ?? 0)
      return version
    }
    async function receive(raw: unknown) {
      if (!current()) return
      const parsed = marketEventSchema.safeParse(raw); if (!parsed.success) return
      const event = parsed.data
      const resource = `${event.type}:${event.resourceId}`
      const permitted = event.type !== 'order.updated' || (!!userId && event.userId === userId && event.sessionId === sessionId)
      if (!permitted || seen.has(event.eventId) || event.version <= (versions.get(resource) ?? 0) || event.version < cachedVersion(event)) {
        socket.emit('event.ack', { eventId: event.eventId, status: 'ignored' }); return
      }
      seen.add(event.eventId); versions.set(resource, event.version)
      if (seen.size > 500) seen.delete(seen.values().next().value!)
      socket.emit('event.ack', { eventId: event.eventId, status: 'accepted' })
      if (event.type === 'nft.updated') {
        const previous = realtimeSnapshot()
        updateRealtime({ nftVersions: { ...previous.nftVersions, [event.resourceId]: event.version }, lastNft: event.payload })
        await client.cancelQueries({ predicate: query => query.queryKey[0] === 'nfts' || query.queryKey[0] === 'cart' || (query.queryKey[0] === 'private' && query.queryKey[1] === userId && query.queryKey[2] === 'favorites') })
        if (!current()) return
        await client.invalidateQueries({ predicate: query => query.queryKey[0] === 'nfts' || query.queryKey[0] === 'cart' || (query.queryKey[0] === 'private' && query.queryKey[1] === userId && query.queryKey[2] === 'favorites') })
      } else {
        await client.cancelQueries({ queryKey: ['private', userId, 'orders'] })
        if (!current()) return
        await client.invalidateQueries({ queryKey: ['private', userId, 'orders'] })
        if (!current()) return
        if (event.payload.status === 'confirmed') await client.invalidateQueries({ queryKey: ['cart', `user:${userId}`] })
      }
    }
    socket.on('session.ready', raw => {
      const result = sessionReadySchema.safeParse(raw)
      if (current() && result.success && result.data.userId === userId) sessionId = result.data.sessionId
    })
    socket.on('nft.updated', event => { void receive(event) })
    socket.on('order.updated', event => { void receive(event) })
    socket.on('connect', () => {
      if (!current()) return
      updateRealtime({ status: 'connected', transport: socket.io.engine.transport.name })
      if (connectedBefore) void reconcile()
      connectedBefore = true
    })
    socket.on('disconnect', () => { if (current()) updateRealtime({ status: 'disconnected', transport: null, syncing: false }) })
    socket.on('connect_error', () => {
      if (!current()) return
      updateRealtime({ status: 'error', transport: null, syncing: false })
      if (token) void client.fetchQuery({ ...sessionOptions, staleTime: 0 }).catch(() => {})
    })
    socket.io.on('reconnect_attempt', () => { if (current()) updateRealtime({ status: 'reconnecting' }) })
    const unregisterRetry = setRealtimeRetry(() => { if (current()) { if (socket.connected) void reconcile(); else socket.connect() } })
    updateRealtime({ status: 'connecting', transport: null })
    socket.connect()
    const stop = () => {
      lifetime.abort(); unregisterRetry(); socket.io.reconnection(false); socket.removeAllListeners(); socket.io.removeAllListeners(); socket.disconnect()
    }
    const unregister = registerSessionCleanup(stop)
    return () => { stop(); unregister() }
  }, [client, ready, token, userId])
  return <div className="realtime-feedback" role="status" aria-label="Conexão em tempo real" data-testid="realtime-status" data-transport={state.transport ?? ''}>
    {state.syncing ? 'Reconectado. Sincronizando dados…' : state.status === 'connected' ? 'Atualizações ao vivo conectadas.' : state.status === 'connecting' ? 'Conectando atualizações ao vivo…' : 'Conexão ao vivo interrompida. Reconectando…'}
    {['error', 'disconnected', 'reconnecting'].includes(state.status) && <Button variant="link" onClick={retryRealtime}>Reconectar atualizações</Button>}
  </div>
}
