import type { Collection, Network, Nft } from '@/contracts/nft'

export const collections: Collection[] = [
  { id: 'genesis', name: 'Genesis' }, { id: 'nomads', name: 'Nomads' }, { id: 'signals', name: 'Signals' },
]
export const networks: Network[] = [
  { id: 'ethereum', name: 'Ethereum' }, { id: 'polygon', name: 'Polygon' }, { id: 'solana', name: 'Solana' },
]
const series = ['Emerald Ape', 'Sage Nomad', 'Neon Vessel', 'Cosmic Bloom', 'Violet Nomad', 'Ivory Baron']
const prices = ['0.19', '0.29', '0.390000000000000001', '0.390000000000000002', '0.99', '1.19', '1.29', '1.39', '1.69', '1.79', '1.99', '2.29']

export function createNftFixtures(): Nft[] {
  return Array.from({ length: 36 }, (_, index) => {
    const number = String(index + 1).padStart(3, '0')
    const remaining = index % 5 === 0 ? 0 : 2 + index % 4
    const price = { amount: prices[index % prices.length], currency: 'ETH' as const }
    const availability = { status: remaining ? 'available' as const : 'sold-out' as const, remaining }
    const name = `${series[index % series.length]} #${number}`
    return {
      id: `nft-${number}`, name,
      description: 'Colecionável da simulação determinística do marketplace Kurio.',
      collection: { ...collections[index % 3] }, network: { ...networks[Math.floor(index / 3) % 3] },
      // Original Figma art has not been imported. Do not substitute arbitrary imagery.
      image: { src: null, alt: `Arte original de ${name} ainda não disponível` },
      creator: { id: 'kurio-studio', name: 'Estúdio Kurio' },
      gallery: Array.from({ length: 4 }, (_, view) => ({ src: null, alt: `Arte original de ${name} — vista ${view + 1} indisponível` })),
      price, availability,
      editions: [{ id: `edition-${number}`, name: 'Edição original', supply: 10, price: { ...price }, availability: { ...availability } },
        { id: `edition-${number}-limited`, name: 'Limitada 1/2', supply: 2, price: { ...price }, availability: { status: remaining ? 'available' : 'sold-out', remaining: Math.min(2, remaining) } },
        { id: `edition-${number}-sold-out`, name: 'Edição esgotada', supply: 1, price: { ...price }, availability: { status: 'sold-out', remaining: 0 } }],
      createdAt: new Date(Date.UTC(2026, 9, index + 1)).toISOString(), version: 1,
    }
  })
}
