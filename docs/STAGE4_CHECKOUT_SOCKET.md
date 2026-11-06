# Etapa 4 — checkout, pedidos, carteiras e Socket.IO

> Atualização de integração: PR3 já integrado à main; PR4 foi integrado à branch da etapa3. A correção está na branch fix/integrar-etapa4-main, com novo PR para main. Histórico, preservação do código e verificações em [STAGE4_MAIN_INTEGRATION.md](STAGE4_MAIN_INTEGRATION.md). As referências anteriores a PRs abertos são históricas.

## Base e dependência do PR

Branch `feat/etapa4-checkout-pedidos-socket`, criada diretamente de `c52f87233b061714adecbf448e6007481e6a2a04` (etapa3). O commit foi confirmado no histórico com git merge-base. Main estava em2593a26 e PR3 ainda aberto: este trabalho depende do PR3, sem merge automático e sem alterações diretas na main.

Enunciado DESAFIO lido integralmente antes de editar; matriz/plano/arquitetura/STAGE3_API e contratos/hooks/mocks/UI/testes consultados. Base limpa. Baseline: typecheck0, lint0 (6avisos preexistentes), build0 e6 testes de catálogo/login/merge em desktop/mobile aprovados(30.4s). Logs locais: work/stage4/baseline-*.log.

## Checkpoint A — carteiras

- GET /api/wallets: lista somente as carteiras da sessão autenticada.
- POST /api/wallets: cria principal/secundária;201,400,401,409,500.
- PATCH /api/wallets/:walletId: edita campos; carteira de outra conta responde404.
- POST /api/wallets/:walletId/connection: `{action:'connect'|'disconnect'}`. Retorna status connected/refused/disconnected, walletId, network e connectionId. Esta operação adicional fornece a simulação de conexão, sem extensões reais.

Schemas compartilhados em src/contracts/wallet.ts. Endereço Ethereum/Polygon exige0x+40hex; Solana usa base58 com32–44caracteres. Carteiras possuem papel único por conta e endereço único na rede. Dados do colecionador seguem campos do layout (nome de exibição/usuário/perfil, e-mail, indicação, ENS); carteira secundária opcional. Formulários RHF/Zod associam erros aos campos. A conexão é vinculada ao hash da sessão e versão da carteira; não serve como pagamento real.

Persistência aditiva em kurio.mock.commerce.v1, com defaults para migrar a etapa3 sem apagar sessão/carrinho/favoritos. Alice e Bob possuem carteiras principais Ethereum distintas de demonstração. Nenhuma carteira real ou valor foi utilizado. Chaves Query privadas por usuário; mutations sem retry e callbacks protegidos pela geração de identidade existente. Logout/troca remove o prefixo privado.

Cenários via /api/__mock/configure: faults para wallets.read/create/update/connection, e walletConnection connected/refused/disconnected. Reset restaura carteiras e conexões junto dos recursos anteriores.

## Planejamento dos próximos checkpoints

B: cotação persistida com snapshot, dados validados, seleção compatível de carteira/rede e aceite explícito; reutilizar cálculos Decimal existentes.
C: pedidos persistentes pending/confirmed/rejected, chave estável por tentativa/usuário, recuperação e recibo imutável; carrinho só muda em confirmação efetiva.
D: cliente socket.io-client real através de WebSocket MSW, autenticação, eventos tipados/versionados, deduplicação e reconciliação REST.
E: regressão integral, build padrão/demo, tipos/lint e validação no build otimizado.

Binding investigado: @mswjs/socket.io-binding0.2.0 declara peer msw^2.10.2; o projeto usa MSW3.0.3. Não foi forçada uma dependência incompatível. A escolha efetiva e os resultados do transporte serão registrados no checkpointD.

## Figma e pendências externas

Consultados contexto e screenshots dos frames Pagamento desktop11:2862/mobile16:748, Confirmação11:4385 e Carteiras9:1670. Preservar os tokens e componentes existentes. Assets originais permanecem bloqueados403, sem substituições arbitrárias. Perfil completo, baselines de regressão visual, Lighthouse e deploy público continuam pendentes; não são concluídos por esta documentação.

### Verificação A

Typecheck passou; lint passou com5avisos restantes (um placeholder substituído). Testes:6/6 aprovados, desktop/mobile,29.0s. Foram corrigidos o envio de id/version como defaults do formulário de edição (schema estrito rejeitava) e uma espera ausente no teste de logout. Rodadas intermediárias tiveram2falhas/4aprovados e1falha/5aprovados; resultados não foram ocultados. Casos incluem criação/edição/refresh, endereços inválidos,401/400/404/409, isolamento e500/retry, recusa/desconexão simuladas.

## Checkpoint B — cotação e revisão

POST /api/checkout/quote recebe walletId, network, collector e seleção items[{itemId,quantity}]. Valida sessão/conexão da sessão, versão da carteira, rede compatível de todos os itens, quantidades inteiras presentes no carrinho, estoque/edição e cupom. Responde snapshot imutável e privado de itens/carteira/colecionador, valores Decimal reutilizados da etapa3, fingerprint, id opaco e expiresAt. Quotes expiradas são descartadas; expiração/alterações relevantes exigem novo aceite.

O checkout permite selecionar subconjunto e quantidades para preservar itens não comprados. Revisão em diálogo exige checkbox explícito. Antes do envio, uma nova consulta de cotação compara conteúdo/versões/valores; diferenças são informadas e o aceite é limpo. O pedido ainda não era enviado neste checkpoint isolado; o envio será adicionado em C. A apresentação monetária só utiliza strings retornadas pela API.

Controles adicionais de cenário: POST /api/__mock/nft {nftId,editionId,price?,remaining?}; quoteTtlMs; networkFeeEth; expireCoupon. Valores monetários validam strings com até18casas. A alteração do NFT será integrada ao transporte em D.

Verificação B: typecheck e lint aprovados (4avisos Fast Refresh preexistentes restantes).8/8 testes B aprovados em desktop/mobile(40.2s). A rodada inicial A+B teve12aprovados/2falhas devido ao botão de cupom sem type=submit; corrigido sem relaxar asserções. Testes cobrem retorno de login, cupom e valores exatos, campos/compatibilidade/conexão, alteração de preço exigindo novo aceite, estoque409 e falha de rede/retry preservando carrinho. Hooks de revisão foram ajustados para invalidação por eventos de formulário e versão do recurso, sem avisos novos de lint.

## Checkpoint C — pedidos, recuperação e recibo

- POST /api/orders recebe {quoteId,connectionId} e header Idempotency-Key(8–128caracteres). Sessão deriva o proprietário. Mesma chave/conteúdo recupera mesmo pedido200; criação201; conteúdo diferente409. Validação e revalidação acontecem antes de criar, dentro da transação protegida por Web Locks quando disponível.
- GET /api/orders/:orderId consulta somente o pedido da conta;404 para outro usuário e401 sem sessão. GET /api/orders lista o histórico privado, necessário à recuperação e navegação sem um ID selecionado.
- POST /api/__mock/orders/:orderId/settle {status:confirmed|rejected} controla deterministicamente a simulação. Estados terminais não regridem; repetição do mesmo resultado não reaplica efeitos.

A criação persiste pending e a associação usuário+chave+corpo na mesma transação. Confirmed/rejected são terminais; timeout/rede são estados de transporte separados. Outcome/due time persistidos permitem restaurar processamento após refresh. orderOutcome(pending/confirmed/rejected), orderDelayMs e orderResponseDelayMs controlam os cenários. O último atrasa a resposta *depois* de gravar o pedido, reproduzindo timeout Axios10s sem criar nova compra no retry.

O cliente salva a tentativa em sessionStorage por usuário antes do POST, incluindo a mesma chave e corpo. Falha de transporte preserva ambos; refresh oferece recuperação explícita com a mesma mutation, sem retry automático. Uma nova tentativa só é liberada após erro definitivo de não criação ou consulta de estado terminal e ação explícita do usuário. Clique repetido é protegido por refs síncronas, além do estado de mutation; a API também garante idempotência concorrente.

Recibo vem exclusivamente do snapshot persistido do pedido confirmed: itens/edições/quantidades/preços, subtotal/desconto/taxa/total, carteira/rede, referência simulada e ID. Alterações de catálogo não mudam o histórico. Pendente/recusado nunca exibem recibo de sucesso.

Vendas confirmadas constituem o ledger de estoque. O estoque público é derivado da base e dos snapshots confirmados. Dessa forma, a mudança do estado do pedido e a remoção de quantidades no carrinho são gravadas juntas em um único documento persistido; refresh não pode aplicar um débito separado duas vezes. A disponibilidade é conferida novamente na liquidação, evitando vendas concorrentes acima do estoque. Itens não selecionados e quantidades adicionais são mantidos. Cada linha tem uma geração interna: remover e readicionar a edição durante processamento não transforma a linha nova em item da tentativa antiga.

Até a integração D, consultas periódicas acompanham pending; isso é somente REST e não é apresentado como Socket.IO. D substituirá esse mecanismo por eventos e reconciliação.

### Verificação C

Typecheck e lint aprovados (3avisos preexistentes de Fast Refresh restantes). A+B+C:30/30 testes aprovados em desktop/mobile(3.4m). Inclui compra integral via UI, pending/confirmed/rejected, clique repetido, concorrência de mesma chave, conflito de conteúdo, timeout real após criação(17.9s no caso completo), refresh/mesma tentativa, histórico imutável, estoque e remoção parcial sem efeitos duplicados, preço/cotação expirada e isolamento. Rodada anterior C:14aprovados/2falhas pelo uso de q em vez de search no teste do catálogo; a URL foi corrigida para o contrato existente, sem mudar o catálogo.

## Checkpoint D — transporte e sincronização

Integração escolhida: ws.link do MSW3 com adaptador do protocolo Engine.IO4/Socket.IO5 (namespace padrão, JSON, WebSocket). O cliente é socket.io-client4.8.4 sem parser/manager modificados, usando path /kurio-live/. A integração @mswjs/socket.io-binding0.2.0 foi avaliada e não instalada por declarar peer MSW^2.10.2 incompatível com3.0.3. Não houve downgrade/forçamento de peers.

O adaptador de rede em src/mocks/socket-server.ts implementa abertura Engine.IO, CONNECT Socket.IO com autenticação, eventos codificados42, ping/pong, fechamento e reconexão pelo Manager real. Não é EventEmitter ou callback local apresentado como transporte. App só é importada depois de worker.start, porque Engine.IO captura o construtor WebSocket ao avaliar o módulo. MSW3 normaliza o prefixo /socket.io/ ao comparar handlers; o path dedicado evita essa normalização e interferência com o WebSocket HMR do Vite.

Eventos tipados: nft.updated {eventId,type,resourceId,version,payload:Nft}; order.updated acrescenta userId,sessionId e payload:Order. A sessão Socket.IO é validada contra o mesmo estado de autenticação REST. Emissões privadas são filtradas por usuário e sessão válida; cliente repete essa verificação e verifica a geração de identidade. Não há tokens nos diagnósticos.

Cliente ignora IDs repetidos, versões anteriores e regressão de pedido terminal. Eventos efetivamente recebidos invalidam consultas Axios/Query (catálogo/detalhe/favoritos/carrinho/pedidos); nunca produzem um sucesso de compra no React. Checkout liga a revisão à versão recebida, invalida o aceite imediatamente e exige nova cotação. Resumo do carrinho também verifica a atualidade das versões dos NFTs antes de mostrar a cotação.

O acompanhamento periódico REST de C foi removido. Após reconectar, a sessão é revalidada pela API e consultas ativas públicas/privadas são canceladas/reconciliadas via REST; pedidos perdidos durante interrupção são recuperados sem nova criação. Refresh inicia as mesmas consultas com o estado persistido. Logout/troca desmontam listeners, encerram Manager/transport, impedem reconexão da sessão antiga e limpam cache privado.

Controles de rede: POST /api/__mock/socket {action:disconnect|resume}; GET /api/__mock/socket/stats retorna contagens de handshakes, frames/ACKs e somente recibos de eventos da sessão/usuário corrente. POST /api/__mock/socket/event injeta um evento tipado na camada de transporte, com audience:owner ou all para testar ataques/eventos de sessão errada. Nunca altera diretamente Query ou React. Controles só existem quando mocks estão habilitados; não são APIs de um backend de produção.

O transporte simulado é local ao runtime do documento, sem servidor WebSocket externo: o browser WebSocket é interceptado pelo MSW, portanto a prova usa conexão do cliente real, handshake/frames e ACKs de volta ao handler. Não suporta upgrade de polling, binários, rooms ou namespaces personalizados. Isso não impede os dois eventos JSON obrigatórios nem a reconexão real do cliente. Persistência é no navegador; não se promete sincronização de broadcasts entre dispositivos. O banco público relê snapshots persistidos nas consultas para reconciliação após alterações em outra aba.

O Vite agora ignora work/, relatórios e artefatos de teste no watcher. Foi observado page reload causado por HTML gerado no próprio Playwright; esse ajuste evita recarregamentos espúrios da aplicação e não remove testes nem altera seus limites.

### Verificação D

Typecheck/lint aprovados (3avisos preexistentes).16/16 testes de tempo real em desktop/mobile aprovados(1.9m), mais smoke de transporte4/4(28.7s). Provas observam data-transport=websocket no socket.io-client conectado, handshake Engine.IO/CONNECT e ACK codificado de volta ao handler; controles MSW somente emitem frames. O teste de pedido avança o relógio e verifica zero consultas periódicas antes de emitir order.updated; confirmação chega pelo evento seguido de consulta REST.

Cobertura: alteração de preço/cotação; catálogo/detalhe/carrinho; estoque esgotado; eventos antigos/repetidos; transição terminal protegida; interrupção, liquidação offline e reconciliação do mesmo pedido; refresh; troca A/B com encerramento do socket antigo e rejeição explícita de evento de sessão incorreta. Carrinho não é limpo novamente em replay.

Falhas intermediárias registradas:4/4 falharam antes da correção da inicialização,4/4 ainda falharam antes de corrigir o path normalizado; smoke após correção passou4/4. A primeira matriz ampliada teve13aprovados/3falhas; a seguinte14aprovados/2falhas. Foram corrigidas esperas por conexão pronta/ACK e verificação de diagnósticos antes de navegação completa (diagnósticos são por runtime). Um reload de fonte durante diagnóstico interferiu no teste desktop de reconexão; execução estável posterior passou. Limites e asserções de comportamento não foram relaxados.

## Checkpoint E — regressão, acessibilidade e falhas adicionais

Rascunhos válidos do checkout persistem por usuário/carteira/versão, com rede, seleção, quantidades e dados do colecionador. Não são cotações nem autorizam compra; após expiração/login, exigem reconexão/revisão. A seleção valida inteiros/limites pelo schema compartilhado e associa erros aos campos; seleção vazia não envia cotação.

Foram incluídos casos de expiração *durante* uma requisição privada com latência controlada, preservação do rascunho após login, mudança de taxa/cupom, perda de estoque durante processamento, geração da linha readicionada, erro500 de criação/consulta e recuperação. Carteiras/checkout/recibo são verificados em390/768/1440; teclado testa contenção/retorno de foco e aceite obrigatório, e movimento reduzido também cobre diálogo/backdrop no portal.

A precondição do teste legado de estoque defasado foi ampliada com interrupção explícita do socket. Isso preserva o teste original de rejeição REST quando um evento foi perdido. O novo teste conectado de estoque via Socket.IO cobre o comportamento atual de atualização imediata. Nenhum caso legado foi removido, desabilitado ou teve timeout aumentado; tests/catalog.spec.ts permanece sem alterações.

A liquidação de pedidos pela API de controle também exige a sessão proprietária; outro usuário recebe404. O backend emite order.updated na criação pending e nas transições terminais; retries da mesma tentativa não reemitem efeitos de negócio. Avisos de atualização de checkout mostram a edição afetada, seu preço e estoque, em vez de confundir a disponibilidade da edição original com a selecionada.

Falhas intermediárias E: primeira execução15aprovados/5falhas (foco/escopo de reduced-motion e uma precondição de expiração). Após correções,18aprovados/2falhas expunham a expiração antes da ação privada planejada no teste. O cenário passou a expirar a sessão enquanto checkout.quote está comprovadamente em voo, com latência800ms, garantindo a situação requerida. Repetição específica:10/10 aprovados(1.3m), incluindo os três tamanhos e ambos os projetos. Verificação final de tipos/lint passou;3avisos preexistentes restantes. Regressão integral/build/preview e inventário no fechamento final abaixo.

### Correções encontradas na regressão integral

Uma rodada foi interrompida para correção após137aprovados,5falhas,2interrompidos e30nãoexecutados. Traces preservados localmente em work/stage4/interrupted-regression. As falhas não foram descartadas: o recibo já abria automaticamente via socket quando dois testes C tentavam clicar atrás do modal; helpers REST precisavam aguardar a montagem da App após worker.start em uma navegação completa; e o transporte pausado precisava encerrar a tentativa depois da abertura Engine.IO, não enquanto CONNECTING. O teste de reconexão agora comprova que uma tentativa realmente ocorre durante a pausa antes de retomar.

As correções passaram8/8 casos repetidos em desktop/mobile com2workers(47.2s), sem ampliar timeouts. Os testes C passaram a observar diretamente o recibo entregue via Socket.IO, em vez de solicitar uma atualização manual já desnecessária. A suíte integral é repetida no código corrigido; números finais no fechamento abaixo.

### Recuperação com confirmação durante resposta atrasada

A revisão encontrou o caso em que o backend já confirma por evento/REST enquanto a resposta original do POST ainda não chegou: o carrinho é corretamente esvaziado, mas o acesso à tentativa precisa continuar visível. O checkout vazio agora oferece recuperação da mesma chave e histórico privado. Falha de transporte por si não remove itens; uma confirmação efetiva da simulação pode ocorrer durante a falha e deve ser recuperada, não repetida.

Foi acrescentado um caso específico em desktop/mobile, com orderDelayMs1200 e resposta11000ms, incluindo refresh com carrinho vazio e verificação de um único pedido confirmado. Repetição desse caso junto do timeout pending:4/4 aprovados(38.7s). Uma rodada integral sem falhas até então foi interrompida com78aprovados,2interrompidos e94nãoexecutados para incluir essa correção; não é contada como aprovação integral. A rodada definitiva contém176testes.


## Fechamento E4 — resultados finais em 05/11/2026 (America/Sao_Paulo)

Código funcional validado no commit **08484be**, sobre c52f872 (presente no histórico). Commits A b0d8ce5, B67a49cb, C8ddf9e9, D9a76769, E08484be. Documentação final em commit separado; main intacta. PR3 continua aberto/não integrado na conferência final, portanto o PR da etapa4 tem como base a branch da etapa3.

| Comando / cenário | Resultado efetivo |
|---|---|
| `npm run typecheck` | Código0; inclui fontes, testes e configuração Playwright. |
| `npm run lint` | Código0, sem erros; três avisos Fast Refresh preexistentes em perfil.tsx, button.tsx e badge.tsx. |
| `npm run build` | Código0; build padrão otimizado, aproximadamente1.5s. |
| `npm run build:demo` | Código0; mocks e transporte incluídos. Aviso futuro Vite configLoader/__dirname permanece visível. |
| `TEST_BASE_URL=http://127.0.0.1:5175 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --workers=1` | **176 passed (16.2m)**;106 anteriores +70 novos, desktop/mobile. Relatório HTML gerado e failedTests vazio. |
| `TEST_BASE_URL=http://127.0.0.1:4174 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium PLAYWRIGHT_HTML_OUTPUT_DIR=work/stage4/preview-report npm run test:e2e -- tests/checkout.spec.ts tests/realtime.spec.ts --workers=2 --output=work/stage4/preview-results` | **70 passed (3.6m)** no build otimizado;54 checkout/carteiras/pedidos e16 tempo real. Bootstrap MSW e cliente Socket.IO empacotados efetivamente testados, sem servidor privado. |

Falhas intermediárias e correções estão registradas nos checkpoints de docs/STAGE4_CHECKOUT_SOCKET.md, inclusive rodadas interrompidas137aprovados/5falhas/2interrompidos/30nãoexecutados e78aprovados/2interrompidos/94nãoexecutados. Somente a rodada definitiva176/176 é considerada regressão integral aprovada. Não foram ampliados timeouts ou removidos/desabilitados testes.

Logs locais: work/stage4/{E-types-final,E-lint-final,build-final,build-demo-final,final-all,preview-final}.log. HTML dev em playwright-report/index.html; HTML preview em work/stage4/preview-report. Traces intermediários em work/stage4/interrupted-regression; testes preservam trace em falhas. Artefatos gerados são locais e ignorados pelo Git; não equivalem a CI/deploy público.

O catálogo mantém36NFTs, filtros/ordenação/paginação/URL; tests/catalog.spec.ts e tests/home.spec.ts não foram alterados nesta etapa. O caso legado de estoque defasado explicita a interrupção do socket para continuar exercitando rejeição REST quando um evento é perdido. Os casos novos também exercitam estoque atualizado pelo socket conectado.


### Conferência final complementar

- `node work/stage4/visual-and-terminal.mjs`: código0. Jornada real no preview em390/768/1440, com12capturas de carteiras/checkout/revisão/recibo. Conferência visual amostral realizada; sem overflow indevido nos testes. Assets continuam como slots identificados, sem arte inventada; isso não é regressão visual com baseline ou fidelidade integral ao Figma.
- Nas três larguras: transporte websocket conectado; compra confirmada pela API; exploração explicitamente simulada com feedback; rejeição terminal permaneceu rejected após tentativa de confirmed(409), carrinho recusado preservado; APIs privadas/controladores sem sessão retornaram401; recibo histórico manteve total0.306ETH. Evidência local: work/stage4/visual-and-terminal.json e visual-final.log.
- Instalação isolada: `git archive 08484be` extraído em work/stage4/clean-checkout; `npm --cache /workspace/nft-marketplace-jg/work/npm-cache ci` passou,375pacotes em6s; `npm run typecheck` e `npm run build:demo` passaram, build2.52s. Logs: work/stage4/clean-{install,types,build-demo}.log. Não foram copiadas dependências da aplicação para essa pasta. Nenhuma atualização de dependência/script para contornar checks.

**Critérios de aceite desta etapa comprovados:** carteiras privadas/persistentes; cotação atualizada com aceite explícito; pedido idempotente estável com recuperação após timeout/refresh; sucesso somente pelo estado confirmed da API; recibo imutável e remoção parcial; eventos nft.updated/order.updated pelo cliente Socket.IO real, descarte de versões/sessões impróprias e reconciliação REST. Regressão anterior preservada e executável.

**Riscos eliminatórios globais restantes:** stack completa ainda parcial por Lighthouse e regressão visual com baselines; fluxos da conta incompletos por perfil/avatar/senha. Assets403 e ausência de deploy/medições públicas impedem validar a entrega integral. Não atribuir nota garantida nem afirmar conclusão global do desafio. Próxima implementação recomendada: perfil completo, seguida das validações públicas/visuais descritas no plano.
