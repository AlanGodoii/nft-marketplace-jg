# Etapa 5 — publicação, perfil e finalização

Base: `origin/main` **eb156f5fd10f949539824e4818ccdaddc6dc855a**, já contendo PR5 e commits c52f872/e43d35d/9ca6d4c. Branch: `feat/etapa5-finalizacao`. Enunciado lido integralmente; matriz, plano, arquitetura e contratos E3/E4 consultados antes das alterações.

## Baseline

TypeScript, lint e build: código0. Lint: três avisos Fast Refresh preexistentes. Oito testes de catálogo, login/sessão, compra completa e handshake/nft.updated em desktop/mobile: **8/8 aprovados (44.0s)**. Logs locais em `work/stage5/baseline-*`.

## Checkpoint A — publicação

Configuração Vercel, fallback Netlify, flags públicas de produção e instruções em [DEPLOYMENT.md](DEPLOYMENT.md). **URL pública: não publicada/não validada nesta execução.** Vercel não está conectado e auxiliares obrigatórios do Sites estão indisponíveis no executor. Não há afirmação de deploy concluído. A validação local do build será registrada com seus resultados reais.

## Bloqueios externos

O Figma MCP retornou limite de chamadas do plano Starter ao consultar metadata da página0:1 nesta etapa. A sessão foi criada, mas não há novo contexto visual completo. Assets originais já retornavam403 nas etapas anteriores. Não foram substituídos por arte aleatória. Comparações disponíveis, diferenças e exports necessários serão discriminados na documentação visual.

Validação A no build otimizado local: **5/5 aprovados (26.3s)** — acesso direto/refresh das nove telas e favoritos, compra completa e handshake/evento em desktop/mobile. Isso comprova a aplicação no preview; não comprova a configuração da Vercel nem uma URL pública. Log: work/stage5/A-tests.log.
