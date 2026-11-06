import { useSyncExternalStore } from 'react'
import type { Nft } from '@/contracts/nft'
export interface RealtimeState {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  syncing: boolean
  nftVersions: Record<string, number>
  lastNft: Nft | null
  transport: string | null
}
let state: RealtimeState = { status: 'connecting', syncing: false, nftVersions: {}, lastNft: null, transport: null }
const listeners = new Set<() => void>()
export function realtimeSnapshot() { return state }
export function updateRealtime(patch: Partial<RealtimeState>) { state = { ...state, ...patch }; for (const listener of listeners) listener() }
export function useRealtime() { return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener) } }, realtimeSnapshot, realtimeSnapshot) }
let retry = () => {}
export function setRealtimeRetry(action: () => void) { retry = action; return () => { if (retry === action) retry = () => {} } }
export function retryRealtime() { retry() }
