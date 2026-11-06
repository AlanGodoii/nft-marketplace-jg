# Home desktop — fidelidade visual Kurio

Data:06/11/2026. Branch `feat/fidelidade-home-desktop`, criada da `origin/main` atualizada `ad6dfbc1141fa27aa41b2ec69632d49aea8ddc8c` (mergePR6, headEtapa5 `36bd750`). Etapas1–5 presentes; nenhuma rota removida. A base original era ad6dfbc; a main1b2edee, com PR7 integrado pelo proprietário, foi incorporada na resolução posterior dos conflitos.

## Referência e procedência

`docs/DESAFIO.md` foi lido integralmente, incluindo critérios e entrega. Arquitetura e matriz consultadas antes das modificações. O arquivo original do Figma é `Ff0SksUi7UFtPWUO8kyNtw`. O MCP retornou `Looks like you don't have edit access to this file` ao iniciar a sessão; não houve tentativas repetidas ou contorno do acesso. Por instrução do proprietário, a implementação segue os exports e prints desktop anexados.

`junglegaming.zip` acessível,21PNGs de telas/seções, incluindo5Home. Inventário com dimensões/tamanho/SHA-256 em [attachment-inventory.json](../reports/desktop-home/attachment-inventory.json). Todas as referências foram inspecionadas; somente a Home foi redesenhada. Os prints posteriores do proprietário confirmaram header pequeno, navegação central, linha inferior e composição geral no fundo marrom.

Os PNGs têm transparência em áreas de fundo. A comparação usa composição sobre `#140D0A`, não fundo preto do visualizador. As cinco referências originais estão em [reference](../reports/desktop-home/reference). Não são renderizadas como UI.

## Assets

Quatro WebPs derivados de recortes sem texto, total84.986bytes: Emerald450×450, Sage250×250, Neon250×250 e Golden250×250. Nenhuma imagem de terceiros ou gerada. Origem, hash e coordenadas em [manifest.json](../public/assets/figma/home/manifest.json); descrição em [README dos assets](../public/assets/figma/home/README.md).

- Emerald: hero, série Emerald Ape, banner1, artigo2.
- Sage: séries Sage Nomad/Cosmic Bloom/Violet Nomad, artigo3; reutilização conforme o exportProducts.
- Neon: séries Neon Vessel/Ivory Baron, banner2, artigo1.
- Golden: artigo4; não foi criado NFT nem alterado nome para incluí-lo no catálogo.

O hero carrega com prioridade alta e geometria450×450 reservada. Imagens abaixo da dobra usam lazy loading; URLs repetidas usam cache do navegador. Não há screenshot com botões/textos embutidos usado como interface. Os recortes250px têm resolução limitada pelo PNG fornecido; export individual em2× permanece recomendado.

## Composição e funcionamento

- Header desktop da Home: KURIO14px, navegação central, indicador laranja, busca com foco/Escape, quantidade real do carrinho, Entrar. Conta autenticada conserva perfil/carteiras/favoritos/pedidos e logout; não há dados privados no HTML estático.
- Hero: boas-vindas, título/descrição originais, EXPLORAR, arte verde, cantos24px e indicadores decorativos (sem simular carrossel inexistente).
- Catálogo: sidebar310px, gap48px, grid3colunas de258px no container1200px; coleção/rede com contagens reais da API. Inputs e selects anteriores continuam funcionais. Controle de preço/Aplicar, disponibilidade, busca, sort, atualização, erro/vazio/skeleton/paginação conservados.
- Abas `tab=all|new|trending` combinam com todos os filtros e reiniciam página; persistem na URL/histórico. `new` usa createdAt desde01/11/2026 (5NFTs no reset). `trending` é seleção demonstrativa de edições disponíveis (28no reset), explicitada no texto acessível e não apresentada como estatística real de vendas.
- Destaque vem de NFT disponível na página recebida, com link/identidade reais. Não anuncia desconto inexistente.
- Banners navegam para catálogo/aba. Diário tem4cards originais e diálogo que identifica a prévia editorial fora do escopo. Newsletter valida email, mas informa indisponibilidade e não envia/armazena. Suporte/redes/atividade fora de escopo exibem feedback explícito, sem href falso ou sucesso fictício. Coleções e links da conta são rotas/filtros reais. Contatos de layout são rotulados ilustrativos; carteiras continuam simuladas.

## Preservação técnica e mobile

Mudanças visuais ficam sob `.home-desktop` e media query `min-width:1024px`. `useDesktop` assina matchMedia com limpeza; renderização mobile usa header/hero/footer anteriores, e não monta as novas seções abaixo da dobra. Não houve redesign mobile.

API mantém `image.src`/galerias existentes; `desktopSrc` opcional é aplicado à Home desktop. Enriquecimento de leitura de persistência antiga conserva NFTs/contas/pedidos/estoque, sem reset/migração destrutiva. Não há dados de catálogo fictícios nos componentes/Axios. `facets` opcional traz totais globais por coleção/rede (12cada no reset), não contagens decorativas do print. Parâmetros, AbortSignal, Query keys e Decimal preservados. Preços ETH seguem strings; nenhuma operação financeira nova em number.

Checkout, pedidos, perfil, carteiras, favoritos, Socket.IO, APIs privadas e contratos financeiros não foram reescritos. `AuthActions` recebe apenas opção de apresentação `showName`, padrão anterior mantido. Os36IDs, nomes, preços, edições e estoques iniciais foram conservados.

## Diferenças deliberadas e pendências

1. O catálogo oficial ilustra9cards com nomes/preços/coleções diferentes. A aplicação mantém6por página,36NFTs,3coleções reais e ordenação `recent`. `?pageSize=9` já é suportado pela API/URL, mas não altera o padrão existente. Abaixo da dobra as alturas diferem por esse conteúdo.
2. Filtros combinados, campos precisos, disponibilidade, busca e feedback acrescentam controles funcionais ao mockup. A sidebar não copia as9categorias nem contagens inventadas do print.
3. Não há camadas individuais de logo/vetores sociais/arcos promocionais. KURIO utiliza tipografia local, ícones de navegação reutilizam Lucide, redes usam siglas/textos acessíveis. Isso não é equivalência exata aos vetores do Figma. Exportar esses vetores manualmente.
4. Artes recortadas250px podem perder nitidez em zoom; hero450px foi preservado. Reutilização nos banners/artigos aproxima os enquadramentos, mas não substitui os exports de cada layer.
5. Não foram redesenhados mobile, detalhe, carrinho, checkout, autenticação ou conta. Imagens/galerias dessas telas continuam pendentes nas tarefas próprias.
6. Comparação visual humana das referências e screenshots não é medição de equivalência pixel a pixel ao Figma. Baselines verificam regressão da implementação revisada, não conformidade integral do desafio ou nota.
7. O deploy existente corresponde a `ad6dfbc`; esta branch não está publicada. A validação HTTPS anterior está documentada no [PR7](https://github.com/AlanGodoii/nft-marketplace-jg/pull/7). Não declarar as alterações visuais publicadas até validar uma implantação do novo SHA.

## Validação local e publicação

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm run build:demo
npm run dev
# Em outro terminal, com Chromium Playwright instalado:
npm run test:e2e -- --workers=2
npm run test:visual -- --workers=1
npm run test:desktop -- --workers=1
```

Para comparar o build otimizado: `npm run preview -- --host 127.0.0.1 --port 4176`. Defina `TEST_BASE_URL=http://127.0.0.1:4176` nos comandos de testes. Em Linux com Chromium do sistema, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. Snapshot update não é comando de validação. As baselines utilizam Linux/Chromium155; em Windows, compare no WSL/ambiente Linux compatível ou revise conscientemente uma base específica da plataforma, sem sobrescrever as evidências Linux.

Vercel: importar a branch deste PR como Preview, manter `npm run build:demo`, saída `dist`, configuração SPA/MSW existente. Após revisão e merge **pelo proprietário**, a integração Git da Vercel publica main automaticamente. Também é possível selecionar a branch diretamente em New Deployment, sem merge. Confirmar Source/SHA e validar HTTPS/refresh/compra/socket antes de promover. Não apagar/resetar storage para obter screenshots da conta real; testes isolam seus próprios perfis.

## Reproduzir Lighthouse Home desktop

Após build demo e preview4176, sem outros testes de navegador em execução:

```sh
KURIO_LH_PROFILE=desktop CHROME_PATH=/usr/bin/chromium node node_modules/lighthouse/cli/index.js http://127.0.0.1:4176/ --config-path=lighthouse.config.mjs --output=json --output=html --output-path=reports/desktop-home/lighthouse/home-desktop-1 --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"
```

Repetir com sufixos2e3, sem alterar o cenário. Mesma configuração oficial já versionada (dense4G desktop, simulate, storage reset). O caminho CHROME_PATH depende da instalação local. O comando npm run lighthouse original continua disponível para os12cenários completos; esta fatia mede apenas a Home desktop solicitada.

## Resultados efetivos

Aplicação final validada: `f1cb94587daf65ccd73d2f855da4bd7a75373702`; commits posteriores de snapshots/documentação não alteram a aplicação. Node24.22.1, Chromium155.0.8059.79, Linux, quota2CPUs. JSON consolidado: [validation-summary.json](../reports/desktop-home/validation-summary.json).

| Verificação | Resultado real |
|---|---|
| Baseline inicial em mainad6dfbc |8/8Home/rotas/componentes,27.8s. |
| TypeScript, lint, build e build:demo finais |Todos código0; [checks.json](../reports/desktop-home/checks.json) e logs individuais. Dois avisos FastRefresh preexistentes; aviso futuro Vite/__dirname mantido. |
| Suíte funcional completa em dev,2workers |**212/213aprovados,1timeout,18.1m**. Timeout30s em acesso/refresh das rotas privadas desktop durante sobreposição com visual1worker, total3browsers/2CPUs. Não afirmar213/213 em uma rodada. Relatório completo/trace preservados. |
| Preview otimizado, desktop/mobile,2workers, sem outra suíte |**45/45aprovados,1.6m**:34catálogo +7Home +4navegação/refresh. O caso do timeout passou desktop8.3s/mobile7.1s, sem ampliar limite ou remover asserções. Inclui busca restaurada do header. |
| Home após calibração final do hero, preview1worker |**7/7aprovados,18.2s**; imagens/AXE/overflow em1280/1440/1920, conta/carrinho/busca/URL/abas/recuperação de persistência antiga/editorial. |
| Comparação inicial das12baselines antigas |11/12idênticas; somente Home1440divergiu pela alteração intencional. |
| Comparação estrita final das quatro telas em390/768/1440 |**12/12aprovadas,22.2s**, updateSnapshots:none, maxDiffPixels:0, sem máscaras.11PNGs anteriores byte a byte preservados; somente Home1440atualizada. |
| Novas baselines Home desktop1280/1440/1920 |**3/3aprovadas,8.8s**, comparação estrita após criação/revisão. |
| Lighthouse Home desktop,3execuções sequenciais |Medianas **P99/A100/BP96/SEO92**, iguais nas3amostras. LCP899.3ms/CLS0.000176/TBT0ms. Todas as metas deste cenário atingidas. Sem E2E concorrente. |
| Capturas reais do build,3larguras |Sem pageerror e sem overflow; todas as imagens visíveis carregadas. Arquivos em screenshots/ e retângulos em geometry.json. |
| Publicação desta revisão |**Não realizada/validada.** Produção anterior continua separada; conferir SHA após publicar a branch. |

A rodada integral foi executada durante ajustes CSS; o prefill do header e a calibração final foram verificados depois no preview, conforme as duas linhas correspondentes. Isso não equivale a uma segunda execução integral limpa no SHA final. Não há erro funcional identificado nos cenários recuperados; permanece registrada a limitação de timeout da rodada completa.

### Evidências e comparação visual

- [Home1440completa](../reports/desktop-home/screenshots/home-desktop-1440.png), [1280](../reports/desktop-home/screenshots/home-desktop-1280.png), [1920](../reports/desktop-home/screenshots/home-desktop-1920.png).
- Referência versus aplicação: [header](../reports/desktop-home/comparisons/header.png), [hero](../reports/desktop-home/comparisons/hero.png), [catálogo](../reports/desktop-home/comparisons/catalog.png), [banners](../reports/desktop-home/comparisons/promos.png), [Diário](../reports/desktop-home/comparisons/blog.png), [footer](../reports/desktop-home/comparisons/footer.png).
- Hero1160×450, arte450×450. A calibração por tinta colocou título nas mesmas linhasy88/y158 e descriçãoy218 do PNG; CTAy315–354. Antialiasing difere até1px vertical nas letras. Método/caixas em hero-alignment.json; não é um score global de equivalência ao Figma.
- Preservação das11baselines antigas: [preserved-baselines.json](../reports/desktop-home/preserved-baselines.json). Referências transparentes compostas sobre o fundo do app; não foram deformadas para esconder diferenças.
- Relatórios HTML completos em ZIPs `playwright-*.zip`, junto de logs/JSONs. Extraia em `work/qa-report` e rode `npx playwright show-report work/qa-report/playwright-functional`; traces independentes podem ser abertos com `npx playwright show-trace reports/desktop-home/traces/private-navigation-timeout.zip`.

### Falhas intermediárias e tratamento

Os logs originais estão em intermediate-logs.zip; nenhum resultado anterior foi convertido em aprovação. Primeiras rodadas encontraram nomes duplicados de sessão, ARIA inadequada em indicadores/siglas sociais e expectativa incorreta de6novosNFTs (as datas reais geram5), corrigidos. Execução inicial de catálogo teve40pass/2falhas; teste novo inicialmente2pass/5falhas; após correções7/7passaram. A primeira tentativa integral foi interrompida com123pass/4falhas/2interrompidos/84nãoexecutados devido a quatro asserções ainda esperando o título antigo. Asserções passaram a aceitar o título original desktop e o texto mobile preservado, sem eliminar verificações.

A rodada integral definitiva teve o timeout descrito acima; o trace está entregue e a navegação foi repetida no preview sem alterar o limite30s. Uma tentativa de seleção de snapshot com grep excessivamente ancorado não encontrou testes; corrigido o filtro antes da execução1/1. Baselines não foram atualizadas em lote: somente Home1440 e três novas larguras.

Ao copiar o relatório HTML completo, o linter tentou analisar os bundles minificados de terceiros do TraceViewer. O relatório completo foi arquivado em ZIP com HTML/dados/viewer intactos; nenhum script/regra de lint foi desabilitado. Depois disso todos os checks finais passaram. Extraia relatórios em work/ (ignorado), mantendo bundles gerados fora do código-fonte auditado.

Lighthouse não foi repetido para detalhe/mobile; a mediana84anterior do detalhe mobile continua pendente.401anônimo no console e robots.txt com fallbackHTML ainda limitam BestPractices/SEO e não foram mascarados.



## Arquivos principais criados/modificados

| Camada | Arquivos |
|---|---|
| Assets |public/assets/figma/home/{emerald-ape,sage-nomad,neon-vessel,golden-beat}.webp,manifest.json,README.md; scripts/extract-home-assets.py |
| Layout |components/layout/desktop-home-header.tsx,home-footer.tsx(novos); header.tsx,footer.tsx,main-layout.tsx; lib/use-desktop.ts(novo); index.css |
| Home |features/catalog/home-page.tsx; components/hero.tsx,catalog-filters.tsx,catalog-toolbar.tsx,nft-card.tsx; home-editorial.tsx(novo) |
| Contratos/API |contracts/catalog.ts,nft.ts; mocks/fixtures.ts,db.ts,handlers/nfts.ts. Endpoints existentes mantidos; novos campos opcionais e filtrotab, sem recurso privado novo. |
| Autenticação |features/auth/auth-actions.tsx: somente apresentação opcional do nome; mutations/sessão/caches anteriores preservados. |
| Testes |desktop-home.spec.ts,desktop-visual.spec.ts(novos),playwright.desktop.config.ts(novo); visual.spec.ts e4PNGs; home/commerce/checkout/deployment/profile/realtime: somente expectativas do título/medidas desktop atualizadas, asserções de negócio mantidas. |
| Configuração |package.json(script test:desktop),playwright.config.ts(separar visualnovo),tsconfig.e2e.json,.gitattributes(artefatos gerados). Nenhuma dependência financeira/deploy/ambiente alterada. |
| Documentação |README,ARCHITECTURE,docs/{CATALOG_API,DEPLOYMENT,IMPLEMENTATION_PLAN,REQUIREMENTS_CHECKLIST,DESKTOP_HOME_FIDELITY}.md; relatórios/PNGs/ZIPs em reports/desktop-home. |

O inventário completo, incluindo todos os artefatos gerados, está em reports/desktop-home/files.txt. Não houve recriação do projeto, forcepush, reset destrutivo, exclusão de branches ou merge na main.
