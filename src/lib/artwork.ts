// Asset associations from the owner's exported Figma artwork. No business data.
export function originalArtwork(name: string) {
  const asset = name.startsWith('Emerald Ape') ? 'emerald-ape'
    : /^(Sage Nomad|Cosmic Bloom|Violet Nomad)/.test(name) ? 'sage-nomad'
      : /^(Neon Vessel|Ivory Baron)/.test(name) ? 'neon-vessel'
        : /^Golden/.test(name) ? 'golden-beat' : undefined
  return asset ? `/assets/figma/home/${asset}.webp` : undefined
}
