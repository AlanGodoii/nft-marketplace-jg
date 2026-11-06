# Artes originais da Home

Fonte: `junglegaming.zip`, fornecido pelo proprietário em 06/11/2026. O arquivo contém **21 PNGs de seções/telas**, não layers de arte independentes. Todos foram inventariados e inspecionados; inventário em `reports/desktop-home/attachment-inventory.json`. As cinco referências da Home estão em `reports/desktop-home/reference/` e não são servidas como UI.

Quatro recortes de áreas exclusivamente artísticas foram convertidos em WebP (qualidade92), sem recriar imagens, textos ou controles. `manifest.json` registra PNG, SHA-256, coordenadas originais, dimensões e bytes. Os quatro arquivos somam84.986bytes. As imagens repetidas usam a mesma URL; não há duplicação por NFT ou seção.

| Arquivo | Origem | Uso |
|---|---|---|
| emerald-ape.webp | Frame137, x710/y0,450×450 | Hero, séries Emerald Ape, primeiro banner e segundo artigo |
| sage-nomad.webp | Products, x654/y75,250×250 | Séries Sage Nomad/Cosmic Bloom/Violet Nomad e terceiro artigo |
| neon-vessel.webp | Products, x946/y75,250×250 | Séries Neon Vessel/Ivory Baron, segundo banner e primeiro artigo |
| golden-beat.webp | Products, x362/y920,250×250 | Quarto artigo; não cria NFT novo |

A relação entre as seis séries existentes e as quatro artes segue o reuso visível nos PNGs. IDs, nomes, preços/estoques e ordenação existentes são conservados. A variante `image.desktopSrc` é fornecida pela API; `image.src`/galeria mobile não são substituídos. Leitura de persistência antiga recebe o enriquecimento de apresentação sem resetar compras, contas ou inventário.

Ainda faltam exports individuais em maior resolução, marca/vetores sociais originais, decoração dos banners e artes de outras telas/galerias. O MCP do Figma original respondeu ausência de acesso; nenhuma tentativa de contornar permissão foi feita. Estes recortes não equivalem a exports originais de layers.
