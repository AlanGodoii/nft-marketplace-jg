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
