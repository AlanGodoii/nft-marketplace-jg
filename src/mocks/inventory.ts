import type { Nft } from '@/contracts/nft'
import { commerceSnapshot } from './commerce-db'
// Confirmed receipts are the inventory ledger. Cart cleanup and sale become one
// persisted transaction; reload cannot apply one side twice after a crash.
export function inventoryLedger(nftId: string) {
  const sold: Record<string, number> = {}; let version = 0
  for (const order of Object.values(commerceSnapshot().orders)) {
    if (order.status !== 'confirmed') continue
    const items = order.snapshot.items.filter(item => item.nftId === nftId)
    if (items.length) version += 1
    for (const item of items) sold[item.editionId] = (sold[item.editionId] ?? 0) + item.quantity
  }
  return { sold, version }
}
export function inventoryView(nft: Nft): Nft {
  const ledger = inventoryLedger(nft.id); const view = structuredClone(nft)
  view.version += ledger.version
  for (const edition of view.editions) {
    edition.availability.remaining = Math.max(0, edition.availability.remaining - (ledger.sold[edition.id] ?? 0))
    edition.availability.status = edition.availability.remaining ? 'available' : 'sold-out'
  }
  view.availability = { ...view.editions[0].availability }
  return view
}
export function inventoryBase(nft: Nft): Nft {
  const ledger = inventoryLedger(nft.id); const base = structuredClone(nft)
  base.version -= ledger.version
  for (const edition of base.editions) edition.availability.remaining += ledger.sold[edition.id] ?? 0
  base.availability = { ...base.editions[0].availability }
  return base
}
