import { inventoryView, inventoryBase } from './inventory'
import { z } from 'zod'
import { nftSchema, type Nft } from '@/contracts/nft'
import { createNftFixtures } from './fixtures'

const storageKey = 'kurio.mock.database.v2'
const stateSchema = z.object({ version: z.literal(2), nfts: z.array(nftSchema) })
export type MockState = z.infer<typeof stateSchema>

// One state owner for REST today and future cart/checkout handlers. No UI imports.
export function createMockDatabase(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const seed = (): MockState => ({ version: 2, nfts: createNftFixtures() })
  let state = seed()
  try {
    const persisted = storage?.getItem(storageKey)
    if (persisted) state = stateSchema.parse(JSON.parse(persisted))
  } catch { state = seed() }
  const save = () => {
    try { storage?.setItem(storageKey, JSON.stringify(state)) } catch { /* Storage unavailable: keep session state in memory. */ }
  }
  return {
    snapshot: () => ({ ...structuredClone(state), nfts: state.nfts.map(inventoryView) }),
    reset: () => { state = seed(); save() },
    updateNft: (id: string, update: (current: Nft) => Nft) => {
      const index = state.nfts.findIndex(nft => nft.id === id)
      if (index < 0) return undefined
      const next = nftSchema.parse(update(inventoryView(state.nfts[index])))
      if (next.id !== id || next.version <= inventoryView(state.nfts[index]).version) throw new Error('NFT update requires stable ID and a newer version')
      state.nfts[index] = inventoryBase(next)
      save()
      return structuredClone(next)
    },
  }
}
let database: ReturnType<typeof createMockDatabase> | undefined
export function getMockDatabase() {
  if (!database) {
    let storage: Storage | undefined
    try { storage = globalThis.localStorage } catch { /* In-memory fallback. */ }
    database = createMockDatabase(storage)
  }
  return database
}
