import { z } from 'zod'
import { collectorSchema, walletNetworkSchema, type Wallet } from '@/contracts/wallet'
const draftSchema = z.object({
  walletVersion: z.number().int(), collector: collectorSchema, network: walletNetworkSchema,
  quantities: z.record(z.string(), z.number().int().positive().max(1000)), excluded: z.array(z.string()),
})
export type CheckoutDraft = z.infer<typeof draftSchema>
const key = (userId: string, walletId: string) => `kurio.checkout.draft:${userId}:${walletId}`
export function readCheckoutDraft(userId: string, wallet: Wallet): CheckoutDraft | null {
  try {
    const saved = sessionStorage.getItem(key(userId, wallet.id)); if (!saved) return null
    const value = draftSchema.parse(JSON.parse(saved))
    return value.walletVersion === wallet.version ? value : null
  } catch { return null }
}
export function saveCheckoutDraft(userId: string, walletId: string, draft: CheckoutDraft) {
  const parsed = draftSchema.safeParse(draft)
  if (!parsed.success) return
  try { sessionStorage.setItem(key(userId, walletId), JSON.stringify(parsed.data)) } catch { /* Form still works without persistent storage. */ }
}
