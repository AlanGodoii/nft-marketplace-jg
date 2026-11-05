// Test-only fixtures. Never imported by application routes.
import { createNftFixtures, collections, networks } from '../../src/mocks/fixtures'
import { createRoot } from 'react-dom/client'
import { RouterContextProvider } from '@tanstack/react-router'
import { router } from '@/router'
import { CatalogGrid } from '@/features/catalog/components/catalog-grid'
import type { CatalogPage, RemoteData } from '@/features/catalog/types'

export function mountCatalogPreview(status: 'loading' | 'success' | 'empty' | 'error') {
  const catalog: RemoteData<CatalogPage> = status === 'loading'
    ? { status: 'loading' }
    : status === 'error'
      ? { status: 'error', message: 'Falha de teste no carregamento.' }
      : {
        status: 'success',
        data: {
          items: status === 'empty' ? [] : createNftFixtures().slice(0, 6).map((nft, index) => ({ ...nft, id: `teste-${index}` })),
          total: status === 'empty' ? 0 : 6,
          page: 1,
          pageCount: 1,
          collections, networks, pageSize: 6,
        },
      }
  const original = document.getElementById('root')
  if (original) original.style.display = 'none'
  const target = document.createElement('div')
  target.id = 'catalog-preview'
  document.body.append(target)
  createRoot(target).render(
    <RouterContextProvider router={router}>
      <div className="kurio-theme min-h-dvh py-8">
        <div className="kurio-container catalog-layout">
          <div className="desktop-filters" />
          <CatalogGrid catalog={catalog} />
        </div>
      </div>
    </RouterContextProvider>,
  )
}
