import { z } from 'zod'
import { cartItemSchema, quoteSchema } from './cart'
import { collectorSchema, walletNetworkSchema, walletSchema } from './wallet'
export const checkoutInputSchema = z.object({
  walletId: z.string().min(1), network: walletNetworkSchema, collector: collectorSchema,
  items: z.array(z.object({ itemId: z.string().min(1), quantity: z.number().int('Use uma quantidade inteira.').positive('Use pelo menos 1 unidade.').max(1000, 'Use no máximo 1000 unidades.') }).strict()).min(1, 'Selecione pelo menos um item.'),
}).strict()
export const checkoutQuoteSchema = quoteSchema.extend({
  id: z.string(), fingerprint: z.string(), network: walletNetworkSchema,
  items: z.array(cartItemSchema), wallet: walletSchema, collector: collectorSchema,
})
export type CheckoutInput = z.infer<typeof checkoutInputSchema>
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>
