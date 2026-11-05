> Atualização de 05/11/2026: este documento descreve a estrutura anterior à integração.
> A home agora recebe dados e controles reais de Router/Query/Axios/MSW.
> Filtros já não ficam desabilitados na execução normal. Consulte CATALOG_API.md e ARCHITECTURE.md.
> As observações de falta de acesso ao Figma abaixo são históricas; a auditoria posterior acessou a cópia indicada pelo usuário.

# Página inicial Kurio

Implementação estrutural baseada nas dimensões e cores fornecidas pelo usuário.
A fidelidade aos frames Desktop / Início e Mobile / Início permanece pendente:
o acesso a www.figma.com foi bloqueado pela política de rede (CONNECT 403).
Textos, composição e breakpoints são provisórios até a inspeção dos frames.

## Organização

- src/features/catalog/types.ts: contratos de NFT, destaque, filtros e paginação.
- src/features/catalog/home-page.tsx: composição da tela.
- src/features/catalog/components: Hero, filtros, toolbar, grid, card e paginação.
- src/components/layout: Header, Footer e layout com Outlet.
- src/index.css: tema escuro restrito à home e regras responsivas.
- public/assets: fonte local e inventário dos assets pendentes.

HomePage recebe catalog, featured, controls e onRetry por propriedades.
RemoteData distingue unavailable, loading, error e success.
Não há endpoint presumido, itens fictícios na aplicação ou carregamento infinito.
A integração futura pode mapear uma consulta TanStack Query para esses estados.
Sem dados, filtros, busca, ordenação e paginação ficam desabilitados.
Fixtures artificiais existem exclusivamente em tests/fixtures para validação.

Em 1440px: container de 1200px, Header interno com 45px de altura,
Hero de 1200×450px, área da imagem 450×450px, sidebar de 310px,
intervalo de 48px e catálogo de 842px. Grid com três cards de 258px
e intervalos de 34px. Os cards só aparecem com dados reais.
Em telas menores, o grid adapta para duas ou uma coluna,
os filtros podem ser expandidos e o menu mobile é operável por teclado.

## Validação reproduzível

- npm run build
- npm run lint
- npx playwright install chromium
- npx playwright test --workers=1

O Playwright inicia o Vite automaticamente se necessário.
No ambiente da nuvem, foi usado o Chromium já instalado com
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium.
TEST_BASE_URL permite apontar para outro servidor de desenvolvimento.
Capturas e resultados ficam em node_modules/.cache/playwright-results (ignorado).

Os testes cobrem 390, 768 e 1440px, dimensões desktop, estados do catálogo,
cards com três colunas e 258px, menu por teclado e preservação das nove rotas.
Não substituem a comparação com o Figma nem a integração com a API.
