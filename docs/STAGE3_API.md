# Etapa 3 — autenticação, detalhes, favoritos e carrinho

> Histórico da etapa3. Auth/favoritos/carrinho continuam preservados; a etapa4 acrescenta carteiras, checkout, pedidos e Socket.IO. Consulte docs/STAGE4_CHECKOUT_SOCKET.md e ARCHITECTURE.md para a estrutura atual, incluindo cotação vinculada às versões dos NFTs.

Base: main em 2593a26, após a etapa P0 do catálogo. As nove rotas existentes foram mantidas, com `/favoritos` acrescentada. Não há criação de pedidos, pagamento final nem Socket.IO nesta etapa.

## Credenciais fictícias

| Usuário | E-mail | Senha de demonstração |
|---|---|---|
| Alice | alice@kurio.test | Kurio123! |
| Bob | bob@kurio.test | Kurio123! |

Cadastro cria novas contas e já inicia uma sessão. O domínio `.test` é fictício. Senhas só transitam no formulário/request e não são persistidas em claro: contas armazenam salt e hash PBKDF2-SHA256, 120.000 iterações. Fixtures usam salts/hashes determinísticos; cadastro gera salt aleatório. GET de sessão nunca inclui hash ou senha.

## Endpoints

Todos os endpoints são interceptados por MSW no navegador; não são um backend externo acessível por curl. Chamadas da aplicação usam Axios. Configuração dos mocks, build e catálogo da etapa anterior continuam em `docs/CATALOG_API.md`.

| Método e caminho | Entrada | Resultado |
|---|---|---|
| POST /api/auth/register | `{name,email,password}` | `{token,session:{user,expiresAt},notices}`; 400 validação; 409 e-mail existente |
| POST /api/auth/login | `{email,password}` | Mesma resposta; 401 credenciais inválidas |
| GET /api/auth/session | Bearer token | `{user:{id,name,email},expiresAt}`; 401 ausente/inválido/expirado |
| POST /api/auth/logout | Bearer token | 204; revoga a sessão apresentada |
| GET /api/nfts/:nftId | ID na URL | `{item:Nft}`; 404 inexistente; inclui creator, gallery e edições |
| GET /api/favorites | Bearer token | `{items:Nft[]}` do usuário da sessão |
| POST /api/favorites/:nftId | Bearer token | Inclui sem duplicação e retorna favoritos atualizados |
| DELETE /api/favorites/:nftId | Bearer token | Remove e retorna favoritos atualizados |
| GET /api/cart | Token ou X-Guest-ID | `{version,items,couponCode,notices}` |
| POST /api/cart/items | `{nftId,editionId,quantity}` | Acrescenta quantidade, combinando mesma edição; retorna carrinho |
| PATCH /api/cart/items/:itemId | `{quantity}` | Quantidade absoluta; retorna carrinho atualizado |
| DELETE /api/cart/items/:itemId | ID da linha | Remove e retorna carrinho; remoção repetida é inofensiva |
| POST /api/cart/coupon | `{code}` | Valida/aplica cupom e retorna carrinho; erro preserva cupom anterior |
| DELETE /api/cart/coupon | Sem corpo | Remove cupom e retorna carrinho |
| GET /api/cart/quote | Token ou X-Guest-ID | Cotação autoritativa do estado atual |

`itemId` é `nftId:editionId`, codificado na URL. A mesma edição de um NFT não gera linhas duplicadas. Quantidades devem ser inteiras, positivas, no máximo 1000 e dentro da disponibilidade real da edição. Validação de schema retorna 400; falta de estoque retorna 409; item de outro usuário não é localizado no carrinho atual. O cliente não escolhe o proprietário através do corpo/URL.

Erros seguem `{error:{code,message,fields?}}`. Formulários usam React Hook Form/Zod e associam erros retornados pela API aos campos. Nenhuma mutation de autenticação/carrinho/favoritos é repetida automaticamente.

## Sessão e autorização

O cliente mantém somente token opaco no sessionStorage (`kurio.auth.token`). A simulação mantém o SHA-256 do token, usuário e expiração no banco persistido, separado das respostas públicas. Duração padrão: 30 minutos. Refresh recupera a sessão por GET; guards sempre revalidam a sessão pela API antes de entrar em checkout, perfil, carteiras, favoritos e confirmação/pedidos. Essas telas privadas podem continuar com conteúdo futuro, mas não estão acessíveis anonimamente.

Quando a sessão expira, a API responde 401. Um interceptor compara o token da requisição com o token atual antes de limpar a sessão: uma resposta antiga de outra conta não encerra a sessão nova. O cliente cancela/remove cache privado, encerra recursos registrados da sessão e redireciona ao login com retorno local. A validade também é verificada pelo timer de expiração e nos acessos privados. Erro 500 de sessão não é confundido com logout; há recuperação explícita.

O destino original mantém path, parâmetros e hash. Destinos externos, caminhos com `//`, barras invertidas ou login/cadastro como retorno são rejeitados para evitar redirecionamentos indevidos. Senha errada no formulário de login não é tratada como expiração de uma sessão anterior.

Logout revoga a sessão no handler e limpa o estado cliente. Falha de conexão/500 no logout é apresentada com possibilidade de tentar novamente. A política é inteiramente simulada por MSW, sem depender de um backend de produção.

## Persistência e isolamento

- `kurio.mock.database.v2`: os mesmos 36 NFTs do P0, com IDs, preços, datas, filtros e paginação preservados; metadados de criador/galeria e edições extras foram acrescentados. A v1 anterior permanece sem alteração; a v2 inicia a seed enriquecida.
- `kurio.mock.commerce.v1`: contas com hashes, sessões com tokens hasheados, favoritos por ID de usuário e carrinhos por proprietário. Transações síncronas relêem storage antes de gravar; respostas são cópias.
- `kurio.guest.id`: identificador opaco do visitante. O carrinho autenticado é derivado da sessão e ignora tentativas de selecionar outro usuário.
- `kurio.mock.scenario` no sessionStorage: configuração dos cenários da aba.

Login/cadastro mesclam o carrinho visitante no carrinho da conta, por NFT/edição, e consomem o carrinho visitante. Quantidades somadas são limitadas ao estoque com aviso explícito. Uma linha que ficou esgotada é preservada para correção/remoção, e a cotação fica bloqueada. O cliente não apaga itens em falha. A identidade visitante consumida é aposentada no servidor simulado e rotacionada no cliente após login; escritas atrasadas da identidade antiga são recusadas, sem recriar um carrinho já mesclado.

Carrinhos privados e favoritos continuam persistidos após logout para o próximo login do mesmo usuário, sem aparecer no carrinho visitante nem em outra conta. Ao trocar identidade, o cliente cancela requisições e remove consultas com prefixos privados/carrinho. Resultados de mutations carregam uma geração de sessão; respostas antigas não restauram snapshots em cache após a troca. Recursos registrados (timers, listeners e AbortControllers) são encerrados.

Storage indisponível usa memória e não garante persistência entre reloads; conteúdo de storage inválido não é aceito como contrato válido. O reset restaura integralmente catálogo, contas fictícias, sessões, favoritos, carrinhos e cenários.

## Favoritos otimistas

Chave: `['private',userId,'favorites']`. Ao clicar, a mutation cancela a consulta, guarda snapshot e aplica a inclusão/remoção no cache. Erro devolve o snapshot anterior; sucesso usa a resposta real da API; ao finalizar, a consulta é invalidada. Durante a escrita o botão é desabilitado para evitar alterações concorrentes no mesmo controle. Expiração ou troca de conta impede rollback tardio de recriar o cache anterior.

## ETH, cupons e cotação

Valores monetários trafegam e são exibidos como strings decimais. O domínio simulado usa uma instância de decimal.js com precisão de 80 dígitos. Cada valor final é arredondado para no máximo 18 casas com ROUND_HALF_UP; zeros finais são omitidos. A UI não multiplica nem soma ETH.

| Cupom | Resultado |
|---|---|
| KURIO10 | 10% de desconto no subtotal |
| EXPIRADO | 400, cupom expirado |
| Qualquer outro | 400, cupom inválido |

Taxa de rede simulada: 0.016 ETH para carrinho não vazio, zero para vazio. O total é `subtotal - desconto + taxa`, calculado no handler/domínio. Exemplo de precisão: 3 × `0.390000000000000001` = `1.170000000000000003`; com KURIO10 e taxa, total `1.069000000000000003`.

A cotação contém `reference`, `cartVersion`, `expiresAt`, `currency`, `subtotal`, `discount`, `networkFee`, `total` e `couponCode`. A referência inclui proprietário, versão do carrinho e versões dos NFTs, e dura 60 segundos. Preço/estoque/cupom são consultados novamente ao cotar; indisponibilidade retorna 409. Isso prepara a integração futura, sem criar pedido nem prometer confirmação de compra. A futura fase deverá revalidar a cotação e exigir novo aceite se houver mudanças.

## Cache e recuperação

Sessão: `['auth','session']`, staleTime de 15s, com verificação forçada nos guards. Carrinho: `['cart',scope,'data']`; cotação: `['cart',scope,'quote',cartVersion]`; favoritos incluem usuário. Nenhum dado privado usa keepPreviousData ao trocar conta. Consultas passam AbortSignal ao Axios.

Carrinho/cotação são stale imediatamente para revalidação em navegação/foco; mutation invalida as consultas do proprietário. Totais só são exibidos se cartVersion corresponder ao carrinho visível. Leitura tem no máximo um retry para rede/5xx, sem retry de 4xx. O catálogo conserva a política P0: staleTime 60s, chaves por parâmetros e cancelamento de respostas obsoletas.

Falhas de escrita preservam o estado confirmado; o usuário pode corrigir e repetir. Não há retry automático de compra/pedido, que ainda não existem. O carrinho não usa atualização otimista monetária; favoritos fornecem a interação otimista obrigatória.

## Cenários determinísticos

Os cenários P0 continuam funcionando para catálogo. Recursos desta etapa têm falhas por operação, para não alterar o significado dos testes anteriores. `POST /api/__mock/configure` altera cenários sem limpar dados; `POST /api/__mock/reset` também restaura todos os bancos.

Exemplo no console do navegador:

```js
await fetch('/api/__mock/configure', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'normal', latencyMs: 100,
    faults: { 'favorites.add': { status: 500, times: 1, latencyMs: 1200 } }
  }),
})
```

Operações: `auth.register`, `auth.login`, `auth.session`, `auth.logout`, `favorites.read`, `favorites.add`, `favorites.remove`, `cart.read`, `cart.add`, `cart.update`, `cart.remove`, `cart.coupon`, `quote.read`. Falha pode ter `status`, `networkError`, `latencyMs` e `times` (ausente: persistente). `sessionTtlMs` controla a duração das novas sessões.

`POST /api/__mock/session/expire`, com o Bearer atual, expira somente a sessão apresentada. `POST /api/__mock/stock` aceita `{nftId,editionId,remaining}` para exercitar conflito de estoque; mudanças são percebidas por REST/refetch. Não emite Socket.IO nem substitui eventos diretamente no cache. Para reset, envie `{name:'normal'}` a `/api/__mock/reset` e recarregue a página.

## Figma e limites visuais

Foram consultados via Figma MCP os frames Desktop/Detalhes `10:244`, Mobile/Detalhes `15:5536`, Desktop/Carrinho `11:1278`, Login `9:115` e Cadastro `9:1022` da cópia fornecida. Contexto e screenshots foram obtidos, porém downloads de PNG/SVG originais por URLs fornecidas pelo MCP retornaram **HTTP 403**, inclusive na inspeção dos headers. Nenhum arquivo de erro foi incorporado como asset e nenhuma arte arbitrária foi usada.

Galeria tem seleção de vistas e ampliação acessível, com slots tipados para os assets. Os slots atuais são indisponíveis, não imagens inventadas. Detalhe usa galeria lateral desktop e superfície empilhada mobile; carrinho usa itens/resumo lateral e empilha em telas menores; autenticação usa diálogo acessível com o formulário da identidade Kurio. Login social e recuperação de senha são explicitamente indisponíveis; não aparentam sucesso funcional.

Cabeçalho/rodapé da estrutura existente foram preservados, com controles de sessão e link de favoritos. O diálogo de login não recria o catálogo inteiro como fundo; é uma adaptação para acesso direto e teclado. A ação do detalhe é “Adicionar ao carrinho”, sem disparar compra final. Fidelidade visual integral e imagens originais continuam pendentes, sem impedir a avaliação dos fluxos pela rede.
