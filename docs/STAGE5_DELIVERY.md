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
