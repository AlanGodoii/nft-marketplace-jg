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
