import { z } from 'zod'
import { userSchema } from '@/contracts/auth'
import { seededAccounts } from './users'
import { walletSchema, connectionSchema } from '@/contracts/wallet'
import { seedWallets } from './wallet-seeds'

const storedCartSchema = z.object({
  version: z.number().int().nonnegative(), couponCode: z.string().nullable(), notices: z.array(z.string()),
  items: z.array(z.object({ id: z.string(), nftId: z.string(), editionId: z.string(), quantity: z.number().int().positive() })),
})
const stateSchema = z.object({
  version: z.literal(1),
  retiredGuests: z.array(z.string()).default([]),
  accounts: z.array(userSchema.extend({ salt: z.string(), passwordHash: z.string() })),
  sessions: z.array(z.object({ tokenHash: z.string(), userId: z.string(), expiresAt: z.number() })),
  wallets: z.record(z.string(), z.array(walletSchema)).default(seedWallets),
  connections: z.record(z.string(), connectionSchema.extend({ walletVersion: z.number().int() })).default({}),
  favorites: z.record(z.string(), z.array(z.string())), carts: z.record(z.string(), storedCartSchema),
})
export type CommerceState = z.infer<typeof stateSchema>
export type StoredCart = z.infer<typeof storedCartSchema>
export const commerceStorageKey = 'kurio.mock.commerce.v1'
const seed = (): CommerceState => ({ version: 1, retiredGuests: [], accounts: structuredClone(seededAccounts), sessions: [], favorites: {}, carts: {}, wallets: seedWallets(), connections: {} })
let memory = seed()
function read(): CommerceState {
  try {
    const value = localStorage.getItem(commerceStorageKey)
    return value ? stateSchema.parse(JSON.parse(value)) : structuredClone(memory)
  } catch { return structuredClone(memory) }
}
export function commerceSnapshot() { return structuredClone(read()) }
// Synchronous transactions reload shared storage before writes, including across tabs.
export function transact<T>(change: (state: CommerceState) => T): T {
  const state = read()
  const result = change(state)
  memory = stateSchema.parse(state)
  try { localStorage.setItem(commerceStorageKey, JSON.stringify(memory)) } catch { /* In-memory persistence fallback. */ }
  return structuredClone(result)
}
export function resetCommerce() {
  memory = seed()
  try { localStorage.setItem(commerceStorageKey, JSON.stringify(memory)) } catch { /* In-memory fallback. */ }
}
export function storedCart(state: CommerceState, owner: string): StoredCart {
  return state.carts[owner] ??= { version: 0, couponCode: null, notices: [], items: [] }
}
