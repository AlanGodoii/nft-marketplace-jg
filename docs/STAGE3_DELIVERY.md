# Entrega etapa 3 — inventário e validação

Branch: `feat/etapa3-auth-detalhes-favoritos-carrinho`; base main `2593a26`.

Sessão, detalhe, favoritos e carrinho integrados ao MSW/Axios/Query/Router. Catálogo preservado com36NFTs; nove rotas anteriores mantidas e favoritos acrescentada. Métodos/endpoints, credenciais, políticas de cache/sessão, cupons e cenários estão em [STAGE3_API.md](STAGE3_API.md). Critérios oficiais continuam individualizados no checklist; não há declaração de conformidade total.

Credenciais de demonstração: `alice@kurio.test` e `bob@kurio.test`, senha `Kurio123!` para ambas. Cupom válido `KURIO10`; expirado `EXPIRADO`.

## Arquivos criados

- `docs/STAGE3_API.md`
- `src/components/async-state.tsx`
- `src/components/route-error.tsx`
- `src/contracts/auth.ts`
- `src/contracts/cart.ts`
- `src/features/auth/api.ts`
- `src/features/auth/auth-actions.tsx`
- `src/features/auth/auth-page.tsx`
- `src/features/auth/guard.ts`
- `src/features/auth/lifecycle.ts`
- `src/features/auth/redirect.ts`
- `src/features/auth/session-boundary.tsx`
- `src/features/cart/cart-page.tsx`
- `src/features/cart/queries.ts`
- `src/features/catalog/nft-detail-page.tsx`
- `src/features/favorites/favorite-button.tsx`
- `src/features/favorites/favorites-page.tsx`
- `src/features/favorites/queries.ts`
- `src/lib/identity.ts`
- `src/lib/scoped-request.ts`
- `src/mocks/cart-domain.ts`
- `src/mocks/commerce-db.ts`
- `src/mocks/handlers/auth.ts`
- `src/mocks/handlers/cart.ts`
- `src/mocks/handlers/favorites.ts`
- `src/mocks/handlers/shared.ts`
- `src/mocks/money.ts`
- `src/mocks/password.ts`
- `src/mocks/users.ts`
- `src/routes/favoritos.tsx`
- `tests/commerce.spec.ts`
- `docs/STAGE3_DELIVERY.md` (este inventário)

## Arquivos modificados

- `ARCHITECTURE.md`
- `README.md`
- `docs/CATALOG_API.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/REQUIREMENTS_CHECKLIST.md`
- `playwright.config.ts`
- `public/assets/README.md`
- `src/components/layout/header.tsx`
- `src/components/layout/main-layout.tsx`
- `src/components/ui/dialog.tsx`
- `src/contracts/nft.ts`
- `src/index.css`
- `src/lib/api.ts`
- `src/mocks/browser.ts`
- `src/mocks/db.ts`
- `src/mocks/fixtures.ts`
- `src/mocks/handlers/scenarios.ts`
- `src/mocks/scenarios.ts`
- `src/routeTree.gen.ts`
- `src/routes/__root.tsx`
- `src/routes/cadastro.tsx`
- `src/routes/carrinho.tsx`
- `src/routes/carteiras.tsx`
- `src/routes/checkout.tsx`
- `src/routes/login.tsx`
- `src/routes/nfts.$nftId.tsx`
- `src/routes/pedido.confirmacao.tsx`
- `src/routes/perfil.tsx`
- `tests/home.spec.ts`

## Pendências deliberadas e bloqueios

- Checkout final/pedidos/idempotência de compra/Socket.IO não fazem parte desta etapa e continuam ausentes. Perfil e carteiras possuem somente conteúdo futuro protegido.
- Figma MCP forneceu contexto/screenshots; download dos assets originais retornou403. Galeria está funcional com slots; nenhuma imagem arbitrária incorporada. Fidelidade integral ainda pendente.
- Regressão visual com baselines, Lighthouse e deploy público ainda pendentes.
- A simulação persiste no navegador e não fornece segurança de um servidor real. Hash/sessão/isolamento são exercitados dentro do escopo de demonstração.
- Cotação é referência preparatória; não reserva estoque nem autoriza confirmação de compra. Checkout futuro deve revalidar versão, referência, prazo, usuário e estoque atomicamente.

## Reprodução local

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build
npm run build:demo
npx playwright install chromium
npm run test:e2e -- --workers=1
```

O PR deve ser revisado antes de integrar main. Não executar checkout final ou interpretar a rota placeholder como confirmação de compra.

## Fechamento E3 — verificações efetivas em 05/11/2026

| Comando / cenário | Resultado real |
|---|---|
| `npm run typecheck` | Aprovado, código0; inclui fontes, testes e configuração Playwright. |
| `npm run lint` | Aprovado, código0; seis avisos Fast Refresh preexistentes, sem erros novos. |
| `npm run build` | Aprovado, código0; Vite2.0s aproximadamente. Aviso futuro de configLoader/__dirname permanece visível. |
| `npm run build:demo` | Aprovado, código0; MSW habilitado. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` | **106 passed (8.1m)**;64 etapa3 +34 catálogo +8 estruturais. `.last-run.json`: passed, failedTests vazio. Relatório HTML gerado. |
| `TEST_BASE_URL=http://127.0.0.1:4174 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium PLAYWRIGHT_HTML_OUTPUT_DIR=work/e3-preview-report npm run test:e2e -- tests/commerce.spec.ts --workers=2 --output=work/e3-preview-results` | **64 passed (3.6m)** no build otimizado com MSW, desktop/mobile. |
| Rodada anterior dev com2workers e outras verificações de navegador simultâneas | **105 passed;1 failed (9.8m)**. Timeout global30s no fluxo mobile de mesclagem, na consulta final do carrinho após logout. Trace preservado em work/e3-parallel-failure. Repetição sequencial integral passou sem alterar timeout/asserções; o mesmo caso terminou em10.3s. Não ocultar essa falha anterior. |
| Inspeção responsiva | Capturas de detalhe/carrinho/login em390/768/1440; testes sem overflow e com skeleton nas três larguras. Conferência visual amostral. Não equivale a baseline visual ou fidelidade integral ao Figma. |
| `git diff --check` e preservação do catálogo | Sem erros de whitespace; tests/catalog.spec.ts sem alterações.36NFTs preservados; metadata/edições enriquecidas. |

Ambiente: Node24.22.1, npm11.9.0, Chromium155. Logs locais em work/e3-{types,lint,build,build-demo}-final.log, work/e3-playwright-sequential.log e work/e3-preview-final.log. Relatórios, traces e capturas são gerados localmente e não versionados. Console de desenvolvimento registra o erro500 deliberado no teste de recuperação da sessão; esse cenário e a recuperação passaram.

**Critérios atendidos nesta fatia:** APIs simuladas efetivas de auth/favoritos/carrinho/cotação; contratos tipados, sessão/guards, isolamento dos dados implementados, otimismo/rollback, valores ETH precisos e E2E executáveis. **Eliminatórios globais ainda pendentes:** compra final/idempotência/recibo e Socket.IO real com integração MSW; stack/fluxos completos não estão atendidos. Perfil/carteiras, assets originais403, baselines, Lighthouse e deploy continuam pendentes. Próxima etapa deve preservar a base e concluir compra/tempo real; não há nota garantida.
