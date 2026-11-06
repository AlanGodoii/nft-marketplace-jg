import { originalArtwork } from '@/lib/artwork'
import type { Nft } from '@/contracts/nft'
export function NftImage({ nft, className = '', loading = 'lazy' }: { nft: Pick<Nft, 'name' | 'image'>; className?: string; loading?: 'lazy' | 'eager' }) {
  // Historic receipts keep their financial snapshot; only missing art is resolved.
  const src = nft.image.src ?? nft.image.desktopSrc ?? originalArtwork(nft.name)
  return src ? <img className={className} src={src} alt={`Arte original de ${nft.name}`} width="450" height="450" loading={loading} /> : <span className={className} role="img" aria-label={`Arte de ${nft.name} indisponível`}>Arte original indisponível</span>
}
