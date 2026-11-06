import { z } from 'zod'
import { ethSchema } from './nft'

const priceFilter = z.union([z.literal(''), ethSchema]).default('')
export const catalogFields = {
  tab: z.enum(['all', 'new', 'trending']).default('all'),
  search: z.string().max(120).default(''),
  collection: z.string().max(80).default(''),
  network: z.string().max(80).default(''),
  minPrice: priceFilter, maxPrice: priceFilter,
  availableOnly: z.preprocess(value => value === 'true' ? true : value === 'false' ? false : value, z.boolean().default(false)),
  sort: z.enum(['recent', 'price-asc', 'price-desc']).default('recent'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(6),
}
export const catalogSearchSchema = z.object(catalogFields)
export type CatalogSearch = z.infer<typeof catalogSearchSchema>
export type CatalogFilters = Omit<CatalogSearch, 'page' | 'pageSize'>
export const defaultCatalogSearch: CatalogSearch = catalogSearchSchema.parse({})

// Tolerant URL boundary; the REST boundary uses the strict schema instead.
export function normalizeCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  return catalogSearchSchema.parse(Object.fromEntries(Object.entries(catalogFields).map(([key, schema]) => {
    const parsed = schema.safeParse(input[key])
    return [key, parsed.success ? parsed.data : defaultCatalogSearch[key as keyof CatalogSearch]]
  })))
}
