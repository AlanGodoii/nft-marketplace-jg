# Kurio — Jungle Gaming NFT Marketplace

Etapas1–5 integradas à main pelo PR6, commit `ad6dfbc`. Aplicação publicada: https://nft-marketplace-jg-psi.vercel.app/. A validação HTTPS anterior (32/32desktop/mobile, compra/Socket.IO) e a associação do SHA estão no [PR7](https://github.com/AlanGodoii/nft-marketplace-jg/pull/7), separado desta revisão.

**Prioridade atual: fidelidade da Home desktop**, branch `feat/fidelidade-home-desktop`. Quatro artes originais fornecidas pelo proprietário foram integradas; mobile e fluxos preservados. Esta revisão visual ainda não está publicada: publicar Preview/revisar o PR antes de atualizar produção. Veja [DESKTOP_HOME_FIDELITY.md](docs/DESKTOP_HOME_FIDELITY.md).

React/TypeScript, TanStack Router/Query, Axios, Tailwindv4/shadcn/ui, RHF/Zod, MSW e Socket.IO. A aplicação integra **perfil/avatar/senha, carteiras, checkout, pedidos idempotentes e recibos com tempo real**, preservando catálogo36NFTs, autenticação, favoritos e carrinho das etapas anteriores.

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

Chromium já instalado pode ser selecionado com PLAYWRIGHT_CHROMIUM_EXECUTABLE. TEST_BASE_URL permite testar servidor existente/preview. Suítes de catálogo/conta/compra/Socket.IO executam em desktop/mobile; casos adicionais verificam390/768/1440, teclado/foco e movimento reduzido. Cada teste usa contexto isolado e reset dos handlers MSW. Relatório: playwright-report/index.html. Traces de falhas: node_modules/.cache/playwright-results. Resultados reais e falhas intermediárias estão em docs/STAGE5_DELIVERY.md; não confundir relatórios locais com CI/deploy.

## Pendências e revisão

Quatro artes dos exports fornecidos foram integradas à Home desktop, com procedência e recortes documentados. Acesso ao Figma/layers individuais continua indisponível; slots das demais telas foram preservados, sem imagens arbitrárias. Perfil completo e baselines estão implementados; Lighthouse possui configuração e relatórios reais em reports/lighthouse. **Fidelidade integral/assets restantes e publicação desta revisão continuam pendentes. O deploy anterior ad6dfbc foi validado separadamente. Performance do detalhe mobile anterior:84, abaixo da meta90; não foi reavaliado nesta fatia.** Não há integração real com blockchain/extensões/gateways, conforme o desafio.

A etapa5 parte de main eb156f5, na branch feat/etapa5-finalizacao. Os PRs3–5 já estão integrados; a nova etapa requer revisão própria. Commits estão organizados por checkpoint, sem merge automático. A aprovação técnica/nota da Jungle Gaming não é inferida pelos testes locais.


## Perfil e verificações da etapa5

Em /perfil, edite dados, carregue PNG/JPEG/WebP de até256KiB/4096px ou remova o avatar. Mudar senha revoga sessões e exige novo login; senhas não ficam em texto puro no armazenamento. Dados são privados por conta. GET/PATCH /api/profile, PUT /api/profile/avatar e POST /api/profile/password passam por Axios/Query/MSW. Contratos e falhas: [PROFILE_API.md](docs/PROFILE_API.md). Cenários profile.read/update/avatar/password usam os mesmos faults documentados; reset restaura Alice/Bob e as senhas fictícias.

```sh
npm run test:e2e -- --workers=2
npm run test:visual -- --workers=1
npm run test:a11y -- --workers=1
npm run build:demo
npm run preview -- --host 127.0.0.1 --port 4190 --strictPort
```

Com preview rodando, em outro terminal execute `npm run lighthouse`. São12auditorias sequenciais,3por página/perfil, com HTML/JSON e medianas em reports/lighthouse. LIGHTHOUSE_BASE_URL permite auditar outro host. CHROME_PATH seleciona um Chromium instalado. A versão validada, ambiente, resultados e limitações constam nos relatórios e entrega. Não rode E2E/baselines ao mesmo tempo que as medições.

Baselines e regras de atualização: [BASELINES.md](docs/BASELINES.md). Exports manuais do Figma e diferenças conhecidas: [VISUAL_REVIEW.md](docs/VISUAL_REVIEW.md). Não trocar slots de arte por imagens aleatórias nem atualizar todos os snapshots sem revisão.


Validação final desta etapa: **206/206 testes em desenvolvimento (16.4m)**, **38/38 selecionados no build otimizado (1.9m)** e **12/12 comparações visuais estritas (21.7s)**. Tipos/lint/build/demo e instalação limpa aprovados. Falhas intermediárias, agrupamento sem ampliar timeout, relatórios e limitações estão em STAGE5_DELIVERY.md. Lighthouse completo foi executado, mas **Performance do detalhe mobile84 permanece abaixo de90**; não se declara aprovação integral nem publicação validada.


## Home desktop — revisão com exports originais

Branch `feat/fidelidade-home-desktop`: nova composição desktop da Home, quatro artes originais otimizadas, header/hero/sidebar/grid, banners, Diário e footer. Mobile e fluxos de compra/conta permanecem preservados. Referências, screenshots, diferenças deliberadas e validações em [DESKTOP_HOME_FIDELITY.md](docs/DESKTOP_HOME_FIDELITY.md).

`npm run test:desktop -- --workers=1` compara baselines em1280/1440/1920; `npm run test:visual` mantém as quatro telas em390/768/1440. As capturas da implementação não são baselines do Figma. Não execute update-snapshots como validação.

Os36NFTs, três coleções e preços/estoques anteriores foram mantidos; não copie os números ilustrativos dos screenshots para o banco. As novas abas são parâmetros reais da API/URL. Newsletter/artigos/redes de demonstração não enviam dados ou aparentam integração externa real. Esta branch exige nova implantação para aparecer na Vercel; o deploy anterior não incorpora automaticamente um PR aberto.
