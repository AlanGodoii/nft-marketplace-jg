# Assets locais

Obtidos:
- Fonte Roboto Mono, pesos 400, 500 e 700, arquivos WOFF2 Latin.
- Origem: pacote oficial @fontsource/roboto-mono 5.3.0, registro npm.
- Licença SIL Open Font License em fonts/OFL.txt.

Não obtidos:
- Logo original Kurio.
- Imagem/arte original do Hero.
- Imagens e demais elementos gráficos dos NFTs.
- Eventuais ícones exclusivos e elementos decorativos do Figma.

O acesso ao Figma foi bloqueado pelo proxy do ambiente (CONNECT 403).
Nenhuma imagem do Figma foi substituída por captura de tela, imagem gerada
ou arte do template Vite. O nome Kurio é texto; os ícones são do lucide-react.
As imagens da API serão recebidas pelas propriedades tipadas dos componentes.

## Etapa 3

O Figma MCP forneceu os contextos desktop/mobile e URLs dos assets originais. Downloads PNG/SVG por curl retornaram HTTP 403; a tentativa de obter as imagens-fonte pelo endpoint oficial também forneceu URLs do mesmo host. Nenhuma imagem arbitrária, renderização de tela inteira ou arquivo de erro foi incorporado. Galeria e cards recebem src/alt por contrato e aguardam os arquivos originais.
