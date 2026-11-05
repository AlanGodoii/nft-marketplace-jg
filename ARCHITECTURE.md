# Arquitetura e decisões — etapa P0 de catálogo

## Fluxo de dados

`src/routes/index.tsx` valida o estado da URL. `CatalogPage` conecta hooks de Query a `HomePage`, que permanece apresentacional. Serviços em `features/catalog/api.ts` usam exclusivamente `lib/api.ts` (Axios); contratos Zod validam respostas desconhecidas antes de entrarem no cache. Fixtures e regras da simulação ficam apenas em `src/mocks`; não são importadas pela UI ou pelo cliente HTTP.

Router mantém as nove rotas e NotFound. O catálogo é a primeira integração funcional; demais telas continuam placeholders. O endpoint de detalhe existe, mas sua interface completa não foi implementada.

## Contratos e simulação

Contratos TypeScript/Zod compartilhados cobrem NFT, edição, coleção, rede, disponibilidade, paginação, filtros e envelope de erro. Preços ETH são strings; filtros/ordenação usam decimal.js, incluindo diferenças na 18ª casa decimal. O parser de URL preserva os limites ETH contra coerção numérica. Não há cálculo de checkout nesta etapa.

MSW 3 usa setupWorker e onUnhandledFrame. Handlers desconhecidos sob `/api/*` respondem 404 na simulação; assets e demais requisições não tratadas podem passar normalmente. O worker inicia antes de React por configuração, sem condição exclusiva de desenvolvimento, e participa do build de demonstração. O código de mocks é carregado por import dinâmico.

O banco simulado mantém snapshots e atualização versionada em uma única camada, persistida em localStorage quando disponível. A API de reset restaura o estado integral de NFTs e cenários conhecidos. Configuração de cenário usa sessionStorage para manter o cenário por aba e refresh. Storage indisponível usa memória; estado inválido é reconstruído. O esquema v1 poderá ser estendido para carrinho/pedidos, mas esses recursos não existem ainda. Contratos, cenários e limites: `docs/CATALOG_API.md`.

## Query, cache e concorrência

Chaves são separadas por listagem/parâmetros e detalhe/ID. staleTime de 60 segundos e gcTime de cinco minutos; um retry de rede/5xx, sem retry de 4xx; invalidação manual da chave ativa no botão “Atualizar catálogo”. Cancelamento usa AbortSignal até Axios. Query abandona o observer da chave anterior e não aplica uma resposta obsoleta à consulta atual. O teste de concorrência verifica a conclusão invertida dos handlers e o resultado final visível.

A UI conserva dados anteriores enquanto atualiza, sinaliza aria-busy e “Atualizando catálogo…”, e bloqueia apenas paginação/refresh para não paginar com metadados antigos. Busca e filtros continuam operáveis em falhas e vazios. O erro apresenta mensagem da API e nova tentativa. Metadata de coleções/redes pode ser reutilizado das consultas em cache durante erro/carregamento.

Alterar filtros/ordenação reinicia a página; parâmetros de página são preservados ao paginar. Cada mudança confirmada de controle gera navegação no histórico, inclusive busca sem debounce nesta etapa. URL é a única fonte dos filtros, não localStorage; refresh e histórico recuperam o estado.

## Interface e assets

O layout anterior foi preservado com a adição do filtro de rede, feedback de atualização e áreas de arte sem substituição. A fonte Roboto Mono é local. Skeletons usam shimmer CSS e são desativados por prefers-reduced-motion. Cards reservam aspect-ratio para a arte. Os assets de NFTs, hero e logo originais permanecem pendentes; `src:null` é uma ausência explícita, não imagem de erro nem fallback arbitrário.

Fidelidade integral ao Figma, grid mobile conforme os frames, páginas restantes e auditoria completa de acessibilidade continuam pendentes. O hero não recebe uma peça fictícia para aparentar destaque funcional. Não foram implementados links de compra como sucesso real.

## Testes e fronteiras desta etapa

Playwright usa Chromium em projetos desktop/mobile para os testes integrados. Cada caso abre contexto isolado e reseta o estado via handler MSW. Testes REST não usam page.route, objetos no React ou requisições Node como substitutos do transporte do navegador. Testes legados de componente usam fixture apresentacional separada; não são contabilizados como prova de integração.

Relatórios HTML e traces de falhas estão configurados. Typecheck inclui fontes, configuração Vite, testes e configuração Playwright. Regressão visual com baselines e Lighthouse permanecem pendentes. Nenhuma pontuação de qualidade ou performance é inferida a partir dos testes verdes.

Não há política de sessão, estado de carrinho, autorização, mutations otimistas ou reconciliação REST/Socket.IO implementados. A futura camada privada deverá acrescentar escopo de usuário nas query keys, limpeza de cache e subscriptions; a chave pública de catálogo não prova isolamento entre usuários. Idempotência e recuperação de compra dependem dessa próxima etapa.
