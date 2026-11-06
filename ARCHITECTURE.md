# Arquitetura — Kurio, etapa 4

## Responsabilidades e inicialização

Router → TanStack Query → Axios → REST/MSW. Schemas Zod em src/contracts são compartilhados pelo transporte, handlers e formulários. Componentes não importam fixtures nem acessam o banco da simulação. React Hook Form/Zod validam autenticação, carteiras e dados do checkout; componentes shadcn/ui/Tailwind mantêm a identidade Kurio.

A ativação dos mocks é aguardada antes de importar App. Isso também assegura que engine.io-client capture o construtor WebSocket já interceptado pelo MSW. Sem mocks, o mesmo cliente utiliza REST e Socket.IO da origem configurada, sem respostas alternativas nos componentes. A demonstração utiliza VITE_ENABLE_MOCKS=true, inclusive no build.

As dez rotas da etapa3 permanecem: as nove originais e favoritos. Carteiras, checkout e confirmação agora são funcionais; somente perfil continua com conteúdo futuro protegido. orderId pertence aos parâmetros da URL de confirmação; ausência de ID consulta o histórico privado, sem inventar sucesso.

## Estado persistido e contratos

- kurio.mock.database.v2: base dos36NFTs, metadados/edições e revisões públicas. IDs, preços iniciais, filtros e paginação preservados. Consultas relêem storage válido; mudanças em outra aba podem ser reconciliadas por REST.
- kurio.mock.commerce.v1: contas com hashes, sessões com tokens hasheados, favoritos, carrinhos, carteiras, conexões, snapshots de cotação, pedidos e idempotência. Campos da etapa4 têm defaults aditivos para preservar dados existentes da etapa3.
- kurio.guest.id: carrinho visitante; login/cadastro mesclam por NFT/edição e aposentam a identidade consumida.
- kurio.mock.scenario: condições de rede na sessão da aba, incluindo latências, HTTP, erro de rede, resultados de conexão/pagamento e timeout pós-criação.

Respostas são cópias validadas; ETH sempre string e quantidades inteiras. Storage indisponível possui fallback em memória, sem promessa de refresh. Reset limpa timers de pedidos, dados e cenários, restaurando as fixtures; recarregar após reset reinicia clientes e gerações de eventos.

## Autenticação, autorização e isolamento

Contas fictícias utilizam PBKDF2-SHA256120.000iterações com salt. Cadastro gera salt aleatório; senhas em claro não são persistidas. O cliente mantém token opaco em sessionStorage. Handlers verificam hash SHA-256, usuário e prazo no banco; carteiras, favoritos, cotação privada e pedidos derivam o proprietário dessa sessão, nunca do userId enviado pelo componente.

Acesso a identificador de outra conta responde404 para ocultar sua existência. Ausência/expiração responde401. O controle de liquidação de pedidos da simulação também exige o proprietário autenticado. Checkout/perfil/carteiras/favoritos/pedidos têm guards que revalidam a API e preservam a URL de retorno local. Erro500/rede de sessão não é confundido com logout.

Troca/logout/401 cancelam/removem consultas privadas e carrinho; uma geração de identidade impede callbacks e rollbacks tardios de atualizar a conta nova. Resposta401 antiga compara o token da requisição ao token atual antes de encerrar sessão. Timers/listeners/AbortControllers e o Manager Socket.IO anterior são encerrados. A conta nova abre conexão e cache próprios; eventos privados verificam usuário e identidade da sessão nos dois lados do transporte.

Rascunhos válidos do checkout ficam no sessionStorage por usuário e carteira, associados à versão da carteira: dados do colecionador, observações, rede, seleção/quantidades. Não guardam senhas. Dados da revisão são novamente validados e cotados; rascunho nunca autoriza compra. Tentativas de pedido também ficam por usuário, com chave/corpo estáveis antes do primeiro POST.

Esta é uma simulação no navegador, não segurança de um backend de produção: armazenamento local é inspecionável pelo dono do navegador. Autorização e isolamento são exercitados na camada MSW/Query e em testes A/B.

## Carteiras, cotação e ETH

Carteiras principal/secundária têm papel e endereço/rede únicos por usuário. Endereços Ethereum/Polygon validam0x+40hex; Solana valida base58 com32–44caracteres. A conexão simulada pertence à sessão e à versão da carteira; edição, desconexão ou sessão nova exige reconectar. Nenhuma extensão/blockchain é acessada.

O checkout seleciona itens/quantidades do carrinho, carteira cadastrada e rede compatível. A API valida dados do colecionador, conexão, seleção sem duplicatas, limites do carrinho/estoque, edição, cupom e taxas. Retorna snapshot privado com ID/fingerprint/prazo, reutilizando createQuote e decimal.js da etapa3.

Dinheiro usa Decimal com precisão80 e ROUND_HALF_UP para18casas. API calcula lineTotal/subtotal/desconto/taxa/total; React compara ou apresenta strings, sem cálculos monetários próprios. KURIO10 aplica10%; EXPIRADO e códigos inválidos são recusados. Taxa padrão0.016ETH, configurável para simular revalidação; quantidades usam somente inteiros.

A revisão exige aceite explícito. Antes do POST de pedido, o cliente recota; diferenças de preço/estoque/quantidade/subtotal/desconto/taxa são apresentadas e o aceite é limpo. Eventos de NFT invalidam a revisão imediatamente. A API de pedido revalida tudo novamente e recusa cotação expirada/desatualizada; uma UI antiga não pode autorizar valores novos.

## Pedidos, idempotência e ledger

POST/orders associa usuário+Idempotency-Key ao corpo normalizado e ao pedido na mesma transação. Mesma chave/corpo recupera o pedido, mesmo após expiração da cotação; conteúdo diferente409. O cliente salva a tentativa antes do envio, bloqueia cliques concorrentes por refs e não faz retry automático. Timeout após criação preserva a chave/corpo, permitindo recuperar exatamente o mesmo pedido após refresh. Nova tentativa exige erro definitivo de não criação ou estado terminal consultado e ação explícita. A recuperação também é renderizada no checkout vazio: confirmação recebida durante resposta HTTP atrasada não pode ocultar o acesso à mesma tentativa/recibo.

Máquina de estados: pending → confirmed ou rejected. Estados terminais não mudam. Resultado desconhecido/timeout/rede são falhas de transporte, não rejected. O backend simulado persiste resultado programado/due time e restaura timers ao iniciar; GET também reconcilia liquidações vencidas. Processamento continua independente da conexão do usuário.

Vendas confirmadas são o ledger de estoque. O snapshot público deriva disponibilidade/revisão da base e das vendas confirmadas. A confirmação e a remoção de quantidades do carrinho são persistidas juntas; não há débito de estoque separado que um reload possa aplicar duas vezes. Na liquidação, estoque é novamente verificado; perda de estoque recusa o pedido e preserva carrinho. Itens não selecionados e extras permanecem. Geração da linha impede remover um item novo readicionado durante processamento.

O recibo é o snapshot do pedido confirmed, nunca uma consulta ao preço atual: ID, referência simulada, itens/edições/quantidades/preços, totais, rede e carteira. Pendente/recusado não exibem recibo confirmado. Exploração de transação é explicitamente fictícia.

## Socket.IO e reconciliação

socket.io-client4.8.4 real, transport WebSocket, path/kurio-live/, namespace padrão. MSW3 ws.link intercepta o transporte; um adaptador de rede implementa Engine.IO4/Socket.IO5, abertura/CONNECT, JSON42, ping/pong e fechamento. @mswjs/socket.io-binding0.2.0 foi avaliado, mas seu peer exige MSW2; não foi instalada combinação incompatível. Não há EventEmitter ou callback no lugar do transporte.

nft.updated traz eventId/resourceId/version/payload. order.updated também traz userId/sessionId. IDs estáveis, versões monotônicas e schemas validam coerência entre envelope/payload. Emissões privadas são filtradas por sessão válida. Cliente ignora IDs repetidos, versões antigas, sessão incorreta e regressão de terminal, e envia ACK pela própria conexão para a verificação dos cenários.

Eventos cancelam leituras obsoletas e invalidam consultas REST relevantes. Estado confirmado vem da API, mesmo após evento; nenhum callback de UI decide que uma compra foi concluída. Resumo do carrinho é ocultado enquanto versões dos NFTs não correspondem à cotação. Checkout exige novo aceite após mudança relevante.

Na reconexão, o cliente revalida a sessão e reconcilia recursos ativos pela API, incluindo pedido pendente. Não há polling de pedido substituindo Socket.IO. Refresh recupera os recursos persistidos sem recriar pedido. Encerramento de sessão desliga Manager/listeners/reconexão anterior.

Limites: transporte interceptado no runtime do documento, sem servidor externo; JSON/namespace padrão/WebSocket, sem polling upgrade, binários, rooms ou namespaces customizados. Persistência local sustenta refresh; não se promete broadcast entre dispositivos. Diagnósticos contam handshakes/frames/ACKs sem expor tokens brutos ou recibos de outras contas.

## Cache e retries

- Catálogo: chaves completas por parâmetros, stale60s/gc5min, placeholder público durante atualização e AbortSignal ao Axios.
- Sessão: auth/session, stale15s; guard força revalidação e timer consulta API ao expirar.
- Favoritos: private/userId/favorites, stale30s, snapshot otimista e rollback; nenhum placeholder privado entre contas.
- Carrinho: cart/scope/data. Cotação inclui escopo, versão do carrinho e versões dos NFTs; stale0 e só exibe snapshot atual.
- Carteiras: private/userId/wallets, stale0, invalidação após escrita.
- Pedidos: private/userId/orders[/orderId], stale0, atualização por evento/REST; nenhum refetchInterval periódico.
- Mutations privadas carregam geração de identidade, AbortController e retry:false. Leituras têm até um retry de rede/5xx;4xx não repetem automaticamente.

Detalhes REST/eventos/cenários em docs/STAGE4_CHECKOUT_SOCKET.md. Fixtures e handlers são compartilhados por dev, build/demo e testes. Vite ignora relatórios/work/ no watcher para não recarregar a aplicação ao gerar artefatos de teste.

## Visual, acessibilidade e pendências

Frames consultados: Pagamento desktop11:2862/mobile16:748, Confirmação11:4385 e Carteiras9:1670. Tokens/componentes/tipografia locais preservados; formulário em duas colunas e resumo lateral no desktop, superfícies empilhadas mobile. Estado de revisão/recibo em diálogo com foco inicial/retorno explícitos; erro associado aos campos, feedback acessível e redução de movimento também nos portais. Estados de conexão/cotação não desenhados seguem o padrão Kurio.

Downloads dos assets originais seguem bloqueados403. Não há arte arbitrária, SVG redesenhado ou screenshot usado como asset. Slots dinâmicos identificam a ausência. Cabeçalho/rodapé anteriores foram mantidos; fidelidade integral/baselines ainda pendentes. Perfil completo, Lighthouse e deploy público não foram concluídos nesta etapa.

Resultados reais, falhas intermediárias e inventário no checklist e documento da etapa4. Teste funcional aprovado não equivale a nota, baseline visual, Lighthouse ou deploy validado.
