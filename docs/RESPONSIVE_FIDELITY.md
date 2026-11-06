# Revisão visual Kurio — desktop e mobile

## Base e referências

Branch `feat/fidelidade-completa-kurio`, criada sobre `5dc1363` (correção de navegação do PR9), que contém main `1945001` (PR8 e Etapas1–5). Sem recriar projeto, alterar IDs, nomes, preços, estoques ou regras financeiras. A main remota foi conferida em06/11/2026. O PR9 ainda está aberto; sua correção está preservada nesta branch.

Referências autorizadas:21PNGs de `junglegaming.zip`,22PNGs de `jgmobile.zip` e screenshots enviados pelo proprietário. Não foram repetidas chamadas ao Figma bloqueado. Os PNGs de telas inteiras servem apenas de referência, nunca de interface rasterizada.

## Alterações

- Header desktop KURIO compartilhado em todas as rotas, navegação Início/Mercado/Criadores/Aprenda, busca real, carrinho e menu privado. O indicador Mercado acompanha detalhe/carrinho/checkout/pedido. Footer compartilhado nos fluxos de compra; perfil/carteiras/auth seguem os frames sem footer.
- Home mobile com busca/filtros, banner compacto e arte original, abas, cards de duas colunas escalonados e navegação inferior. Ordenação e atualização continuam acessíveis; filtros mantêm os mesmos parâmetros da URL.
- Galeria com imagens, miniaturas, ampliação, edições reais em pills/select, stepper, favoritos e compra. Desktop usa galeria/informações em colunas; mobile usa imagem e folha arredondada.
- Carrinho com thumbs originais, stepper limitado pelo estoque, edição numérica validada, remoção, cupom e resumo. O botão de salvar quantidade aparece no mobile quando o campo foi alterado; os botões +/- gravam pela API. Totais vêm exclusivamente da cotação.
- Checkout com dados do colecionador, thumbs e resumo da API, conexão/revisão explícitas preservadas. No mobile, dados do colecionador e itens ficam em seções expansíveis, erros de estoque abrem os itens automaticamente e carteiras reais/provedores podem ser selecionados; a troca de provedor utiliza PATCH da carteira e invalidação existentes. Não há conexão de carteira/blockchain real.
- Recibo com envelope original, metadados, itens e totais históricos. Só aparece após estado confirmed na API; pendente, recusado e nenhum pedido continuam estados distintos e honestos.
- Login/cadastro desktop em modal sobre catálogo real; mobile em tela própria com wordmark, campos, visibilidade da senha e botões originais. OAuth/recuperação informam indisponibilidade, sem fingir sucesso.
- Perfil/carteiras com sidebar e campos em duas colunas no desktop; formulários adaptados e navegação de conta no mobile. Dados adicionais do perfil ficam em disclosure acessível. Avatar, senha e persistência continuam reais.
- Favoritos usam os mesmos cards/imagens e os mesmos handlers/rollback, sem nova fonte de dados nos componentes.

## Assets e associações

As quatro artes otimizadas de `public/assets/figma/home/` agora atendem todas as telas e viewports. `src/lib/artwork.ts` centraliza a associação de apresentação; a API enriquece registros antigos sem resetar dados e `NftImage` recupera apenas a arte de snapshots históricos. Valores do recibo não são reescritos. Emerald usa o macaco verde; Sage/Cosmic/Violet usam o roxo; Neon/Ivory usam o de terno. Golden permanece nas seções editoriais correspondentes. Nenhum NFT foi renomeado para se passar pelo item ilustrativo do print.

Três recortes gráficos adicionais em `public/assets/figma/common/`: envelope de agradecimento, Google e Facebook. Fontes/recortes/dimensões documentados no README da pasta. Sem duplicação por NFT e sem imagens externas.

## Diferenças explícitas

- O catálogo real mantém36NFTs, três coleções e seis itens por página; os prints mostram nomes/contagens/preços ilustrativos diferentes. Estes dados não foram copiados para contradizer a API.
- A galeria reutiliza a mesma arte nos quatro slots: os anexos não contêm quatro ângulos individuais. Não são apresentados ângulos inventados. Descrição, disponibilidade e edições seguem o contrato real.
- Nenhuma avaliação19/nota4.8, endereço de contrato, royalties ou propriedade em blockchain foi inventada. O layout acomoda esses metadados quando existirem no contrato.
- Quantidade numérica, ordenação, refresh, estados de rede, consentimento de revisão, nome de usuário/papel de carteira e salvamentos de recursos distintos continuam presentes quando necessários ao fluxo. Podem adicionar controles/altura em relação aos frames estáticos.
- Perfil, carteiras e confirmação não possuem frames mobile individuais no ZIP; a adaptação utiliza os tokens/componentes das demais telas, sem alegar equivalência com um frame inexistente.
- O PNG `pagamento com carrteira/Content.png` é uma cópia do conteúdo do carrinho. O pagamento mobile usa o screenshot fornecido e os dados de carteiras reais, sem inventar uma segunda carteira do usuário.
- Vetor separado do logo, ícones sociais em vetor e ângulos individuais de NFTs ainda podem ser exportados manualmente. As artes disponíveis foram integradas; acesso ao MCP não é condição para executar o app.

## Validação e publicação

Resultados desta revisão serão registrados abaixo somente após execução. Resultados históricos de PR8/Etapa5 não aprovam automaticamente esta versão. Baselines são comparações locais da aplicação, não um certificado de igualdade pixel a pixel com screenshots escalados do Figma.

Não houve deploy desta branch nem merge automático. Após revisar e integrar o PR na main, a Vercel configurada para main deve gerar produção. Conferir Source/SHA no painel e executar `TEST_BASE_URL=https://nft-marketplace-jg-psi.vercel.app npm run test:published` (PowerShell: definir `$env:TEST_BASE_URL` antes). Preview de PR pode ser avaliado antes do merge; não confundir Ready com compra validada.


## Correções identificadas durante a regressão

As rodadas intermediárias não foram tratadas como aprovação:70passaram/7falharam/2interrompidos/135nãoexecutados em dev;105passaram/9falharam/2interrompidos/102nãoexecutados em uma rodada preview interrompida. A reconstrução da pasta servida durante essa rodada produziu404transitórios e invalidou sua utilização como resultado final. A validação definitiva utiliza build fixo, sem recompilar durante os testes.

Uma rodada completa intermediária obteve211/218, com7falhas: overflow sob CSS zoom200%, sobreposição de atualização sobre Limpar filtros mobile, helpers acionados antes da montagem de disclosures, navegação antes da conclusão da mutation de favorito e aviso de estoque dentro de disclosure fechado. Foram corrigidos o reflow, a posição do controle, a espera por montagem/sucesso real e a abertura automática de itens indisponíveis. A repetição específica seguinte aprovou15/17; os2casos novos restantes identificaram feedback de salvamento perdido ao remontar a carteira vinculada. O componente agora mantém sua identidade e sincroniza campos pela resposta, conservando o feedback acessível. Logs e traces preservam essas falhas; nenhuma asserção foi removida nem timeout ampliado para mascará-las.

As alterações de seletores refletem os textos/controles do novo layout (Entrar, Criar perfil, Comprar, perfil do colecionador e menu de conta mobile). Asserções de API, estoques, precisão, isolamento e resultados de compra continuam exigidas. A busca de resposta do catálogo distingue a página6da página9do fundo de autenticação.

## Resultados efetivos — fechamento

Código final medido: `6841f29e6806aa05c093bb53eab51952cf864ff3`. Nenhum handler, regra financeira, idempotência ou protocolo Socket.IO foi substituído para produzir as capturas.

| Verificação | Resultado real |
|---|---|
| TypeScript | Aprovado; inclui aplicação, testes e configurações. |
| Lint | Aprovado; dois avisos Fast Refresh preexistentes em button/badge. |
| Build padrão / demo | Ambos aprovados com os mocks configurados; aviso futuro Vite __dirname/configLoader registrado. |
| Rodada integral no build f5bd309 | **224/224**,9.9min; desktop/mobile. Quatro casos de fixture de desenvolvimento executados separadamente: **4/4**,8.9s. |
| Retestes após refinamentos | **80/80** perfil/checkout/axe; **34/34** composição; **46/46** catálogo/Home; **5/5** acesso/axe; **13/13** detalhe; **12/12** imagens/carteiras; **7/7** edição/esgotamento/axe. Sem remover asserções ou ampliar timeouts. |
| Visual estrito final | **24/24**,40.0s,390/768/1440,zero tolerância/máscaras; mais **3/3** Home1280/1440/1920 na repetição definitiva. |
| Todas as telas desktop | **2/2** cenários finais, nove rotas em1280/1920, sem overflow. |
| Fixtures |36NFTs gerados idênticos à main1945001 antes do enriquecimento de arte; hashes antes/depois iguais em fixture-preservation.json. |
| Capturas adicionais | Hero desktop1160×450 e mobile366×190;414/1440 sem erros JS/overflow; arte Emerald450px carregada de arquivo original. |

A rodada integral foi realizada no commit indicado, seguida de retestes dos arquivos/telas efetivamente alterados. **Não se declara uma única rodada integral228/228 no último SHA.** Os casos de catálogo que importam fixtures pelo Vite são exercitados em dev; os demais executam o build otimizado. Publicação HTTPS deste código ainda não validada.

### Baselines revisadas

A primeira comparação produziu12diferenças intencionais nas telas anteriores,12baselines inexistentes e3diferenças na Home desktop. Foram inspecionados os exports e as capturas: imagens antes ausentes, header compartilhado, grade/banner mobile, folhas de detalhe, tabela do carrinho, pagamento, modal de acesso e formulários de conta. Os12PNGs novos cobrem login/cadastro/perfil/carteiras; os15anteriores foram revisados por mudanças reais. O último ajuste das edições atualizou seletivamente apenas os3baselines de detalhe, seguido de24/24em modo estrito. Nenhuma máscara ou tolerância foi adicionada. Hashes e ações em baseline-review.json.

### Lighthouse final — três medições por cenário

| Página | Perfil | P | A | BP | SEO | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|---|---|
| home | mobile | 81 | 100 | 96 | 92 | 4114 | 0.0000 | 278 |
| home | desktop | 99 | 100 | 96 | 92 | 910 | 0.0002 | 0 |
| detail | mobile | 81 | 100 | 96 | 92 | 4142 | 0.0000 | 288 |
| detail | desktop | 99 | 100 | 96 | 92 | 877 | 0.0009 | 0 |

A/100,BP/96,SEO/92 atingem as metas; desktopP99 também. **Performance mobile81na Home e81no detalhe permanece abaixo de90**. LCP cerca de4.1s e TBT278/288ms no perfil simulado, com CLS0. As artes originais e todos os mocks/fluxos permanecem carregados. A priorização eager/high da primeira dobra e da imagem principal foi aplicada a todos os usuários, sem alteração visual (27comparações estritas aprovadas); não gerou ganho mensurável nas medianas. Summaries anteriores preservados; não se escolheu apenas a melhor amostra.

Relatórios HTML/JSON completos no ZIP Lighthouse; configurações efetivas, ambiente, amostras e medianas fora do ZIP. Investigar a cadeia inicial JS/MSW e o trabalho de CPU em nova tarefa, preservando worker.start antes da avaliação do Engine.IO. Medições são locais, não da Vercel. Não equivalem a nota da Jungle Gaming.

### Consulta das capturas

Comparações lado a lado em [reports/responsive-fidelity/comparisons](../reports/responsive-fidelity/comparisons). Os dados reais diferem dos itens ilustrativos: não se ocultaram itens, IDs, valores ou controles para fingir equivalência. Baselines das oito telas em tests/__screenshots__/visual.spec.ts e Home ampla em desktop-visual.spec.ts; recibos reais confirmados e capturas414px em reports/responsive-fidelity/screenshots.

### Validação no VSCode e Vercel

1. Salve as alterações locais antes de trocar de branch; use `git status` para conferi-las.
2. Execute `git fetch origin` e `git switch --track origin/feat/fidelidade-completa-kurio` (se já existir: `git switch feat/fidelidade-completa-kurio` e `git pull --ff-only origin feat/fidelidade-completa-kurio`).
3. Execute `npm ci` e `npm run dev`; abra a URL exibida. Alice: alice@kurio.test / Kurio123!; Bob: bob@kurio.test / Kurio123!.
4. Revise o PR. Ele inclui a correção do PR9; não é necessário integrar duas versões divergentes do header. Nenhum merge foi feito por esta tarefa.
5. Após a integração manual na main, aguarde a produção Vercel. Build `npm run build:demo`, saída `dist`, fallback/worker existentes preservados. Confira Source/SHA da nova implantação.
6. Valide refresh, login, compra e eventos na URLHTTPS; execute `TEST_BASE_URL=https://nft-marketplace-jg-psi.vercel.app npm run test:published` (no PowerShell, `$env:TEST_BASE_URL="https://nft-marketplace-jg-psi.vercel.app"` antes do comando). Não confunda Ready/Preview com fluxo público aprovado.
