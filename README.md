# Kurio — Jungle Gaming NFT Marketplace

React + TypeScript, TanStack Router/Query, Axios, Tailwind/shadcn/ui e MSW. Etapa atual: **catálogo funcional com API simulada**. As nove rotas foram preservadas; detalhe visual, autenticação, favoritos, carrinho, checkout, pedidos e Socket.IO continuam pendentes.

Requisitos oficiais: [docs/DESAFIO.md](docs/DESAFIO.md). Estado e planejamento: [checklist](docs/REQUIREMENTS_CHECKLIST.md) e [plano](docs/IMPLEMENTATION_PLAN.md).

## Executar

Node 24 e npm 11 foram usados na validação.

```sh
npm ci
npm run dev
```

A simulação é ativada por `VITE_ENABLE_MOCKS=true` em `.env`, inclusive no build padrão. Variáveis disponíveis estão em `.env.example`; não contêm segredos. `VITE_MOCK_SCENARIO=normal` é o cenário inicial. Não há credenciais porque autenticação ainda não foi implementada.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
# Build de demonstração explícito:
npm run build:demo
```

Abrir a URL exibida pelo Vite. MSW precisa de localhost ou HTTPS e de `public/mockServiceWorker.js` acessível. O bootstrap aguarda a ativação do worker. Para uma API real na mesma origem, usar `VITE_ENABLE_MOCKS=false`; a aplicação não substitui falhas por dados locais.

## Testes

```sh
npx playwright install chromium
npm run test:e2e -- --workers=1
```

Se o ambiente já fornecer Chromium:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1
```

Os testes integrados do catálogo executam em desktop e mobile, com REST passando pelos handlers MSW. Os testes anteriores de responsividade/componentes continuam separados. Relatório HTML: `playwright-report/index.html`; traces de falhas e capturas: `node_modules/.cache/playwright-results`. `TEST_BASE_URL` permite executar contra um servidor já iniciado, inclusive `npm run preview`; nesse caso o Playwright não inicia Vite.

## API e reprodução de falhas

- `GET /api/nfts` e `/api/nfts/`: busca, filtros combinados, ordenação decimal e paginação.
- `GET /api/nfts/:nftId`: recurso individual ou 404.
- `POST /api/__mock/reset`: cenário e reset integral da simulação.
- `GET /api/__mock/scenario`: configuração e diagnósticos das requisições.

São endpoints interceptados no **navegador**, não um servidor de backend acessível por curl. Contratos, exemplos, reset e cenários normal/vazio/500/transitório/lento/fora de ordem/conexão estão em [docs/CATALOG_API.md](docs/CATALOG_API.md).

Para uma falha persistente de servidor, no console do navegador:

```js
await fetch('/api/__mock/reset', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'server-error' }),
})
location.reload()
```

Para recuperar: enviar `{name:'normal'}` ao mesmo endpoint e clicar em “Tentar novamente”, ou recarregar a página. Para shimmer, usar `{name:'slow',latencyMs:1800}`. Para requisições fora de ordem, usar `out-of-order`, buscar Emerald e rapidamente Sage. Para timeout, configurar `latencyMs:12000` (Axios espera até 10s por tentativa).

## Limitações conhecidas

As imagens originais do Figma ainda não foram importadas. Cards preservam a área da arte com indicação de indisponibilidade; nenhuma imagem arbitrária foi usada como substituição. O destaque do hero permanece indisponível. Não há autenticação, compra, Socket.IO, regressão visual com baselines nem Lighthouse nesta etapa. Não foi realizado deploy público.

A estrutura, cache, persistência, cancelamento e decisões de UX estão em [ARCHITECTURE.md](ARCHITECTURE.md). O plano geral permanece maior que esta fatia P0; testes do catálogo não validam as funcionalidades pendentes.
