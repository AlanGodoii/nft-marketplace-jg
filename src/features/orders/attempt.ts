import { useState } from 'react'
import { attemptSchema, type PurchaseAttempt } from '@/contracts/order'
import { useSession } from '@/features/auth/api'
const memory = new Map<string, PurchaseAttempt | null>()
const key = (userId: string) => `kurio.checkout.attempt:${userId}`
function read(userId: string) {
  try { const value = sessionStorage.getItem(key(userId)); return value ? attemptSchema.parse(JSON.parse(value)) : null }
  catch { return memory.get(userId) ?? null }
}
export function usePurchaseAttempt() {
  const session = useSession(); const userId = session.data?.user.id ?? ''
  const [stored, setStored] = useState(() => ({ userId, attempt: read(userId) }))
  const attempt = stored.userId === userId ? stored.attempt : read(userId)
  return { attempt, saveAttempt: (attempt: PurchaseAttempt | null) => {
    memory.set(userId, attempt)
    try { if (attempt) sessionStorage.setItem(key(userId), JSON.stringify(attempt)); else sessionStorage.removeItem(key(userId)) } catch { /* Scoped memory fallback; no refresh guarantee without storage. */ }
    setStored({ userId, attempt })
  } }
}
