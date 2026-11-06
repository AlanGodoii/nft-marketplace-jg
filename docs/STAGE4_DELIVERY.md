# Entrega etapa 4 — inventário e evidências

> Atualização de integração: PR3 já integrado à main; PR4 foi integrado à branch da etapa3. A correção está na branch fix/integrar-etapa4-main, com novo PR para main. Histórico, preservação do código e verificações em [STAGE4_MAIN_INTEGRATION.md](STAGE4_MAIN_INTEGRATION.md). As referências anteriores a PRs abertos são históricas.

Base confirmada: c52f87233b061714adecbf448e6007481e6a2a04 (etapa3). Branch: feat/etapa4-checkout-pedidos-socket. Checkpoints A/B/C/D em commits próprios; E fecha regressão, acessibilidade e documentação. PR depende do PR3 enquanto não integrado à main; nenhum merge automático.

Carteiras, checkout/cotação privada, pedidos idempotentes, recibo histórico e Socket.IO via transporte WebSocket MSW3 implementados. Catálogo36NFTs e dez rotas anteriores preservados. Métodos/payloads, cenários, políticas e falhas intermediárias em [STAGE4_CHECKOUT_SOCKET.md](STAGE4_CHECKOUT_SOCKET.md). Critérios oficiais individuais no checklist; plano restante atualizado.

Contas fictícias: alice@kurio.test e bob@kurio.test, senha Kurio123! para ambas. Cupom KURIO10 válido; EXPIRADO inválido por expiração. Carteiras de demonstração são independentes e não usam extensões/blockchain reais.

## Arquivos criados

- `docs/STAGE4_CHECKOUT_SOCKET.md`
- `docs/STAGE4_DELIVERY.md`
- `src/contracts/checkout.ts`
- `src/contracts/event.ts`
- `src/contracts/order.ts`
- `src/contracts/wallet.ts`
- `src/features/checkout/checkout-page.tsx`
- `src/features/checkout/draft.ts`
- `src/features/checkout/queries.ts`
- `src/features/checkout/quote-differences.ts`
- `src/features/checkout/quote-values.tsx`
- `src/features/orders/attempt.ts`
- `src/features/orders/orders-page.tsx`
- `src/features/orders/queries.ts`
- `src/features/realtime/realtime-boundary.tsx`
- `src/features/realtime/state.ts`
- `src/features/wallets/collector-fields.tsx`
- `src/features/wallets/queries.ts`
- `src/features/wallets/wallets-page.tsx`
- `src/mocks/checkout-domain.ts`
- `src/mocks/handlers/checkout.ts`
- `src/mocks/handlers/orders.ts`
- `src/mocks/handlers/socket.ts`
- `src/mocks/handlers/wallets.ts`
- `src/mocks/inventory.ts`
- `src/mocks/order-domain.ts`
- `src/mocks/socket-server.ts`
- `src/mocks/wallet-seeds.ts`
- `tests/checkout.spec.ts`
- `tests/helpers/market.ts`
- `tests/realtime.spec.ts`

## Arquivos modificados

- `ARCHITECTURE.md`
- `README.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/REQUIREMENTS_CHECKLIST.md`
- `docs/STAGE3_API.md`
- `playwright.config.ts`
- `src/components/layout/main-layout.tsx`
- `src/features/cart/cart-page.tsx`
- `src/features/cart/queries.ts`
- `src/index.css`
- `src/main.tsx`
- `src/mocks/browser.ts`
- `src/mocks/cart-domain.ts`
- `src/mocks/commerce-db.ts`
- `src/mocks/db.ts`
- `src/mocks/handlers/cart.ts`
- `src/mocks/handlers/scenarios.ts`
- `src/mocks/scenarios.ts`
- `src/routes/carteiras.tsx`
- `src/routes/checkout.tsx`
- `src/routes/pedido.confirmacao.tsx`
- `tests/commerce.spec.ts`
- `vite.config.ts`

## Validação e limites

Resultados finais de tipos/lint/build/demo, Playwright em dev/build e inspeção manual são registrados no fechamento E4 do checklist e no documento da etapa4. Não inferir aprovação de uma rodada interrompida.

Assets originais403, perfil completo, baselines visuais, Lighthouse e deploy público continuam pendentes. O transporte é interceptado localmente pelo MSW; não há servidor privado externo. A confirmação depende da API simulada, nunca de um setter de UI. Isso não constitui backend/segurança ou pagamento de produção.

## Reprodução local

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm run build:demo
npx playwright install chromium
npm run test:e2e -- --workers=1
npm run dev
```

Use os cenários documentados para preço/estoque, recusa, timeout pós-criação, reconexão e eventos antigos/repetidos. Resultados desconhecidos devem recuperar a mesma tentativa, inclusive quando o pedido já confirmou e esvaziou o carrinho durante uma resposta atrasada.
