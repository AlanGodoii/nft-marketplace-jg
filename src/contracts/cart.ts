import { z } from 'zod'
import { editionSchema, ethSchema, nftSchema } from './nft'

export const cartItemInputSchema = z.object({
  nftId: z.string().min(1), editionId: z.string().min(1),
  quantity: z.number().int('A quantidade deve ser inteira.').min(1, 'Use pelo menos 1 unidade.').max(1000),
}).strict()
export const quantitySchema = cartItemInputSchema.pick({ quantity: true })
export const couponSchema = z.object({ code: z.string().trim().min(1, 'Informe o cupom.').max(40) }).strict()
export const cartItemSchema = z.object({
  id: z.string(), nftId: z.string(), editionId: z.string(), quantity: z.number().int().positive(),
  nft: nftSchema, edition: editionSchema, lineTotal: ethSchema, available: z.boolean(),
})
export const cartSchema = z.object({
  version: z.number().int().nonnegative(), items: z.array(cartItemSchema),
  couponCode: z.string().nullable(), notices: z.array(z.string()),
})
export const quoteSchema = z.object({
  reference: z.string(), cartVersion: z.number().int().nonnegative(), expiresAt: z.iso.datetime(),
  currency: z.literal('ETH'), subtotal: ethSchema, discount: ethSchema, networkFee: ethSchema, total: ethSchema,
  couponCode: z.string().nullable(),
})
export const favoritesSchema = z.object({ items: z.array(nftSchema) })
export type Cart = z.infer<typeof cartSchema>
export type CartItemInput = z.infer<typeof cartItemInputSchema>
export type Quote = z.infer<typeof quoteSchema>
export type Favorites = z.infer<typeof favoritesSchema>
