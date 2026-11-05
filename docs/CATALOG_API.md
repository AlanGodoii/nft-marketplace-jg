# Catálogo — contratos REST e simulação

Implementação P0 de 05/11/2026. Esta etapa cobre apenas leitura do catálogo. Conta, favoritos, carrinho, checkout e Socket.IO continuam fora desta implementação.

## Transporte

A interface usa TanStack Query → serviços de catálogo → Axios → handlers MSW. Os handlers e os contratos Zod/TypeScript são compartilháveis; componentes não importam fixtures ou banco simulado. A ativação do worker é aguardada antes de montar React.

MSW intercepta requisições **no navegador**. Os endpoints abaixo não são um servidor REST externo: `curl`, Playwright APIRequestContext e fetch de Node não passam pelo service worker. Em localhost/HTTPS, use a aplicação ou `fetch` no console do navegador. As suites E2E usam navegador e confirmam `response.fromServiceWorker()`.

`VITE_ENABLE_MOCKS=true` habilita a simulação em dev e build. `.env` contém somente flags públicas do demo, sem segredos. `.env.demo` explicita o modo de demonstração. `VITE_ENABLE_MOCKS=false npm run build` remove a ativação da simulação e exige uma API real na mesma origem; não existe fallback de dados na UI. Deploy público não foi realizado nesta etapa.

## GET /api/nfts e GET /api/nfts/

As duas variantes retornam a mesma listagem. Interpretação do pedido: `/api/nfts/` é a variante com barra final; o detalhe também foi implementado em `/api/nfts/:nftId`.

| Parâmetro | Tipo / padrão | Comportamento |
|---|---|---|
| search | string, vazio, até 120 caracteres | Busca sem distinguir caixa em nome do NFT e nome da coleção; espaços externos ignorados na comparação pelo handler; preservados no input/URL durante a digitação. |
| collection | ID de coleção, vazio | Igualdade exata; vazio não restringe. |
| network | ID de rede, vazio | Igualdade exata; vazio não restringe. |
| minPrice / maxPrice | strings decimais não negativas, vazias | Limites inclusivos, até 18 casas; comparação Decimal, sem converter ETH em number. Mínimo maior que máximo retorna 400. |
| availableOnly | boolean / `true` ou `false`, padrão false | Apenas NFTs com disponibilidade positiva quando true. |
| sort | recent / price-asc / price-desc, padrão recent | Data decrescente ou preço decimal; desempate estável pelo ID. |
| page | inteiro, padrão 1; 1–100000 | Índice baseado em 1. |
| pageSize | inteiro, padrão 6; 1–48 | Quantidade máxima por página. |

Todos os filtros são combinados com AND. IDs desconhecidos de coleção/rede produzem zero resultados. Página fora do conjunto retorna `items: []`, mantendo a página solicitada e os totais reais; não é silenciosamente redirecionada. Resultado vazio tem `pageCount: 0`. Metadados de coleções e redes são globais para que opções não desapareçam ao filtrar.

Resposta: `{ items: Nft[], total, page, pageSize, pageCount, collections: Collection[], networks: Network[] }`.

`Nft` contém `id`, `name`, `description`, `collection: {id,name}`, `network: {id,name}`, `image: {src: string|null,alt}`, `price: {amount: string,currency:'ETH'}`, `availability: {status:'available'|'sold-out',remaining:integer}`, `editions: Edition[]`, `createdAt` ISO e `version` inteira. Edição contém identidade, nome, supply inteiro, preço ETH e disponibilidade. Contratos executáveis: `src/contracts/nft.ts` e `src/contracts/catalog.ts`.

As 36 fixtures cobrem três coleções, três redes, NFTs esgotados/disponíveis, seis páginas e preços que diferem na 18ª casa decimal. A arte original do Figma continua pendente: `image.src=null` reserva uma área com texto explícito. Nenhuma imagem arbitrária, de template ou gerada substitui o original.

## GET /api/nfts/:nftId

Retorna `{ item: Nft }` ou 404 `NOT_FOUND`. Exemplo existente: `/api/nfts/nft-001`; exemplo inexistente: `/api/nfts/nao-existe`. O endpoint e os hooks estão prontos, mas a tela de detalhe continua placeholder; galeria, compra, edição/quantidade e favoritos não foram implementados nesta tarefa.

## Erros

Envelope compartilhado: `{ error: { code, message, fields?: Record<string,string[]> } }`.

- 400 `VALIDATION_ERROR`: parâmetros inválidos ou mínimo maior que máximo.
- 404 `NOT_FOUND`: NFT ou endpoint inexistente na simulação.
- 500 `SERVER_ERROR`: cenário de erro do catálogo.
- Falha de conexão: `HttpResponse.error()`, normalizada pelo cliente para `NETWORK_ERROR`.
- Timeout do Axios: 10 segundos, código `TIMEOUT`. Para reproduzir, usar cenário com latencyMs maior que 10000.

O contrato inclui códigos futuros de autorização/conflito, mas **nenhum fluxo de autenticação, carrinho ou pedido foi implementado**. Cancelamento Axios mantém a identidade de cancelamento; não é transformado em erro genérico nem exibido como falha ao trocar os filtros.

## Cenários e reset

`VITE_MOCK_SCENARIO` seleciona o estado inicial. Alterações via endpoint são mantidas no sessionStorage da aba para sobreviver ao refresh. Configuração inválida/corrompida em storage volta ao cenário normal. Cada contexto Playwright possui storage isolado.

| name | Efeito |
|---|---|
| normal | Resposta determinística com 150ms por padrão. |
| empty | Listagem vazia, mantendo metadados. |
| server-error | Responde 500 em todas as leituras de NFTs. |
| transient-error | Primeira leitura de NFTs falha; a seguinte pode ser recuperada pelo retry Query. |
| slow | Latência padrão de 1600ms. |
| out-of-order | Busca Emerald espera 1000ms; Sage espera 100ms; controle por delaysBySearch disponível. |
| network-error | Falha de conexão em todas as leituras de NFTs. |

No console do **navegador**, após carregar a aplicação:

```js
await fetch('/api/__mock/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'out-of-order', latencyMs: 150,
    delaysBySearch: { Emerald: 1000, Sage: 100 } }),
})
location.reload()
```

`POST /api/__mock/reset` aceita `{name, latencyMs?:0..30000, delaysBySearch?:Record<string,0..30000>}`. O corpo `{}` restaura o cenário normal. Reinicia o banco inteiro de NFTs, configuração e diagnósticos. Corpo/configuração inválidos retornam 400; o reset não altera o estado se a validação falhar. Depois, recarregar ou usar “Atualizar catálogo” para invalidar dados já em cache. Para recuperar uma tela em erro, resetar para normal e usar “Tentar novamente”.

`GET /api/__mock/scenario` retorna configuração e últimos 200 registros de requisição (busca, início, fim e resultado). É diagnóstico da simulação, usado pelos testes para comprovar que a resposta antiga realmente terminou depois da nova. Reset protege os diagnósticos de conclusões atrasadas da geração anterior. Estes endpoints só existem quando MSW está habilitado; não são funcionalidades de produção.

## Estado e precisão

`src/mocks/db.ts` concentra snapshot, reset e atualização versionada de NFT para futuros handlers de carrinho/checkout. Persistência usa localStorage `kurio.mock.database.v1`, com contratos validados; estado corrompido é refeito a partir da seed. Storage indisponível mantém apenas estado em memória. Atualização exige o mesmo ID e versão maior e retorna uma cópia; handlers de leitura recebem snapshots, não referências mutáveis. Não existem atualizações na interface nem endpoints de compra nesta etapa.

Valores ETH são strings no contrato, fixtures, transporte, URL e exibição. Os filtros e a ordenação usam Decimal. O parse de URL preserva minPrice/maxPrice inclusive em links diretos não codificados como JSON, evitando a conversão automática de números do Router. Quantidades e paginação são inteiras. Ainda não há cálculo de totais ou cotação de checkout.

## URL, cache e recuperação

TanStack Router valida busca/coleção/rede/preços/disponibilidade/sort/page/pageSize. Campos inválidos em links diretos recebem seus padrões sem quebrar a tela; a API continua validando estritamente os parâmetros efetivamente recebidos. Alterar qualquer filtro ou ordenação volta à página 1. Navegar entre páginas preserva os demais parâmetros. Back/forward e refresh leem o mesmo estado da URL.

Chaves Query: `['nfts','list',searchNormalizado]` e `['nfts','detail',id]`. Todos os parâmetros participam da chave; recursos privados futuros precisarão de namespace por usuário, ainda não criado. staleTime=60s, gcTime=5min, um retry para rede/5xx, sem retry de 4xx. Refetch de Query em retorno de foco usa as regras padrão para dados stale; “Atualizar catálogo” invalida a chave exata.

`AbortSignal` da query é passado ao Axios. Mudança de chave cancela a requisição anterior; chaves distintas também impedem que resposta antiga substitua a atual. Em refetch/mudança de filtro, dados anteriores podem permanecer como placeholder e são explicitamente marcados “Atualizando catálogo…”, com aria-busy e paginação temporariamente desabilitada. Filtros continuam editáveis em loading, vazio e erro. Não há cache HTTP adicional da simulação.

## Verificação da entrega e arquivos

Todos os nove cenários solicitados têm testes em tests/catalog.spec.ts, executados pelo navegador com handlers MSW. A cobertura adicional inclui precisão de ETH de 18 casas em URL direta, busca digitada com espaços, contrato individual/404, HTTP 400, conexão, retry, reset inválido, shimmer/reduced motion, cancelamento e refetch com conteúdo preservado. O timeout de 10s é configurável/reproduzível, mas não possui caso automatizado específico nesta etapa.

Comandos e resultados finais estão em docs/REQUIREMENTS_CHECKLIST.md. Nenhum requisito de compra, conta ou tempo real foi promovido a validado por esta implementação.

### Criados nesta implementação

- `.env`
- `.env.demo`
- `.env.example`
- `ARCHITECTURE.md`
- `docs/CATALOG_API.md`
- `src/contracts/catalog.ts`
- `src/contracts/error.ts`
- `src/contracts/nft.ts`
- `src/features/catalog/api.ts`
- `src/features/catalog/catalog-page.tsx`
- `src/features/catalog/queries.ts`
- `src/lib/api.ts`
- `src/lib/query-keys.ts`
- `src/mocks/browser.ts`
- `src/mocks/db.ts`
- `src/mocks/fixtures.ts`
- `src/mocks/handlers/nfts.ts`
- `src/mocks/handlers/scenarios.ts`
- `src/mocks/scenarios.ts`
- `src/vite-env.d.ts`
- `tests/catalog.spec.ts`
- `tsconfig.e2e.json`

### Modificados nesta implementação

- `.gitignore`
- `README.md`
- `docs/home-interface.md`
- `package.json`
- `playwright.config.ts`
- `src/components/ui/skeleton.tsx`
- `src/features/catalog/components/catalog-filters.tsx`
- `src/features/catalog/components/catalog-pagination.tsx`
- `src/features/catalog/components/hero.tsx`
- `src/features/catalog/components/nft-card.tsx`
- `src/features/catalog/home-page.tsx`
- `src/features/catalog/types.ts`
- `src/index.css`
- `src/lib/query-client.ts`
- `src/main.tsx`
- `src/router.ts`
- `src/routes/index.tsx`
- `tests/fixtures/catalog-preview.tsx`
- `tests/home.spec.ts`
- `docs/REQUIREMENTS_CHECKLIST.md` — documento da auditoria anterior, atualizado nesta etapa.
- `docs/IMPLEMENTATION_PLAN.md` — documento da auditoria anterior, atualizado nesta etapa.
