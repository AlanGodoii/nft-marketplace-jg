import { delay, http, HttpResponse } from 'msw'
import Decimal from 'decimal.js'
import type { ApiErrorCode, ApiErrorResponse } from '@/contracts/error'
import { catalogSearchSchema } from '@/contracts/catalog'
import type { CatalogPage, NftResponse } from '@/contracts/nft'
import { getMockDatabase } from '../db'
import { collections, networks } from '../fixtures'
import { beginRequest } from '../scenarios'

const error = (status: number, code: ApiErrorCode, message: string, fields?: Record<string, string[]>) =>
  HttpResponse.json<ApiErrorResponse>({ error: { code, message, ...(fields ? { fields } : {}) } }, { status })

async function list({ request }: { request: Request }) {
  const url = new URL(request.url)
  const run = beginRequest(url.searchParams.get('search') ?? '')
  // Capture an immutable resource snapshot at request start, before its latency.
  const snapshot = getMockDatabase().snapshot()
  await delay(run.latency)
  if (run.config.name === 'network-error') { run.finish('network-error'); return HttpResponse.error() }
  if (run.fail) { run.finish('500'); return error(500, 'SERVER_ERROR', 'O servidor do catálogo está indisponível. Tente novamente.') }
  const result = catalogSearchSchema.safeParse(Object.fromEntries(url.searchParams))
  if (!result.success) {
    run.finish('400')
    return error(400, 'VALIDATION_ERROR', 'Os filtros informados são inválidos.', result.error.flatten().fieldErrors)
  }
  const q = result.data
  if (q.minPrice && q.maxPrice && new Decimal(q.minPrice).gt(q.maxPrice)) {
    run.finish('400')
    return error(400, 'VALIDATION_ERROR', 'O preço mínimo não pode ser maior que o máximo.', { minPrice: ['Informe um mínimo menor ou igual ao máximo.'] })
  }
  const term = q.search.trim().toLocaleLowerCase('pt-BR')
  let items = run.config.name === 'empty' ? [] : snapshot.nfts.filter(nft =>
    (!term || `${nft.name} ${nft.collection.name}`.toLocaleLowerCase('pt-BR').includes(term)) &&
    (!q.collection || nft.collection.id === q.collection) && (!q.network || nft.network.id === q.network) &&
    (!q.availableOnly || nft.availability.status === 'available') &&
    (!q.minPrice || new Decimal(nft.price.amount).gte(q.minPrice)) && (!q.maxPrice || new Decimal(nft.price.amount).lte(q.maxPrice)),
  )
  items.sort((a, b) => {
    const compared = q.sort === 'recent' ? b.createdAt.localeCompare(a.createdAt) : new Decimal(a.price.amount).cmp(b.price.amount) * (q.sort === 'price-desc' ? -1 : 1)
    return compared || a.id.localeCompare(b.id)
  })
  const total = items.length
  items = items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize)
  run.finish('200')
  return HttpResponse.json<CatalogPage>({ items, total, page: q.page, pageSize: q.pageSize, pageCount: Math.ceil(total / q.pageSize), collections, networks })
}

export const nftHandlers = [
  http.get('/api/nfts', list),
  http.get('/api/nfts/', list),
  http.get('/api/nfts/:nftId', async ({ params }) => {
    const run = beginRequest(`detail:${params.nftId}`)
    const nft = getMockDatabase().snapshot().nfts.find(item => item.id === params.nftId)
    await delay(run.latency)
    if (run.config.name === 'network-error') { run.finish('network-error'); return HttpResponse.error() }
    if (run.fail) { run.finish('500'); return error(500, 'SERVER_ERROR', 'O servidor do catálogo está indisponível. Tente novamente.') }
    if (!nft) { run.finish('404'); return error(404, 'NOT_FOUND', 'NFT não encontrado.') }
    run.finish('200')
    return HttpResponse.json<NftResponse>({ item: nft })
  }),
]
