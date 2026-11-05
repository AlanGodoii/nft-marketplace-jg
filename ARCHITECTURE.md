# Arquitetura — Kurio, etapa 3

## Responsabilidades

A aplicação mantém a arquitetura P0: Router → Query → serviços Axios → MSW. `src/contracts` contém schemas Zod e tipos compartilhados entre transporte, mocks e UI. Componentes não importam fixtures ou acessam o banco simulado. As nove rotas existentes permanecem; `/favoritos` foi acrescentada. Conta, detalhe, favoritos e carrinho são funcionais. Perfil, carteiras, checkout e confirmação continuam telas futuras, agora protegidas por sessão.

`src/features/auth` cuida de queries/mutations de conta, guards, retorno e ciclo de sessão. `features/catalog` conserva as consultas públicas e implementa o detalhe; `features/favorites` mantém consulta e escrita otimista; `features/cart` mantém carrinho e cotação autoritativos. Componentes shadcn/ui são reutilizados, inclusive diálogo acessível para login/cadastro e ampliação da galeria.

## Mocking e estado

MSW inicia antes de React, por `VITE_ENABLE_MOCKS`, em desenvolvimento e no build. Handlers desconhecidos de `/api/*` respondem 404; recursos estáticos podem seguir normalmente. O catálogo continua com 36 NFTs e os mesmos IDs, preços, datas e parâmetros. Galeria, criador e edições adicionais foram acrescentados. O banco público usa `kurio.mock.database.v2`; a v1 anterior não é apagada.

`commerce-db.ts` centraliza contas, hashes, sessões, favoritos e carrinhos em `kurio.mock.commerce.v1`. Transações síncronas relêem o storage antes da alteração, validam o estado e retornam cópias. Handlers de carrinho/cotação consultam o mesmo banco de NFTs, sem cópias divergentes de preços/estoque. Storage indisponível usa memória; não se promete persistência entre reloads nesse caso. Reset restaura integralmente os dois bancos e os cenários.

Cenários de catálogo P0 permanecem iguais. Falhas dos novos recursos são configuradas por operação (`faults`), com HTTP, conexão, latência e contagem determinística. `/api/__mock/configure` preserva os dados, e `/api/__mock/reset` restaura tudo. Controles de expiração/estoque ficam exclusivamente na simulação; não disparam eventos falsos na UI.

## Autenticação, autorização e sessão

Contas fictícias usam PBKDF2-SHA256 com 120.000 iterações e salt; cadastro gera salt novo. Senhas em claro não são persistidas. O cliente mantém token opaco no sessionStorage; a simulação persiste apenas seu SHA-256, usuário e expiração. API nunca devolve hashes de senha. O token identifica o proprietário de favoritos/carrinho, sem aceitar userId enviado pelo componente como autorização.

Sessão dura 30 minutos por padrão, configurável nos cenários. GET de sessão recupera a identidade após refresh. Guards forçam a verificação pela rede em checkout, perfil, carteiras, favoritos e confirmação. O destino local original, incluindo query/hash, vai ao login; destinos externos e loops de retorno a login/cadastro são rejeitados.

Expiração produz 401; o interceptor só encerra a sessão se o token da requisição ainda for o token atual. Assim, resposta antiga não invalida outra conta. Antes de adotar nova identidade, consultas da sessão e dos recursos privados são canceladas; dados de carrinho/privados são removidos. Uma geração de identidade protege callbacks de mutations e rollbacks. Uma remoção final de cache cobre otimismos encerrados durante a espera de cancelamento.

Timers de expiração, listeners de storage e AbortControllers de mutations são registrados e encerrados nas transições. Não existe socket nesta etapa. Erros 500/rede na verificação de sessão não viram logout silencioso; rotas e sessão têm recuperação explícita. Logout só indica sucesso após revogação da sessão; expiração também limpa o cliente. O timer revalida a API, em vez de inventar uma resposta de expiração.

Esta é uma implementação de autenticação **simulada no navegador**, sem backend de produção. A autorização e o isolamento são exercitados pelos handlers e pelos testes, sem alegar segurança de servidor para código client-side.

## Visitante, mesclagem e isolamento

Visitante usa identificador opaco em localStorage, distinto de token de conta. Carrinhos são armazenados por `guest:id` ou `user:id`. Login/cadastro mesclam as linhas por NFT/edição em uma transação, consumindo o carrinho do visitante. Quantidades que ultrapassaram o estoque são ajustadas com aviso; edição esgotada permanece visível para resolução, com cotação bloqueada.

A identidade visitante consumida é aposentada na simulação, impedindo que uma escrita antiga reabra esse carrinho após o login. O cliente gera outra identidade visitante ao adotar a sessão. Logout não copia itens privados para o visitante; outra conta consulta somente seu próprio carrinho/favoritos. Dados da conta anterior continuam no banco para o próximo login dela, mas são removidos do cache ativo.

## Cache, concorrência e falhas

- Catálogo: chaves P0 por parâmetros completos, staleTime 60s e gcTime 5min; refresh/histórico na URL preservados. Parser conserva strings ETH de links diretos. Consulta obsoleta é cancelada até Axios; dados anteriores só são usados como placeholder público identificado como atualização.
- Sessão: `['auth','session']`, staleTime 15s e verificação forçada nos guards. Ausência/expiração retorna null somente após 401; demais falhas permanecem erros recuperáveis.
- Favoritos: `['private',userId,'favorites']`, staleTime 30s, sem keepPreviousData entre usuários. Mutation guarda snapshot, aplica otimismo, faz rollback em falha e invalida a consulta. Resultados tardios verificam a geração de identidade antes de tocar o cache.
- Carrinho: `['cart',scope,'data']`; cotação: `['cart',scope,'quote',cartVersion]`. staleTime zero para revalidação em navegação/foco; mutations devolvem carrinho confirmado e invalidam as consultas do proprietário. Totais de outra versão não são exibidos.

Todas as leituras recebem AbortSignal. Há um retry para rede/5xx e nenhum para 4xx; mutations não têm retry automático. Falha preserva itens/estado confirmado. Escritas não são usadas para apresentar compras como bem-sucedidas.

## ETH e preparação do checkout

Somente o domínio simulado calcula valores, usando decimal.js com precisão 80 e ROUND_HALF_UP para até 18 casas. ETH trafega como string; quantidades são inteiras. A API fornece lineTotal, subtotal, desconto, taxa e total. Cupom KURIO10 dá 10%; EXPIRADO e códigos desconhecidos são recusados sem substituir o cupom anterior.

A referência da cotação inclui proprietário, versão do carrinho e versões dos NFTs, com validade de 60s. O estoque e o cupom são revalidados a cada cotação. Isso prepara a próxima fase; ainda não existe criação de pedidos, idempotência de compra, conexão de carteira, checkout final ou Socket.IO. A próxima etapa deve persistir/revalidar a cotação de confirmação e representar pedidos pendentes/confirmados/recusados.

## Interface, Figma e limites

Foram obtidos contexto e screenshots dos frames de detalhe desktop/mobile, carrinho e autenticação pelo MCP. Os downloads dos PNG/SVG originais retornaram HTTP 403. Não há imagem arbitrária ou captura de tela usada como arte. A galeria expõe seleção de vistas e ampliação, com slots tipados e ausência explícita até os assets serem disponibilizados.

Detalhe segue galeria lateral/informações no desktop e composição empilhada mobile; carrinho organiza itens e resumo lateral com adaptação para telas menores. Login/cadastro usam um diálogo com contenção/retorno de foco, formulários reais, labels e erros associados. O catálogo não é recriado como fundo estático dos diálogos, preservando sua arquitetura. A ação “Adicionar ao carrinho” substitui uma promessa de compra final; login social e recuperação de senha são indicados como indisponíveis.

Shimmer e dimensões reservadas são reutilizados; prefers-reduced-motion desativa animações. Cabeçalho/rodapé pré-existentes foram mantidos, acrescentando controles de sessão e favoritos. Fidelidade pixel a pixel, assets e regressão visual com baselines continuam pendentes. Contratos e cenários completos: `docs/STAGE3_API.md`.

## Verificação

Playwright mantém os testes do catálogo e acrescenta fluxos e falhas de conta, detalhe, favoritos, carrinho e cotação em desktop/mobile, incluindo larguras 390/768/1440. Testes usam handlers MSW no navegador; o caso de tempo de sessão controla o relógio. Testes anteriores de navegação foram atualizados apenas para os novos comportamentos reais (guards e 404), mantendo os caminhos existentes.

Typecheck cobre fontes e testes/config Playwright. Relatório HTML e traces de falhas são configurados. Resultados efetivos estão no checklist e na descrição do PR. Lighthouse e regressão visual com baselines não fazem parte desta etapa e não recebem pontuação inferida por testes verdes.
