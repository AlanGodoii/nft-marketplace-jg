# Etapa 4 — checkout, pedidos, carteiras e Socket.IO

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
