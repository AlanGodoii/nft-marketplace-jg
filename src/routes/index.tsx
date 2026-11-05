import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router'
import { normalizeCatalogSearch, type CatalogSearch } from '@/contracts/catalog'
import { CatalogPage } from '@/features/catalog/catalog-page'

export const Route = createFileRoute('/')({
  validateSearch: (input: Partial<CatalogSearch> & SearchSchemaInput) => normalizeCatalogSearch(input),
  component: CatalogPage,
})
