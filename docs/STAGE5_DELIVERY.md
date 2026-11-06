# Etapa 5 — publicação, perfil e finalização

Base: `origin/main` **eb156f5fd10f949539824e4818ccdaddc6dc855a**, já contendo PR5 e commits c52f872/e43d35d/9ca6d4c. Branch: `feat/etapa5-finalizacao`. Enunciado lido integralmente; matriz, plano, arquitetura e contratos E3/E4 consultados antes das alterações.

## Baseline

TypeScript, lint e build: código0. Lint: três avisos Fast Refresh preexistentes. Oito testes de catálogo, login/sessão, compra completa e handshake/nft.updated em desktop/mobile: **8/8 aprovados (44.0s)**. Logs locais em `work/stage5/baseline-*`.

## Checkpoint A — publicação

Configuração Vercel, fallback Netlify, flags públicas de produção e instruções em [DEPLOYMENT.md](DEPLOYMENT.md). **URL pública: não publicada/não validada nesta execução.** Vercel não está conectado e auxiliares obrigatórios do Sites estão indisponíveis no executor. Não há afirmação de deploy concluído. A validação local do build será registrada com seus resultados reais.

## Bloqueios externos

O Figma MCP retornou limite de chamadas do plano Starter ao consultar metadata da página0:1 nesta etapa. A sessão foi criada, mas não há novo contexto visual completo. Assets originais já retornavam403 nas etapas anteriores. Não foram substituídos por arte aleatória. Comparações disponíveis, diferenças e exports necessários serão discriminados na documentação visual.

Validação A no build otimizado local: **5/5 aprovados (26.3s)** — acesso direto/refresh das nove telas e favoritos, compra completa e handshake/evento em desktop/mobile. Isso comprova a aplicação no preview; não comprova a configuração da Vercel nem uma URL pública. Log: work/stage5/A-tests.log.

## Checkpoint B — perfil

GET/PATCH /api/profile, PUT /api/profile/avatar e POST /api/profile/password implementados via Axios/Query/MSW. Dados versionados e conflitos409; perfil/avatar privados, migração aditiva do banco, erros400/401/409/500 e cenários profile.read/update/avatar/password. Avatar PNG/JPEG/WebP até256KiB/4096px, assinatura e decodificação real verificadas; SVG e conteúdo inválido rejeitados. Senha PBKDF2 com salt novo; sucesso revoga todas as sessões/conexões da conta e exige login, preservando os demais recursos.

**16/16 testes de perfil aprovados (1.2m)**, desktop/mobile; tipos aprovados e lint sem erros, dois avisos Fast Refresh preexistentes restantes. Edição/refresh, sessão atualizada,409/versão, avatar válido/inválido/remoção, senha incorreta/nova/login/revogação, ausência de senha em storage, A/B,500/retry e expiração durante edição. Logs work/stage5/B-*.

## Checkpoints C/D — visual e acessibilidade

Fidelidade integral continua PARCIAL/BLOQUEADA pelos assets403 e limite do Figma MCP. [VISUAL_REVIEW.md](VISUAL_REVIEW.md) discrimina nove telas, diferenças conhecidas e exports manuais necessários. Nenhuma chamada adicional ao Figma será repetida após o bloqueio. Capturas locais das nove telas, inclusive recibo confirmado, em390/768/1440; inspeção visual amostral realizada.

12 baselines versionadas de Home/detalhe/carrinho/checkout em390/768/1440, dados MSW reais, fontes locais e relógio/visitante estáveis, sem esconder assets ausentes. Comparação estrita final: **12/12 aprovados (23.4s)**, zero pixels diferentes e sem update-snapshots. Comandos npm run test:visual e npm run test:a11y.

Axe/WCAG2A/AA/2.1AA nas nove telas e três larguras, incluindo recibo efetivamente confirmado, mais teclado/foco/zoom200%/movimento reduzido: **4/4 aprovados (37.4s)**. Não substitui auditoria humana integral de acessibilidade.

Falhas intermediárias: criação inicial9aprovados/3falhas por seletor inexistente quote-total, corrigido para total. Primeiro comparativo estrito9/3 mostrou exclusivamente UUID variável na referência do carrinho; visitante foi fixado no teste, sem máscara, e somente os três baselines do carrinho foram atualizados após inspeção do diff. Os outros nove permaneceram inalterados. Axe inicial3/1 encontrou overflow real do cabeçalho em zoom200%; corrigido com flex-wrap, sem diferenças nas capturas normais. Repetição4/4(31.5s), depois expandida para recibo confirmado4/4(37.4s). Traces/diffs locais em work/stage5/D-*.

## Checkpoint E — primeira medição e otimização

Primeira rodada completa12medições: Home mobile97/100/96/91, Home desktop100/100/96/91; detalhe mobile83/100/96/91 e desktop87/100/96/91 (ordem Performance/Accessibility/Best Practices/SEO, medianas). Detalhe não atingia Performance90. Resumo preservado em reports/lighthouse/before-summary.json; relatórios originais locais em work/stage5/lighthouse-before.

Causas medidas: detalhe mobile LCP4266ms e TBT185ms; detalhe desktop CLS0.2267 e LCP1090ms. Corrigidas cascata de carregamento (React DOM em paralelo ao MSW, mantendo App/Engine.IO após worker.start), consulta antecipada via loader/Query sem bloquear skeleton e skeleton de detalhe com geometria da galeria/painel/conteúdo. Não foram removidos mocks, Socket.IO, imagens, fontes ou funcionalidades para medir. Tipos/build aprovados e14/14 testes relevantes no build otimizado(42.0s), incluindo acesso direto/404/estoque, compra/socket,390/768/1440 e skeletons. A nova rodada Lighthouse será registrada abaixo, sem substituir os resultados anteriores por suposições.


## Lighthouse final — resultados reais

Relatórios completos em reports/lighthouse (12HTML +12JSON), configurações versionadas e resumo de3amostras por cenário. Fonte da aplicação auditada:85dd22e; alterações posteriores são documentação/relatórios. Lighthouse13.6.0, Chromium155, Node24.22.1, Linux, build otimizado no preview4190, mocks padrão e armazenamento resetado por execução. Perfis oficiais Lighthouse: mobile412×823, Slow4G/RTT150ms/1638.4Kbps/CPU4; desktop1350×940/Dense4G/CPU1. Não havia E2E/baselines simultâneos às medições.

| Página/perfil | Performance | Accessibility | Best Practices | SEO | LCP(ms) | CLS | TBT(ms) |
|---|---|---|---|---|---|---|---|
|Home mobile|95|100|96|91|761|0.000307|272|
|Home desktop|100|100|96|91|252|0.000233|0|
|Detalhe mobile|84|100|96|91|4095|0|197|
|Detalhe desktop|99|100|96|91|906|0.000014|7|

**Meta Performance≥90 não atingida no detalhe mobile.** As outras três categorias atingem metas em todos os cenários, e Performance passa nos outros três. Não declarar Lighthouse integralmente aprovado. A primeira rodada teve83mobile/87desktop no detalhe; após skeleton/paralelismo,85/99; após modulepreload sem execução precoce,84/99. Variação1ponto mobile não comprova ganho; o ganho consistente foi desktop/CLS. Resumos anteriores preservados em before-summary.json e intermediate-summary.json.

O mobile ainda apresenta custo de scripts/avaliação do runtimeMSW e dependências de interface sob simulação4×CPU/Slow4G, com LCP tardio. O trace aponta cadeia de carregamento e JS não utilizado parcialmente em módulos compartilhados; não há garantia de causa única. Isso exige investigação adicional antes de afirmar a meta. BP96 decorre do401 real de /api/auth/session para visitante anônimo, registrado pelo navegador; não foi ocultado nem trocado por falsa sessão para melhorar pontuação. SEO91 decorre de /robots.txt ausente retornandoHTML pelo fallbackSPA; pendência de refinamento, ainda acima da meta90.

A auditoria inclui funções/mocks/Socket.IO/fontes da entrega; os assets originais ausentes permanecem nos slots reais. Os resultados não representam a versão futura com imagens originais e devem ser repetidos após incorporá-las e no host publicado. Medições locais não validam URL pública nem garantem nota.

## Instalação limpa e verificações finais

Arquivo85dd22e extraído com git archive para work/stage5/clean-checkout. npm ci instalou445pacotes em6s; typecheck e build:demo passaram(código0). Nenhuma versão de pacote preexistente foi alterada pelo acréscimo Lighthouse/axe; somente dependências adicionais/metadados de lockfile. Build isolado registrou aviso informativo de duração de callbacks Rolldown, sem falha.

npm run typecheck, npm run lint, npm run build e npm run build:demo: código0. Lint mantém dois avisos FastRefresh preexistentes em button.tsx/badge.tsx. Aviso futuro __dirname do Vite permanece visível. Logs e códigos em work/stage5/final-checks.json e final-*.log; resultados da regressão completa serão registrados ao terminar.


### Ajuste de granularidade encontrado na regressão integral

A primeira regressão foi interrompida após97aprovados,4falhas,2interrompidos e95nãoexecutados(8.4m, código130). As quatro falhas eram exclusivamente os testes novos de axe/navegação que acumulavam9ou10rotas, incluindo refreshs, no mesmo teste: timeout global30s em desenvolvimento, confirmado pelos traces. Esses mesmos cenários haviam passado no build otimizado; não são usados como aprovação da suíte integral.

Os testes foram divididos em grupos independentes, preservando todas as rotas/refreshs/asserções: navegação pública/privada e três grupos de três telas por largura na auditoria axe. Nenhum timeout foi ampliado e nenhum teste anterior foi alterado. Repetição específica em desenvolvimento: **14/14 aprovados (2.1m)**. A nova suíte integral contém206casos (176anteriores +16perfil +4rotas +10acessibilidade). Resultados finais abaixo, após execução. Traces originais preservados em work/stage5/final-results.


## Requisitos concluídos nesta etapa e limites

- Perfil completo funcional: consulta/edição, avatar validado, senha com hash/salt e revogação, cache/mutations/erros e isolamento. Contratos e cenários em PROFILE_API.md.
- Publicação preparada: produção com mocks, fallback SPA, worker, Vercel/Netlify e instruções para branch ainda não integrada. **Publicação não realizada/validada**, conforme confirmação do usuário de que ainda não possui URL.
- Baselines das quatro telas em três larguras, testes de acessibilidade e auditoria Lighthouse efetivamente utilizados. Comparação padrão exige snapshots existentes (updateSnapshots:none); atualização somente explícita e revisada.
- Catálogo36NFTs, auth, favoritos, carrinho, carteiras, checkout/pedidos idempotentes e Socket.IO preservados; os cinco arquivos de testes anteriores permanecem sem alterações nesta etapa.

**Pendências:** URL HTTPS e compra/socket/refresh no host real; arte original403/limite Figma e fidelidade fina dos nove frames; Performance do detalhe mobile84<90; revisão humana integral/zoom nativo em todas as telas; distribuição pública de traces funcionais como artefatos CI. A matriz detalha escopo/evidência por requisito, sem converter contagem em nota garantida.

## Instruções para o avaliador

1. Checkout da branch/commit deste PR, npm ci, npx playwright install chromium, npm run dev. Node24 foi utilizado. Configuração/variáveis públicas no README; não são necessários segredos/backend privado.
2. Entre como alice@kurio.test ou bob@kurio.test, senha Kurio123! após reset. Cada conta tem carteira Ethereum independente.
3. Abra /nfts/nft-002, adicione ao carrinho, opcionalmente aplique KURIO10, abra checkout, conecte carteira simulada, revalide/revise, aceite e finalize. Aguarde confirmed/recibo vindo da API.
4. Em /perfil edite dados/avatar; mudar senha encerra sessões e exige a nova credencial. Reset documentado restaura contas/senhas fictícias. Nunca coloque credenciais reais na demonstração.
5. Para preço/estoque/timeout/reconexão e eventos repetidos/antigos, use os controles de STAGE4_CHECKOUT_SOCKET.md; perfil usa faults de PROFILE_API.md. Não altere caches/setters para simular backend.
6. Execute npm run typecheck, npm run lint, npm run build, npm run build:demo, npm run test:e2e -- --workers=2 e npm run test:visual -- --workers=1. Auditoria separada: preview otimizado4190 e npm run lighthouse. Não rodar navegadores de teste simultaneamente com Lighthouse.
7. Para publicar antes do merge, siga DEPLOYMENT.md usando feat/etapa5-finalizacao. Envie a URL HTTPS e o SHA da implantação para validar a versão real. Não usar uma implantação antiga da main como evidência da Etapa5.


### Regressão integral definitiva

**206/206 testes aprovados (16.4m), código0**, desktop/mobile,2workers;176anteriores +16perfil +4rotas +10acessibilidade. .last-run.json confirma passed e failedTests vazio. Nenhum dos cinco arquivos de testes anteriores foi alterado, nenhum teste desabilitado e nenhum timeout ampliado. Aviso informativo de arquivo lento em checkout.spec.ts, sem falha.

Comando: TEST_BASE_URL=http://127.0.0.1:5190 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium PLAYWRIGHT_HTML_OUTPUT_DIR=work/stage5/full-final-report npm run test:e2e -- --workers=2 --output=work/stage5/full-final-results. HTML local: work/stage5/full-final-report/index.html; log full-final-tests.log e resultados full-final-results. Isso não equivale a execução CI ou deploy público.


### Validação definitiva do build e das baselines

- Build otimizado com mocks em4190: **38/38 aprovados (1.9m), código0** —16perfil,4rotas/refresh,16Socket.IO e2compras completas. Fonte de aplicação85dd22e, mesma da auditoria final; sem servidor privado externo.
- Comparação visual definitiva: **12/12 aprovados (21.7s), código0**, zero pixels diferentes, updateSnapshots:none, sem atualizar PNGs. Baselines originais inspecionadas e preservadas após as otimizações.
- TypeScript e lint repetidos após agrupar os testes/configurar snapshots estritos: código0, dois avisos FastRefresh preexistentes. git diff --check passou.

Comandos: TEST_BASE_URL=http://127.0.0.1:4190 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- tests/profile.spec.ts tests/deployment.spec.ts tests/realtime.spec.ts tests/checkout.spec.ts --grep 'perfil:|SPA:|D:|compra completa do catálogo' --workers=2; em seguida npm run test:visual -- --workers=1 com a mesma URL. HTML/logs/resultados em work/stage5/production-* e visual-delivery-*. .last-run.json confirma passed/failedTests vazio em ambos. Relatórios funcionais locais não são deploy/CI; HTML/JSON Lighthouse estão versionados em reports/lighthouse.

## Inventário da entrega

64 arquivos criados e17 modificados em relação à main eb156f5. Inclui contratos/handlers/hooks/tela/testes de perfil; deploy/flags/ignore; configuração e12PNG de baselines; teste axe/rotas; configuração/runner e relatórios Lighthouse; ajustes de bootstrap/detalhe/skeleton; documentação atualizada. Relatórios brutos gerados são colapsados no diff do PR por .gitattributes, mas os arquivos completos permanecem disponíveis.

Arquivos de código/configuração/documentação (artefatos de auditoria e PNGs listados nos diretórios próprios):

- `.env.production`
- `.gitattributes`
- `.vercelignore`
- `ARCHITECTURE.md`
- `README.md`
- `docs/BASELINES.md`
- `docs/DEPLOYMENT.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/PROFILE_API.md`
- `docs/REQUIREMENTS_CHECKLIST.md`
- `docs/STAGE5_DELIVERY.md`
- `docs/VISUAL_REVIEW.md`
- `index.html`
- `lighthouse.config.mjs`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `playwright.visual.config.ts`
- `public/_redirects`
- `scripts/lighthouse.mjs`
- `src/contracts/profile.ts`
- `src/features/catalog/detail-skeleton.tsx`
- `src/features/catalog/nft-detail-page.tsx`
- `src/features/profile/profile-page.tsx`
- `src/features/profile/queries.ts`
- `src/index.css`
- `src/main.tsx`
- `src/mocks/browser.ts`
- `src/mocks/commerce-db.ts`
- `src/mocks/handlers/profile.ts`
- `src/routes/nfts.$nftId.tsx`
- `src/routes/perfil.tsx`
- `tests/accessibility.spec.ts`
- `tests/deployment.spec.ts`
- `tests/fixtures/avatar.png`
- `tests/profile.spec.ts`
- `tests/visual.spec.ts`
- `tsconfig.e2e.json`
- `vercel.json`
- `vite.config.ts`
