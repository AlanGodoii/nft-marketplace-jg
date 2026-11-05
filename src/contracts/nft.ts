import { z } from 'zod'

// Strings on the wire: never coerce ETH through binary floating point.
export const ethSchema = z.string().regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Informe um valor ETH positivo com até 18 casas decimais.')
export const networkSchema = z.object({ id: z.string(), name: z.string() })
export const collectionSchema = z.object({ id: z.string(), name: z.string() })
export const availabilitySchema = z.object({
  status: z.enum(['available', 'sold-out']),
  remaining: z.number().int().nonnegative(),
})
export const editionSchema = z.object({
  id: z.string(), name: z.string(), supply: z.number().int().positive(),
  price: z.object({ amount: ethSchema, currency: z.literal('ETH') }),
  availability: availabilitySchema,
})
export const nftSchema = z.object({
  id: z.string(), name: z.string(), description: z.string(),
  collection: collectionSchema, network: networkSchema,
  image: z.object({ src: z.string().nullable(), alt: z.string() }),
  price: z.object({ amount: ethSchema, currency: z.literal('ETH') }),
  availability: availabilitySchema, editions: z.array(editionSchema).min(1),
  createdAt: z.iso.datetime(), version: z.number().int().positive(),
})
export const paginationSchema = z.object({
  total: z.number().int().nonnegative(), page: z.number().int().positive(),
  pageSize: z.number().int().positive(), pageCount: z.number().int().nonnegative(),
})
export const catalogPageSchema = paginationSchema.extend({
  items: z.array(nftSchema), collections: z.array(collectionSchema), networks: z.array(networkSchema),
})
export const nftResponseSchema = z.object({ item: nftSchema })
export type Eth = z.infer<typeof ethSchema>
export type Network = z.infer<typeof networkSchema>
export type Collection = z.infer<typeof collectionSchema>
export type Availability = z.infer<typeof availabilitySchema>
export type Edition = z.infer<typeof editionSchema>
export type Nft = z.infer<typeof nftSchema>
export type CatalogPage = z.infer<typeof catalogPageSchema>
export type NftResponse = z.infer<typeof nftResponseSchema>
