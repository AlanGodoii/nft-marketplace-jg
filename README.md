# Kurio — Jungle Gaming NFT Marketplace

React + TypeScript, TanStack Router/Query, Axios, Tailwind v4/shadcn/ui, React Hook Form, Zod e MSW. Etapa 3 implementa **autenticação/sessão, detalhes, favoritos e carrinho com cupom/cotação**, preservando o catálogo P0 com 36 NFTs.

Os requisitos oficiais estão em `docs/DESAFIO.md`; evidências em `docs/REQUIREMENTS_CHECKLIST.md`; planejamento em `docs/IMPLEMENTATION_PLAN.md`. Contratos e cenários: `docs/CATALOG_API.md` (P0) e `docs/STAGE3_API.md` (etapa 3). Decisões: `ARCHITECTURE.md`. Inventário de arquivos e resultados da etapa: `docs/STAGE3_DELIVERY.md`.

## Executar localmente

Node 24 e npm 11 são as versões usadas na validação.

```sh
npm ci
npm run dev
```

Abrir a URL exibida pelo Vite. A simulação é habilitada por `VITE_ENABLE_MOCKS=true` em `.env`, inclusive no build; `.env.example` contém as flags públicas. MSW precisa de localhost ou HTTPS e do worker em `public/mockServiceWorker.js`. A ativação é aguardada antes de montar React.

```sh
npm run typecheck
npm run lint
npm run build
npm run build:demo
npm run preview
```

Para uma API real na mesma origem, `VITE_ENABLE_MOCKS=false` desabilita a simulação; não há dados fictícios alternativos nos componentes ou cliente Axios.

## Contas fictícias

| Nome | E-mail | Senha de demonstração |
|---|---|---|
| Alice | alice@kurio.test | Kurio123! |
| Bob | bob@kurio.test | Kurio123! |

Cadastro cria conta e sessão. Senhas não são persistidas em claro; a simulação usa hash PBKDF2 com salt. Token opaco fica no sessionStorage e a API simulada verifica sua validade. Favoritos e carrinhos privados são separados por usuário; visitante pode montar carrinho e mesclá-lo ao entrar.

Fluxo para conferir: acessar `/nfts/nft-002`, escolher edição/quantidade, adicionar ao carrinho, abrir `/carrinho` e aplicar `KURIO10`. Fazer login preserva os itens. `EXPIRADO` demonstra cupom expirado; outro código demonstra cupom inválido. Para testar esgotamento, usar `/nfts/nft-001` ou selecionar “Edição esgotada”.

## API e cenários

- `/api/nfts` e `/api/nfts/:nftId`: catálogo e detalhes.
- `/api/auth/register`, `/login`, `/session`, `/logout`: conta e sessão.
- `/api/favorites` e `/api/favorites/:nftId`: favoritos autenticados.
- `/api/cart`, `/items`, `/items/:itemId`, `/coupon`, `/quote`: carrinho e cotação, sob o prefixo `/api/cart`.
- `/api/__mock/reset`: restaura integralmente os dados e cenários.
- `/api/__mock/configure`: configura falhas sem limpar os dados.

São endpoints interceptados **no navegador**, não um backend acessível por curl ou Playwright APIRequestContext. Exemplos completos de métodos, payloads e status estão em `docs/STAGE3_API.md`.

No console do navegador, após abrir a aplicação:

```js
await fetch('/api/__mock/configure', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'normal', latencyMs: 100,
    faults: { 'favorites.add': { status: 500, times: 1, latencyMs: 1200 } }
  }),
})
```

Ao favoritar, a UI muda imediatamente e volta ao estado anterior quando a API falha. Operações e condições disponíveis estão documentadas no contrato. Para restaurar tudo:

```js
await fetch('/api/__mock/reset', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'normal' }),
})
location.reload()
```

Cenários P0 de catálogo (`empty`, `server-error`, `slow`, `out-of-order`, `network-error`, `transient-error`) continuam disponíveis. Falhas desta etapa usam `faults` por operação; não alteram o significado dos testes do catálogo. `sessionTtlMs` permite duração curta para reproduzir expiração.

## Testes

```sh
npx playwright install chromium
npm run test:e2e -- --workers=2
```

Se o ambiente já tiver Chromium:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=2
```

Catálogo e etapa 3 executam em desktop/mobile. Cada contexto é isolado; cenário é resetado pelos handlers. Relatório HTML: `playwright-report/index.html`; traces/capturas: `node_modules/.cache/playwright-results`. `TEST_BASE_URL` aponta para servidor existente, inclusive preview do build. Dados não são injetados nos componentes para substituir REST.

## Limitações desta entrega

As nove rotas anteriores foram preservadas e `/favoritos` adicionada. Perfil, carteiras, checkout e confirmação estão protegidos, mas continuam com conteúdo futuro. **Não há checkout final, criação de pedidos ou Socket.IO.** O link do carrinho apenas abre a tela futura de revisão; não confirma compra.

O Figma MCP retornou os frames, mas os downloads de assets originais falharam com HTTP 403. Galeria, cards e hero não usam imagens arbitrárias como substitutas; slots estão preparados e a indisponibilidade é explícita. Fidelidade visual integral, baselines visuais, Lighthouse e deploy público continuam pendentes. A etapa será entregue em PR para revisão, sem merge automático.
