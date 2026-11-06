# Kurio — Jungle Gaming NFT Marketplace

React/TypeScript, TanStack Router/Query, Axios, Tailwindv4/shadcn/ui, RHF/Zod, MSW e Socket.IO. A etapa4 integra **carteiras, checkout, pedidos idempotentes e recibos com tempo real**, preservando catálogo36NFTs, autenticação, favoritos e carrinho das etapas anteriores.

Enunciado: docs/DESAFIO.md. Evidências: docs/REQUIREMENTS_CHECKLIST.md. Plano: docs/IMPLEMENTATION_PLAN.md. Arquitetura: ARCHITECTURE.md. Contratos/cenários: docs/CATALOG_API.md, docs/STAGE3_API.md e **docs/STAGE4_CHECKOUT_SOCKET.md**. As seções das etapas anteriores são históricas quando contradizem o progresso atual.

## Executar

Node24/npm11 foram utilizados na validação. Mocks são ativados por VITE_ENABLE_MOCKS=true em .env e .env.demo; .env.example contém flags públicas. Nenhuma credencial real ou backend externo é necessário. MSW precisa de localhost/HTTPS e public/mockServiceWorker.js.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm run build
npm run build:demo
npm run preview
```

App é carregada somente depois de MSW iniciar; isso permite interceptar o WebSocket utilizado por engine.io-client. Build/demo inclui o mesmo transporte simulado e handlers. Com mocks desativados, a origem precisa fornecer as APIs/Socket.IO reais; não existem dados fictícios alternativos nos componentes.

## Contas e jornada

| Conta fictícia | E-mail | Senha |
|---|---|---|
| Alice | alice@kurio.test | Kurio123! |
| Bob | bob@kurio.test | Kurio123! |

Ambas possuem carteiras principais Ethereum independentes. Endereços das fixtures são simbólicos e nunca utilizados em blockchain. Cadastro cria uma conta sem carteiras, que podem ser cadastradas em /carteiras. Senhas persistem como hashes PBKDF2 com salt; token opaco fica em sessionStorage.

1. Buscar Sage Nomad#002 e abrir /nfts/nft-002. Selecionar edição/quantidade e adicionar ao carrinho.
2. Em /carrinho, usar KURIO10 ou remover o cupom. EXPIRADO demonstra erro; códigos desconhecidos são inválidos.
3. Abrir checkout. Visitante é levado ao login com retorno; carrinho é mesclado à conta.
4. Selecionar carteira/rede compatível com os itens. Conectar a carteira simulada, validar os dados e escolher itens/quantidades.
5. Revalidar/revisar, aceitar explicitamente e finalizar. Só a API cria pending e confirma/rejeita depois; nenhuma compra é confirmada pelo React.
6. Acompanhar /pedido/confirmacao?orderId=...; sem ID, a página mostra o histórico privado.

Itens não selecionados permanecem no carrinho. Somente confirmação efetiva remove quantidades compradas; recusa/pending e erro de transporte por si não removem itens. Se o backend confirmar durante uma resposta atrasada, a tentativa continua recuperável mesmo com o carrinho vazio. Recibo histórico não muda com os preços do catálogo. Após timeout, **recuperar a tentativa anterior**, mantendo a mesma chave; não iniciar uma nova compra enquanto o resultado for desconhecido.

## REST e tempo real

- /api/nfts e /api/nfts/:nftId: catálogo/detalhe.
- /api/auth/register, /api/auth/login, /api/auth/session, /api/auth/logout: conta/sessão.
- /api/favorites e /api/favorites/:nftId: favoritos autenticados.
- /api/cart, /api/cart/items, /api/cart/items/:itemId, /api/cart/coupon, /api/cart/quote: carrinho/cotação.
- GET/POST /api/wallets, PATCH /api/wallets/:walletId e POST /api/wallets/:walletId/connection: carteiras/conexão.
- POST /api/checkout/quote: snapshot privado para revisão.
- POST /api/orders com Idempotency-Key; GET /api/orders e /api/orders/:orderId: criação, histórico, estado e recibo.

As APIs são interceptadas no navegador, não um servidor acessível por curl. Aplicação usa Axios. ETH trafega como string; somente o domínio MSW calcula com decimal.js. Regras de sessão/persistência/cache/retries e payloads completos estão na documentação.

Tempo real: socket.io-client4.8.4 utiliza WebSocket Engine.IO4/Socket.IO5 em /kurio-live/. MSW3 ws.link intercepta o transporte. Eventos nft.updated e order.updated têm identidade/versão; duplicatas, versões antigas e sessões incorretas são descartadas. Reconexão revalida sessão e reconcilia REST; não utiliza polling para fingir Socket.IO. @mswjs/socket.io-binding0.2.0 foi avaliado, mas exige MSW2; a implementação compatível com MSW3 e suas limitações estão documentadas.

## Cenários reproduzíveis

No console do navegador após abrir a aplicação:

```js
await fetch('/api/__mock/configure', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'normal', latencyMs: 100,
    orderOutcome: 'pending', walletConnection: 'connected' }),
})
```

orderOutcome: pending/confirmed/rejected; orderDelayMs controla processamento. orderResponseDelayMs:11000 reproduz timeout Axios10s *depois* da criação. walletConnection:connected/refused/disconnected controla conexão. faults por operação simulam HTTP/rede/latência; exemplos completos no documento da etapa4.

Para mudar preço/estoque pelo backend e entregar nft.updated pelo socket:

```js
await fetch('/api/__mock/nft', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nftId: 'nft-002', editionId: 'edition-002', price: '0.49' }),
})
```

Interromper/reconectar: POST /api/__mock/socket com {action:'disconnect'} ou {action:'resume'}. Cliente tenta reconectar pelo Manager real; um pedido liquidado offline é recuperado por REST. Cenários P0 de vazio/erro/lentidão/fora de ordem continuam disponíveis. Emissões e controles da simulação não escrevem diretamente em React/Query.

Reset integral:

```js
await fetch('/api/__mock/reset', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'normal' }),
})
sessionStorage.removeItem('kurio.checkout.attempt:alice')
sessionStorage.removeItem('kurio.checkout.attempt:bob')
location.reload()
```

Tentativas/rascunhos do cliente são privados por usuário. O reset da API restaura bancos/cenários; referências locais a tentativas antigas não autorizam compras e podem ser descartadas após resposta definitiva de inexistência. Para um início completamente limpo, use novo contexto do navegador ou limpe o armazenamento da origem.

## Testes

```sh
npx playwright install chromium
npm run test:e2e -- --workers=1
```

Chromium já instalado pode ser selecionado com PLAYWRIGHT_CHROMIUM_EXECUTABLE. TEST_BASE_URL permite testar servidor existente/preview. Suítes de catálogo/conta/compra/Socket.IO executam em desktop/mobile; casos adicionais verificam390/768/1440, teclado/foco e movimento reduzido. Cada teste usa contexto isolado e reset dos handlers MSW. Relatório: playwright-report/index.html. Traces de falhas: node_modules/.cache/playwright-results. Resultados reais e falhas intermediárias estão no fechamento da etapa4; não confundir relatórios locais com CI/deploy.

## Pendências e revisão

Assets originais do Figma continuam bloqueados403, sem substituição por imagens arbitrárias. Slots estão preparados. **Perfil completo, baselines de regressão visual, Lighthouse e deploy público continuam pendentes.** Não há integração real com blockchain/extensões/gateways, conforme o desafio.

A etapa4 parte de c52f872, na branch feat/etapa4-checkout-pedidos-socket, e depende do PR3 enquanto ele não estiver integrado à main. Commits estão organizados por checkpoint; entrega em PR para revisão, sem merge automático. A aprovação técnica/nota da Jungle Gaming não é inferida pelos testes locais.
