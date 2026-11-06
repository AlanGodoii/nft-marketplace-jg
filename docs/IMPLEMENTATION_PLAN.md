# Plano de implementação — Jungle Gaming NFT Marketplace

> Atualização de integração: PR3 já integrado à main; PR4 foi integrado à branch da etapa3. A correção está na branch fix/integrar-etapa4-main, com novo PR para main. Histórico, preservação do código e verificações em [STAGE4_MAIN_INTEGRATION.md](STAGE4_MAIN_INTEGRATION.md). As referências anteriores a PRs abertos são históricas.

Data: **05/11/2026**, America/Sao_Paulo. Prazo informado: **06/11/2026**, sem horário de corte conhecido.

Base da auditoria inicial: `a99d26c769240a0e9f2e19cb53b09978a06b9917` de `origin/main`. Enunciado `docs/DESAFIO.md` lido integralmente. Evidências, comandos e 344 itens estão em `docs/REQUIREMENTS_CHECKLIST.md`. A auditoria inicial não modificou funcionalidades. O progresso atual da implementação está descrito abaixo.

## Progresso etapa 4 — plano corrente

Base c52f872 confirmada, branch feat/etapa4-checkout-pedidos-socket, commits por checkpoint. Não houve alteração direta da main nem merge automático. Dependência do PR3 é mantida enquanto ele não estiver integrado.

A: carteiras principais/secundárias, edição/persistência/isolamento e conexão simulada. B: checkout/cotação privada, seleção, compatibilidade, validação e revisão. C: pedidos idempotentes, estados, timeout/refresh e recibo imutável, estoque ledger e remoção parcial. D: Socket.IO real no transporte WebSocket MSW3, eventos, versionamento, isolamento e reconciliação REST. E: regressão e validação no build otimizado, com resultados finais no fechamento E4 do checklist.

Resultados já observados por checkpoint: baseline6/6; A6/6; B8/8; A+B+C30/30; D16/16; repetição específica de acessibilidade/sessão/larguras10/10. Fechamento:176/176 na regressão dev(16.2m),70/70 novos no build otimizado(3.6m); tipos/lint/build/demo aprovados,3avisos preexistentes. Instalação limpa com npm ci, tipos e build:demo aprovada; conferência adicional nas três larguras e guard terminal recusado/exploração simulada aprovada. Falhas intermediárias documentadas no fechamento E4, sem inferir aprovação pela soma de execuções repetidas.

### Próxima implementação recomendada: perfil completo

O último placeholder de funcionalidade obrigatória é o perfil. Implementar consulta/edição de dados, avatar e alteração de senha via MSW/Axios/Query, RHF/Zod, persistência e erros. Preservar sessão, carteiras/carrinho/pedidos e Socket.IO; mudança de senha deve ter política explícita de reautenticação/revogação. Não refazer compra ou tempo real já validados.

| Prioridade | Trabalho restante / dependência | Estimativa ativa | Validação |
|---|---|---|---|
| P0 | Perfil/API/dados/avatar/senha; depende de auth e estado persistido existentes | 3–5h | Edição/refresh, arquivo inválido/tamanho, senha antiga/nova,401/409/500, A/B e cache/socket da sessão anterior |
| P0 | Deploy público do commit revisado, com SPA fallback, mocks e Socket.IO | 1–2h | URL real, acesso direto/refresh, compra e evento no publicado; não confundir preview local com deploy |
| P0 | Configuração/comando Lighthouse e3medições por início/detalhe mobile/desktop, mediana e HTML/JSON | 2–4h | Métricas reais LCP/CLS/TBT e categorias; justificar abaixo das metas sem inventar nota |
| P1 | Resolver acesso aos assets originais403 e fechar fidelidade dos frames | 3–6h + acesso externo | Imagens/fontes efetivas e comparação390/768/1440; não trocar por arte arbitrária |
| P1 | Regressão visual versionada de início/detalhe/carrinho/pagamento | 2–4h | Dados estáveis, baselines reais e screenshots comparados; atualizar somente com revisão |
| P2 | Otimizações e ajustes de zoom/contraste medidos após Lighthouse/visual | 1–3h | Medições antes/depois e navegação/zoom sem perda de conteúdo |

Estimativas aproximadas de uma pessoa; não são promessa para06/11/2026, sem horário de corte conhecido. Há risco de prazo por perfil, medição e assets externos; não declarar conformidade integral. Não usar testes funcionais para estimar uma nota garantida.

Arquivos da próxima tarefa: src/routes/perfil.tsx, novos contracts/profile.ts, features/profile/*, mocks/handlers/profile.ts e estado commerce-db; reutilizar auth/lifecycle/identity/password e controles de sessão. Estender Playwright com perfil/avatar/senha; manter todas as suítes de compra/Socket.IO. Para entrega: configuração de hospedagem/SPA, comando/config Lighthouse, relatórios e baselines nas pastas próprias.

### Histórico das etapas anteriores

As seções seguintes preservam estimativas/pendências anteriores. **O plano corrente acima prevalece; checkout, carteiras, pedidos e Socket.IO já foram implementados na etapa4.**

## Progresso etapa 3 e plano restante — 05/11/2026

Implementado sobre main2593a26: autenticação/sessão, guards e retorno, detalhe/edições, favoritos otimistas com rollback e carrinho visitante/usuário com merge, estoque, cupom e cotação Decimal. Catálogo36NFTs e testes preservados. Nove rotas originais mantidas; favoritos acrescentada. Contratos e evidências: docs/STAGE3_API.md e checklist. Validação final: tipos/lint/build/build:demo aprovados;106 testes dev (8.1m) e64 do build otimizado (3.6m) aprovados. Uma rodada concorrente anterior teve105 aprovados e1 timeout; repetição integral sequencial passou sem relaxar testes. Detalhes no fechamento E3 do checklist.

### Próxima implementação recomendada

**P0 — checkout/pedidos idempotentes e transporte Socket.IO real.** Não foram implementados nesta etapa por limite explícito do escopo. Depender dos contratos atuais de sessão, carrinho e cotação; não refazer os módulos concluídos. Risco eliminatório continua máximo enquanto não houver compra confirmada somente pelo estado da simulação e eventos passando pelo cliente real.

| Prioridade / dependência | Trabalho restante | Estimativa ativa | Validação |
|---|---|---|---|
| P0 / domínio atual | Contratos de carteira/pedido e persistência de idempotência; revalidar cotação, estoque, sessão e conteúdo no servidor simulado | 4–6h | Mesma chave recupera mesmo pedido; conteúdo diferente409; timeout não duplica |
| P0 / contratos | Carteiras mínimas e checkout com confirmação baseada em resposta, pendente/sucesso/falha; recibo privado | 5–8h | Compra integral, duplo clique, falha, expiração, refresh e retorno ao pedido original |
| P0 / estado central | Provar cliente Socket.IO com transporte de mocks; eventos versionados, duplicados/antigos, desconexão e reconciliação REST | 5–9h | Observar eventos no cliente real; não escrever diretamente no cache para simular transporte |
| P0 / anteriores | E2E de compra/isolamento/tempo real e build otimizado | 3–5h | Dev+preview; falhas determinísticas, recibo de proprietário correto |
| P1 | Perfil/avatar/senha e gestão completa de carteiras, erros/persistência | 4–7h | Validação, refresh, troca A/B, credenciais antigas/novas |
| P1 | Recuperar assets originais (URLs atuais403), ajustar Figma desktop/mobile e baselines das quatro telas obrigatórias | 3–6h + acesso | Comparação em390/768/1440; regressão visual versionada |
| P1 | Deploy funcional com refresh de rotas e MSW, Lighthouse e documentação final | 2–4h | URL pública, relatório real e reprodução local |
| P2 | Performance medida, refinamentos visuais/a11y e orçamento de bundle | 2–4h | Corrigir gargalos apontados por medições; evitar otimização sem evidência |

Estimativas aproximadas para uma pessoa, não promessa: P0 restante17–28h, além de P1/P2. Prazo amanhã06/11/2026 sem horário definido: risco alto de escopo; não declarar conformidade integral nem nota garantida. Reservar janela para validação e revisão do PR. Assets dependem de acesso externo; não substituir arte original por imagens arbitrárias.

Arquivos a modificar na próxima tarefa: novos contracts/order.ts e wallet.ts, handlers/orders.ts e wallets.ts, domínio/persistência MSW para pedidos, src/routes/{checkout,carteiras,pedido.confirmacao,perfil}.tsx, integração Socket e hooks privados; reaproveitar src/mocks/cart-domain.ts, commerce-db.ts, src/features/auth/* e src/contracts/cart.ts. Estender tests/commerce.spec.ts ou separar suites de checkout/socket; preservar tests/catalog.spec.ts.

### Histórico P0 e auditoria

As seções abaixo descrevem o estado anterior e estimativas originais. **Não são o plano corrente nem ausência das funcionalidades da etapa3.**

## Progresso após implementação P0 de catálogo — 05/11/2026

A branch work foi atualizada por fast-forward para a99d26c antes da implementação. A primeira fatia funcional agora inclui contratos compartilhados de catálogo, banco MSW, fixtures/reset/cenários, Axios, queries, URL, filtros/sort/paginação e UI com estados reais de rede. Nove rotas preservadas; demais oito telas não foram implementadas.

Validação: tipos/lint/build/build:demo passaram; 42 testes dev e 34 integrados contra o build passaram. A falha inicial de precisão em URL foi corrigida com preservação dos limites ETH no parser. Evidências atuais estão no checklist e contratos/cenários em docs/CATALOG_API.md. README e ARCHITECTURE.md foram adicionados/atualizados.

| Etapa original | Avanço atual | Restante |
|---|---|---|
| P0.1 | Contratos de NFTs/edições/coleções/redes/disponibilidade/paginação/erros concluídos | Contratos e cálculos de carrinho/cotação/pedidos/sessão |
| P0.2 | MSW, estado central de NFTs, cenários de leitura, reset e build funcionando | Dois usuários, consistência entre demais recursos, cenários de compra/conta |
| P0.3 | Axios/Query, chaves por parâmetros, cancelamento e política de leitura | Autenticação, escopo de usuário, guards e limpeza privada |
| P0.4 | Catálogo, busca/filtros/sort/página na URL e histórico concluídos | Tela de detalhe integrada, edições/quantidade e favoritos |
| P0.5–7 | Não iniciados | Carrinho/cotação, checkout/pedidos e Socket.IO |
| P0.8 | E2E do catálogo dev/build desktop/mobile; HTML e traces configurados | Fluxos de compra/conta/tempo real, baselines e Lighthouse |

**Próxima tarefa recomendada:** autenticação/sessão e proteção dos recursos privados, compartilhando contratos/MSW e seguindo para detalhe/favoritos e carrinho/cotação. A consistência de compra depende dessa base. Se a próxima tarefa for estritamente pública, integrar primeiro a leitura do detalhe ao endpoint já disponível, sem apresentar compra como funcional.

As estimativas a seguir pertencem ao diagnóstico anterior à implementação e são preservadas como histórico de planejamento; **não representam nova estimativa do esforço restante**. Reestimar os blocos pendentes ao delimitar a próxima tarefa. O prazo informado continua 06/11/2026 sem horário definido.

## Diagnóstico e estimativas originais (histórico)

### Situação à época da auditoria

A versão remota contém Router funcional, provider Query, componentes shadcn/ui, home estrutural responsiva, fontes locais e oito testes Playwright executáveis. **Compra, conta, APIs simuladas e tempo real ainda não existem**. As oito outras telas são placeholders. Build e tipos passam; lint passa com dez avisos; os oito testes estruturais passam.

O trabalho restante é substancial. Estimativa aproximada para uma pessoa experiente, em horas de trabalho ativo: **P0 28–46 h, P1 16–27 h, P2 6–10 h**, total **50–83 h**, sem contar imprevistos relevantes. Não são horas de calendário nem promessa de entrega. Parte da validação está incluída em cada bloco; reservar também uma janela final dentro desse esforço. Não é realista declarar que toda a conformidade será alcançada até amanhã com base no estado atual. Os pesos oficiais não garantem nota e a presença de critérios eliminatórios impede tratar os refinamentos visuais como compensação para fluxos ausentes.

A estratégia é entregar primeiro uma fatia completa pelo caminho **UI → Router/Query → Axios → MSW → persistência → Socket.IO → recibo**, com evidência de rede. Depois ampliar cenários, telas e fidelidade. Uma demonstração parcial precisa ser apresentada como parcial.

## Dependências técnicas

1. Contratos e modelo de estado: sessão/usuário, NFT/edição, carrinho, cotação, carteira, pedido, erros e eventos versionados; valores ETH como strings.
2. Banco simulado persistente e cenários determinísticos MSW: única origem de verdade para REST e eventos; reset integral; dois usuários.
3. Infraestrutura de cliente: Axios, Query, sessão, chaves por usuário/parâmetro, guards e limpeza de cache/subscriptions.
4. Catálogo/detalhe → carrinho/cotação → checkout/pedido/recibo, usando os contratos e sem respostas fictícias na UI.
5. Socket.IO real com integração MSW compatível; reconciliação REST e transições terminais de pedidos.
6. Testes de fluxo/falha/isolamento pela rede, regressão visual, Lighthouse e deploy da mesma versão.

Resolver cedo o protótipo de compatibilidade MSW/Socket.IO. Embora os fluxos de negócio dependam do domínio, um teste inicial de transporte pode descobrir incompatibilidade antes de todo o checkout estar pronto. Não substituir o cliente por eventos diretos no cache para economizar tempo.

## P0 — eliminatórios, integração e compra funcional

| Ordem / tarefa | Dependências | Estimativa | Arquivos existentes a modificar e arquivos propostos | Critério de aceite e validação |
|---|---|---|---|---|
| P0.1 — Contratos e domínio monetário | Enunciado; inventário de recursos | 2–3 h | Modificar `src/features/catalog/types.ts`; criar `src/contracts/{auth,nft,cart,quote,order,profile,wallet,event,error}.ts`, `src/lib/eth.ts` e documentação de contratos | Definir operações REST oficiais; ETH trafega como string, quantidades inteiras, cálculos com decimal.js ou unidade inteira; snapshot e versão da cotação; testes de valores fracionários e arredondamento consistente. |
| P0.2 — MSW, persistência e cenários | P0.1 | 4–6 h | Modificar `src/main.tsx`; criar `src/mocks/{browser,db,fixtures,scenarios,reset}.ts`, `src/mocks/handlers/*`; manter worker gerado; criar `.env.example` | REST interceptado; dois usuários; reset integral; mocks ativos por configuração também no build; erros configuráveis; dados coerentes entre recursos; sem lógica fictícia alternativa em componentes. |
| P0.3 — Axios, Query e sessão protegida | P0.1–2 | 3–5 h | Modificar `src/App.tsx`, `src/lib/query-client.ts`, `src/router.ts`, rotas privadas, login/cadastro e header; criar `src/lib/api.ts`, `src/features/auth/*`, `src/lib/query-keys.ts` | Cadastro/login/logout/sessão via API; retorno ao fluxo; refresh e expiração; guards de checkout/perfil/carteiras/pedidos; caches por usuário; limpar cache e socket anterior; API também impede acesso indevido; não persistir senha em claro. |
| P0.4 — Catálogo e detalhe de rede | P0.1–3 | 3–5 h | Modificar `src/routes/index.tsx`, `src/routes/nfts.$nftId.tsx`, home e componentes de catálogo; criar serviços/hooks do catálogo e favoritos | Busca/filtros/sort/página na URL; refresh/histórico; combinações/reset de página; chaves com parâmetros e AbortSignal; detalhe válido/404/esgotado; favoritos persistentes com atualização otimista e rollback. |
| P0.5 — Carrinho e cotação | P0.1–4 | 3–5 h | Modificar `src/routes/carrinho.tsx`; criar `src/features/cart/*`, `src/features/quote/*` | Adicionar/alterar/remover respeitando edição/estoque; merge visitante/login; persistência; cupom aplicar/remover/inválido/expirado; resumo reproduz resposta da cotação; não recalcular com number em ETH. |
| P0.6 — Checkout, carteiras mínimas e pedidos | P0.2–5 | 5–8 h | Modificar `src/routes/checkout.tsx`, `src/routes/carteiras.tsx`, `src/routes/pedido.confirmacao.tsx`; criar `src/features/checkout/*`, `src/features/orders/*`, `src/features/wallets/*` | Formulário/revisão; carteira/rede e simulação conexão/recusa/desconexão; revalidar cotação e exigir aceite se mudou; chave de idempotência retida após timeout; mesma tentativa retorna mesmo pedido; conteúdo diferente conflita; pendente/confirmado/recusado; recibo imutável; nunca afirmar sucesso antes da resposta; limpar somente quantidades compradas. |
| P0.7 — Socket.IO real e recuperação | Protótipo cedo; integração final após P0.2/3/5/6 | 4–7 h | Criar `src/lib/socket.ts`, `src/mocks/socket.ts`, contratos e hooks/subscriptions; modificar Query/carrinho/detalhe/pedidos; ajustar dependências somente na tarefa de implementação | Usar socket.io-client e binding MSW compatível; documentar transporte/limitações; nft.updated e order.updated com identidade/versão; deduplicação, ordem e estado terminal; reconciliar REST na reconexão; isolar usuário e liberar listeners. Demonstrar preço mudando com NFT no carrinho e cotação antiga bloqueada. |
| P0.8 — Provas executáveis e ferramentas obrigatórias | Incremental desde P0.2; fechar após P0.7 | 4–7 h | Modificar `playwright.config.ts`, `tests/home.spec.ts`, `package.json`; criar fixtures de cenário e specs de compra/auth/realtime; configuração/comando Lighthouse; iniciar baselines | Preservar testes úteis; remover expectativas de indisponibilidade somente quando comportamento real mudar. Chromium desktop/mobile com sucesso, recusa, duplo clique, timeout, refresh/reconexão, dois usuários, preço alterado, evento antigo/duplicado. REST pelo MSW e eventos pelo socket; HTML e traces; script de tipos/teste/Lighthouse. Realizar primeira medição sem inventar nota. |

A soma das etapas P0 é **28–46 h**. P0.8 não adia toda a validação até o fim: escrever/executar os testes junto de cada fatia.

### Portões de validação P0

- Confirmar chamadas Axios interceptadas por handlers MSW e eventos percorrendo socket.io-client. Dependência instalada ou callback injetado não serve como prova.
- Usuário A não consulta nem recebe eventos de recursos de B. Logout encerra subscriptions e remove cache privado. Reabrir sessão após refresh e expiração preserva apenas o contexto permitido.
- Catálogo → detalhe → carrinho → cotação → revisão → pedido pendente → resposta/evento confirmado → recibo. Acesso direto a confirmação sem pedido confirmado deve ser impedido ou mostrar estado coerente, sem sucesso fictício.
- Repetir clique e enviar novamente após timeout: um único pedido. Reutilizar chave com payload diferente: conflito explícito.
- Falha de pagamento mantém carrinho. Sucesso remove apenas as quantidades compradas; itens adicionados depois da tentativa permanecem.
- Alteração em NFT invalida cotação; UI informa mudança e exige nova confirmação. Duplicatas/eventos antigos não reaplicam limpeza nem revertem pedido terminal.

## P1 — telas completas, falhas, persistência, visual obrigatório e entrega

| Tarefa | Dependências | Estimativa | Arquivos | Validação |
|---|---|---|---|---|
| P1.1 — Perfil, avatar, senha e carteiras completas | Sessão/MSW P0 | 3–5 h | `src/routes/perfil.tsx`, `src/routes/carteiras.tsx`, features correspondentes e handlers | Validação cliente/API, conflito, permissões, principal/secundária e persistência após refresh; erros associados ao campo. |
| P1.2 — Matriz de falhas e persistência de todos os recursos | Domínios P0 | 3–5 h | `src/mocks/scenarios.ts`, db/reset, handlers, hooks e specs | Sucesso/vazio, latência variável, respostas fora de ordem, conexão/4xx/5xx, sessão expirada, cadastro conflitante, cupons inválido/expirado, preço/estoque, timeout, confirmado/recusado; reset reproduz estado conhecido. |
| P1.3 — Figma, assets e composição em todas as telas | Acesso ao Figma já disponível; dados P0 | 5–8 h | Header/footer/layout, `src/index.css`, `src/features/catalog/components/*`, todas as rotas, `public/assets/*` | Usar cópia indicada pelo usuário; registrar divergência de link no enunciado. Importar imagens/fontes; desktop/mobile; corrigir hero/header, tabs/filtros, cards e barra inferior mobile; não criar páginas editoriais fora do escopo. Registrar substituições. |
| P1.4 — Acessibilidade, estados e skeletons | Telas P0/P1.1 | 2–4 h | UI, formulários, layout, skeletons/CSS e testes | Shimmer real, dimensões reservadas, reduced motion; foco visível e retorno em diálogo/drawer; teclado, labels/erros, aria-live em mutations/eventos; zoom/overflow; 390/768/1440 em todas as telas. |
| P1.5 — Deploy, documentação e reprodução | Build funcional P0, assets P1.3 | 3–5 h | `README.md`, novo `ARCHITECTURE.md`, `.env.example`, `package.json`, configuração do host se necessária | URL pública obrigatória, mesma revisão do código, mocks e tempo real ativos; acesso direto/refresh; README com setup, credenciais fictícias, cenários/reset/falhas; arquitetura com contratos, sessão, carrinho, cache/retries, reconciliação e desvios do Figma. Executar npm ci em checkout limpo e checks. |

O deploy não deve ser deixado para a última hora: publicar uma versão de verificação assim que a fatia P0 executar, e atualizar/validar a versão final. Ausência de arquivo específico da Vercel não prova ausência de hosting; neste momento não há URL informada/documentada para validar. Não foi autorizado publicar durante esta auditoria.

## P2 — refinamentos, regressão e otimização

| Tarefa | Dependências | Estimativa | Validação |
|---|---|---|---|
| P2.1 — Refinamento visual e regressão automatizada final | Telas e assets estáveis | 2–3 h | Baselines versionadas e toHaveScreenshot para início/detalhe/carrinho/pagamento, dados estáveis e relógio controlado; inspecionar diferenças antes de aceitar baseline. Screenshots soltas atuais não são regressão visual. |
| P2.2 — Lighthouse completo e otimizações guiadas por resultado | Build otimizado e mocks completos | 3–5 h | Início/detalhe × mobile/desktop × 3 = 12 medições; medianas por categoria; Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90; LCP/CLS/TBT, HTML/JSON, versões/ambiente/condições. Usar funcionalidades, fontes e imagens reais da entrega. Explicar causas se abaixo da meta; medir novamente somente após mudança relevante. |
| P2.3 — Manutenção e avisos | Fluxos estáveis | 1–2 h | Avaliar strict TypeScript progressivamente, lint Fast Refresh, aviso futuro __dirname e imports/fontes/assets de template. Não remover arquivos nesta auditoria; otimizar somente com validação e sem sacrificar requisitos. |

A classificação P2 indica refinamentos e fechamento de medições; **não torna Lighthouse ou regressão visual opcionais**. Instalação, configuração e primeira execução devem entrar em P0.8, pois fazem parte da stack obrigatória. Oito testes passando não compensam cobertura funcional ausente.

## Sequência recomendada até 06/11

- **Hoje, 05/11:** começar por P0.1–3 e um protótipo MSW/Socket.IO; em seguida conectar catálogo e detalhe. Marco esperado de uma próxima tarefa bem delimitada: navegação existente exibe dados obtidos por Axios/MSW, Query usa chaves/parâmetros corretos e existe cenário determinístico de erro/vazio. Se essa base falhar, resolver antes de ampliar telas.
- **Assim que houver base de rede:** carrinho/cotação e compra idempotente, com um teste que percorra o recibo e preserve a tentativa após timeout. Resolver proteção de sessão e isolamento desde o primeiro recurso privado.
- **Antes de fechar a entrega em 06/11:** exercitar preço/estoque e pedido pendente via Socket.IO, publicar a mesma versão, executar regressão desktop/mobile, documentar limitações e rodar medições sobre o build final. Reservar **2–3 horas de estabilização**, dentro das estimativas, sem novas funcionalidades nessa janela.
- Se o tempo disponível terminar antes dos portões P0, registrar quais cenários não passaram e não apresentar telas placeholder ou snapshots visuais como fluxo funcional. Priorizar os bloqueios comprovados sem prometer atendimento integral.

O usuário não informou horário final em 06/11. Este plano não presume 23h59 nem altera o prazo. A estimativa total excede o intervalo restante para uma única pessoa; reduzir escopo de uma próxima tarefa ajuda a produzir incrementos verificáveis, mas não elimina requisitos oficiais.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| MSW + protocolo Socket.IO não integrado | Eliminatório de stack/tempo real | Protótipo cedo com socket.io-client real; fixar transporte compatível; documentar limitações e comprovar tráfego no teste. |
| Checkout implementado só com navegação | Fluxo principal não funcional; confirmação indevida futura | Pedido como máquina de estados baseada na simulação; rota de recibo consulta recurso e exige estado confirmado. |
| Falta de isolamento e limpeza da sessão | Dados privados de usuário anterior | Chaves por usuário, autorização nos handlers, cancelamento/limpeza, listeners por sessão e teste A/B com acesso direto. |
| Timeout e eventos duplicados | Compras repetidas ou carrinho limpo indevidamente | Idempotência persistente, payload fingerprint, consulta de recuperação e efeitos apenas uma vez por versão terminal. |
| ETH como number | Totais/recibos incorretos | Strings no transporte; decimal.js ou unidade inteira; política de arredondamento no domínio e cotação autoritativa. |
| Testes atuais verdes dão falsa segurança | Fluxos sem cobertura | Acrescentar operações via rede, negativas e isolamento; manter distinção entre componente e E2E integrado. |
| Escopo × prazo | Entrega incompleta | Fatias por dependência, estimativas revisadas a cada marco, priorizar P0 e reportar lacunas sem prometer conformidade. |
| Figma original e cópia têm links diferentes | Referência visual divergente | Usar cópia expressamente indicada; registrar desvio, conferir frames e assets nela; não alegar equivalência não verificada. |
| Deploy/instalação limpa não comprovados | Avaliador não executa os fluxos | Checkout limpo com npm ci, URL pública correspondente ao SHA, fallback SPA e mocks/eventos no build. |

## Arquivos para a próxima tarefa

**Recomendação imediata: integração REST/MSW/Query do catálogo com contratos compartilhados, cenários determinísticos e preparo do domínio.** Não começar por refazer o projeto ou apenas polir a home.

Modificar na próxima implementação: `src/main.tsx` (ativação condicional do MSW), `src/features/catalog/types.ts` (DTOs/domínio), `src/routes/index.tsx` (consulta e estado da URL), `src/features/catalog/home-page.tsx` (dados/controles/retry reais), `src/lib/query-client.ts` (política), `package.json` (comandos necessários, sem esconder erros) e documentação.

Criar nessa tarefa: `src/lib/api.ts`, `src/lib/query-keys.ts`, `src/contracts/nft.ts`, `src/contracts/error.ts`, `src/mocks/browser.ts`, `src/mocks/db.ts`, `src/mocks/fixtures.ts`, `src/mocks/scenarios.ts`, `src/mocks/reset.ts`, `src/mocks/handlers/nfts.ts`, `src/features/catalog/api.ts`, `src/features/catalog/queries.ts`, `.env.example` e testes integrados do catálogo. Esses nomes são **propostas**, não arquivos presentes.

Depois, conforme dependências: rotas e features de autenticação, detalhe, carrinho, cotação, checkout, pedidos, carteiras, perfil; cliente/socket mocks; testes de fluxo e configuração Lighthouse. Não editar manualmente `src/routeTree.gen.ts`: deixar o gerador refletir as rotas.

## Evidência que deve acompanhar cada incremento

Executar `npm run build`, `npm run lint`, verificação de tipos e os testes afetados; registrar resultados reais e limites. Demonstração manual deve observar a UI e respostas/operações da simulação. Testes REST devem passar pelos handlers MSW; tempo real pelo cliente Socket.IO; nunca validar apenas que uma página ou título existe. Ao finalizar, atualizar o checklist requisito a requisito, promovendo a VALIDADO somente o comportamento efetivamente comprovado.
