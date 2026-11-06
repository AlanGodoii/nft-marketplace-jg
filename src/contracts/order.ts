import { z } from 'zod'
import { checkoutQuoteSchema } from './checkout'
export const orderInputSchema = z.object({ quoteId: z.string().min(1), connectionId: z.string().min(1) }).strict()
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export const orderSchema = z.object({
  id: z.string(), userId: z.string(), version: z.number().int().positive(), status: orderStatusSchema,
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  snapshot: checkoutQuoteSchema, transactionReference: z.string().nullable(), reason: z.string().nullable(),
})
export const ordersSchema = z.object({ items: z.array(orderSchema) })
export const attemptSchema = z.object({ key: z.string().min(8).max(128), input: orderInputSchema, orderId: z.string().optional() })
export type Order = z.infer<typeof orderSchema>
export type OrderInput = z.infer<typeof orderInputSchema>
export type PurchaseAttempt = z.infer<typeof attemptSchema>
