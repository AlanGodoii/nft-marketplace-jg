# Integração da Etapa 4 à main — correção de destino dos PRs

## Histórico remoto verificado

- PR #3 foi integrado à main em 06/11/2026 01:38:02 UTC (05/11/2026 22:38:02 America/Sao_Paulo), merge 1b885da4437a50dbf3587677ff766deca41b3a4f. Contém o commit original c52f87233b061714adecbf448e6007481e6a2a04.
- PR #4 foi integrado em 06/11/2026 01:38:18 UTC à branch feat/etapa3-auth-detalhes-favoritos-carrinho, merge f0b13f2f3bee07a334abaa37cae2cf7286a664d4. Seu head foi e43d35d0ebb66809f87233f29590df85a650d6c8. Esse merge posterior na branch da Etapa 3 não atualizou a main.
- origin/main estava em 1b885da na preparação. Sua árvore é idêntica à de c52f872; não havia mudanças concorrentes de conteúdo para resolver. A árvore do merge f0b13f2 é idêntica à de e43d35d.
- Nenhum dos seis commits da Etapa 4 pertencia ao histórico da main. A diferença correspondia a 54 arquivos, 2300 adições e 275 remoções: carteiras, checkout/cotação, pedidos/recibos/idempotência, transporte Socket.IO, integração ao carrinho/estoque/rotas, testes e documentação. Inventário completo original em [STAGE4_DELIVERY.md](STAGE4_DELIVERY.md).

## Branch e integração

Branch **fix/integrar-etapa4-main** criada diretamente de origin/main em 1b885da. Executado merge --no-ff da branch original feat/etapa4-checkout-pedidos-socket (e43d35d), gerando **0a3002f8be59b35777ff037c33af2310ac50de51**. Pais: main 1b885da e Etapa 4 e43d35d. Sem conflitos; nenhuma resolução manual ou implementação foi descartada. Não houve cherry-pick, squash, rebase, reset, push forçado, exclusão de branches ou alteração direta da main.

A árvore completa imediatamente após esse merge é idêntica à de e43d35d. O patch binário c52f872→e43d35d é byte a byte idêntico ao patch origin/main em 1b885da→merge 0a3002f. Portanto, o PR inclui somente a diferença funcional original da Etapa 4; a Etapa 3 não é reaplicada. A documentação de integração é o único acréscimo posterior.

SHA-256 do patch original/integrado: 60f86bba9211793dbd3dffa637a3ed97fbb1f4dc208248bf034fd307e991b5ea.

Comprovações:

```sh
git merge-base --is-ancestor c52f872 HEAD
git merge-base --is-ancestor e43d35d HEAD
git merge-base --is-ancestor 1b885da HEAD
git diff --exit-code c52f872 1b885da
git diff --exit-code e43d35d 0a3002f
git log --graph --oneline origin/main..HEAD
```

Os seis commits originais permanecem alcançáveis:

- b0d8ce5 feat(wallets): cadastrar e editar carteiras isoladas por sessão
- 67a49cb feat(checkout): revalidar cotação e exigir revisão explícita
- 8ddf9e9 feat(orders): criar pedidos idempotentes e recibos persistentes
- 9a76769 feat(realtime): integrar Socket.IO ao transporte WebSocket MSW
- 08484be fix(checkout): recuperar tentativas e validar regressão de compra
- e43d35d docs(etapa4): registrar contratos, validações e pendências da entrega

A documentação anterior menciona PR #3 aberto e PR #4 com base na Etapa 3: é o registro histórico da entrega original. **O novo PR de correção tem base main**, para tornar a Etapa 4 disponível para integração definitiva. Nenhum merge automático foi autorizado/executado.

## Validação da branch integrada

Resultados desta nova execução estão abaixo; os 176/176 e 70/70 do documento original são evidência histórica, não substituem a validação desta branch. Logs locais em work/git-integration; artefatos gerados são ignorados pelo Git.

### Verificações estáticas e builds desta integração

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Código 0; inclui configuração e testes Playwright. |
| `npm run lint` | Código 0; três avisos Fast Refresh preexistentes (perfil.tsx, button.tsx, badge.tsx), sem erros. |
| `npm run build` | Código 0; build padrão otimizado. |
| `npm run build:demo` | Código 0; mocks habilitados. Aviso futuro Vite configLoader/__dirname permanece visível. |

Códigos de saída registrados em work/git-integration/checks.json; logs typecheck.log, lint.log, build.log e build-demo.log. Nenhum script, requisito ou configuração de teste foi alterado para obter aprovação.

Comando da regressão integral iniciada nesta branch, com servidor novo dedicado na porta 5186:

```sh
npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
TEST_BASE_URL=http://127.0.0.1:5186 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium PLAYWRIGHT_HTML_OUTPUT_DIR=work/git-integration/playwright-report npm run test:e2e -- --workers=2 --output=work/git-integration/playwright-results
```


### Resultado final Playwright

**176/176 testes aprovados (13.6m), código 0, dois workers**, na branch integrada. Nenhuma falha, interrupção, teste removido/desabilitado ou aumento de timeout nesta correção. Arquivo `.last-run.json`: status passed e failedTests vazio. O aviso de arquivo lento em tests/checkout.spec.ts (5.5m no projeto desktop) é informativo; não houve timeout ou falha.

Cobertura executada: catálogo e parâmetros de URL/filtros/paginação; cadastro/login/sessão/expiração/logout/guards; detalhe e favoritos com persistência/otimismo/rollback; carrinho visitante/usuário/merge/cupom; carteiras isoladas; checkout/cotação/revalidação; pedidos idempotentes, timeout/refresh/recusa/recibo; Socket.IO pelo cliente real, eventos, versões, reconexão e isolamento privado. Também teclado/foco, skeletons e 390/768/1440 px.

Relatório HTML local: work/git-integration/playwright-report/index.html. Log: work/git-integration/playwright.log; resultados/capturas: work/git-integration/playwright-results. Traces estão configurados para falhas; não houve falha nesta rodada para gerar novo trace.

### Conferência final de preservação

`git diff --name-only e43d35d -- src tests package.json package-lock.json playwright.config.ts vite.config.ts` não apresentou diferenças. As mudanças adicionais ao head original são somente documentação da integração. `git diff --check` passou; origin/main foi consultada novamente e permaneceu em 1b885da durante a validação. O PR tem base main, mantém os commits originais e requer revisão/merge manual. A main não foi modificada por esta tarefa.

## Limitações mantidas

Nenhuma funcionalidade foi reescrita nesta correção Git. O transporte Socket.IO continua interceptado localmente pelo MSW3; limites do adaptador constam em [STAGE4_CHECKOUT_SOCKET.md](STAGE4_CHECKOUT_SOCKET.md). Perfil completo, assets originais (HTTP 403), regressão visual com baselines, Lighthouse e deploy público continuam pendentes. Não declarar conformidade global ou nota garantida.
