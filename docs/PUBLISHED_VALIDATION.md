# Validação da implantação pública — 06/11/2026

URL: **https://nft-marketplace-jg-psi.vercel.app/**

Janela da suíte: **06/11/2026, 01:45:04–01:47:17, America/Sao_Paulo**. Resultado: **32/32 testes aprovados em 2,2 minutos**, dois workers, desktop1440×1000 e mobile390×844. Sem falhas, skips ou retries. Esta evidência é da URL HTTPS real; não é o preview local da Etapa5.

## Revisão publicada

- Branch indicada no painel Vercel: **main**, implantação **Production / Current**, identificador visual **BajTQEA68**.
- Commit Source: **ad6dfbc1141fa27aa41b2ec69632d49aea8ddc8c** — merge do PR#6.
- Head final da Etapa5: **36bd750f6714152cff53989be33daf54004bfb4a**, pai desse merge e presente no histórico da main. As árvores Git do merge e do head da etapa são idênticas.
- Evidência da associação Vercel→Git: duas capturas fornecidas pelo proprietário (Deployment Details e o commit aberto pelo link Source), mais confirmação textual do SHA completo. Metadados GitHub/Git corroboram commit, pais e merge. O site não tem endpoint público de SHA; GitHub Deployments/status checks não expuseram essa associação. Não se confundiu x-vercel-id ou ETag com SHA Git.
- O HTML inicial e final da URL permaneceu byte a byte igual: SHA-256 **4a9860f8ce0511ff71916ce3db8bc7825ddbb5fa3f5cc1ff86a0413e4733c083**.

A origem publicada corresponde à versão mais recente da Etapa5 verificada no remoto. Este PR de validação não altera src, contratos da aplicação, Vite ou vercel.json e não requer uma correção funcional da implantação observada. Não foi feito deploy ou merge automático pelo assistente.

## Matriz de validação solicitada

| Item | Estado | Evidência efetivamente executada |
|---|---|---|
| Home, login e detalhe | VALIDADO | Home com6cards/36NFTs via API, login inválido/válido e detalhe nft-002 usado na compra. Home smoke sem pageerror. |
| Acesso direto e refresh das nove telas | VALIDADO |20casos: as nove rotas e favoritos ×2viewports; HTTP200, heading correto e refresh novamente200. Rotas privadas exigem sessão. |
| MSW/APIs simuladas em produção | VALIDADO | Service Worker activated com escopo HTTPS raiz; resposta de /api/nfts com fromServiceWorker=true e total36. Endpoints de conta/carrinho/cotação/pedidos/cenários exercitados no navegador. |
| Login e sessão | VALIDADO | Credencial inválida rejeitada, login de Alice, identidade mantida após refresh, logout e acesso privado redirecionado ao login. |
| Carrinho e checkout | VALIDADO | Adição pelo detalhe, carrinho visitante mantido após refresh, login com retorno ao checkout/mesclagem, conexão simulada, revisão e aceite. Cotação0.306ETH para1unidade, sem cupom. |
| Pedido confirmado e recibo | VALIDADO | POST /api/orders201, pending sem recibo, depois confirmed pela API/evento. Snapshot0.306ETH, carrinho vazio, recibo recuperado após refresh e somente1pedido. |
| Socket.IO/eventos/reconexão | VALIDADO | Cliente real data-transport=websocket, handshake Engine.IO/namespace; nft.updated altera preço e invalida aceite, nova cotação0.506ETH/checkbox desmarcado/ACK aceito. Desconexão durante pending, liquidação offline e reconexão recuperam mesmo ID por GET REST, sem duplicar pedido. |
| Isolamento entre usuários | VALIDADO | Alice possui favorito/bio/carrinho/pedido; Bob vê próprios perfil/carteira, favoritos/carrinho vazios e histórico sem pedidos. GET do pedido de Alice retorna404 para Bob. Evento privado da sessão Alice é ignorado; apenas1socket ativo. |

Os controles de cenário agem somente no banco MSW do contexto descartável do navegador. Não foram alterados dados de outros visitantes. A compra e as carteiras são simulações; não houve transação de blockchain ou pagamento real.

## HTTP, worker e evidências

Verificação adicional por HTTPS: dez caminhos SPA responderam200/text-html com o entrypoint da aplicação. `/mockServiceWorker.js` respondeu200/application-javascript, Cache-Control `no-cache, no-store, must-revalidate` e Service-Worker-Allowed `/`. O acesso não exigiu autenticação da plataforma Vercel. Fetch HTTP isolado de /api não comprova a API MSW: a validação foi feita dentro do navegador.

Evidências versionadas em [reports/published-validation](../reports/published-validation):

- summary.json:32resultados individuais, duração, horário, ambiente, proveniência e hash do HTML.
- http-routes.json e home.headers.txt: status e headers reais.
- playwright.log e html/index.html: log e relatório HTML completo da execução. Visualize com `npx playwright show-report reports/published-validation/html`.
- home-desktop.png, receipt-desktop.png e receipt-mobile.png: capturas reais. Não são assets do Figma nem baselines novas.

## Reprodução

```sh
npm ci
npx playwright install chromium
TEST_BASE_URL=https://nft-marketplace-jg-psi.vercel.app/ npm run test:published -- --workers=2
```

PowerShell:

```powershell
$env:TEST_BASE_URL="https://nft-marketplace-jg-psi.vercel.app/"
npm run test:published -- --workers=2
```

Os32casos são uma suíte separada; os206testes locais anteriores continuam listados, sem modificar suas asserções ou limites. Não foram reexecutados os206nem Lighthouse nesta rodada pública. Testes públicos têm limite60s/asserções10s para CDN/TLS/worker frio; os casos efetivos terminaram abaixo de20s. Nenhuma falha foi ocultada elevando timeout após reprovação.

Cada caso usa perfil/contexto Chrome exclusivo e reset MSW. Trace com screenshot/snapshot/source é anexado se houver falha. Não houve falha na suíte final para gerar um novo trace de erro. Credenciais de fixture: Alice/Bob em @kurio.test, senha Kurio123!.

## Ambiente e resolução do bloqueio TLS do executor

Node24.22.1, Chromium155.0.8059.79, Linux e proxy HTTPS configurado pela plataforma. O curl validava a cadeia, mas Chromium inicialmente retornou ERR_CERT_AUTHORITY_INVALID por não conhecer a CA pública desse proxy. Isso não foi classificado como defeito de certificado da Vercel.

Não se desativou TLS nem usou ignoreHTTPSErrors. O store global do usuário não foi alterado. Uma CA já configurada pelo ambiente foi registrada apenas no perfil descartável dentro do workspace, limitada ao DNS da implantação, utilizando o banco de certificados do Chrome. Os32testes passaram com ignoreHTTPSErrors=false.

Esse suporte é opcional: em uma máquina com acesso normal à Vercel não se define CA/proxy. Em executor corporativo compatível, KURIO_USE_ENV_PROXY=true usa HTTPS_PROXY/HTTP_PROXY herdado; KURIO_TEST_CA_CERT aponta para uma CA autorizada pelo operador. O fixture rejeita certificados que não sejam CA e mantém a restrição ao hostname. Esse caminho foi validado com Chromium155; não se promete compatibilidade com schemas internos de outras versões.

Preflight: o NSS legado do usuário não continha a CA desse proxy, e configurar um NSS no diretório XDG não substituiu a preferência do Chromium pelo store legado. A importação pela UI headless não ofereceu filechooser. A solução final foi o perfil isolado; nenhum desses bloqueios foi apresentado como teste funcional aprovado. O lint inicialmente confundiu o callback Playwright chamado use com React use; callback renomeado para provide, sem desabilitar regra. Nenhum problema funcional da aplicação foi encontrado nos cenários desta rodada.

## Limitações e riscos restantes

A disponibilidade foi comprovada somente durante a janela observada; manter domínio/deployment ativos durante a avaliação é responsabilidade operacional contínua. Assets originais/fidelidade integral e a meta local anterior de Performance84 no detalhe mobile continuam pendentes. Não se atribui esse número ao host público sem nova auditoria. Validação funcional não garante nota da Jungle Gaming ou segurança/backend de produção.

## Verificações do PR de validação

TypeScript, lint, build padrão e build:demo executados nesta branch: código0. Lint mantém dois avisos FastRefresh preexistentes em button.tsx/badge.tsx; aviso futuro __dirname do Vite continua visível. Nenhuma alteração em src, vite.config.ts, vercel.json ou flags de produção. npm run test:e2e -- --list preserva206casos locais; npm run test:published -- --list encontra32casos públicos separados.
