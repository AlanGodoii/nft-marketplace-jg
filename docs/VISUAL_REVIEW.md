# Revisão visual — Etapa 5

## Referência e limite de evidência

Arquivo solicitado: Th45nisl2USULS1r8msoYo. O original do enunciado tem outra chave; a cópia solicitada continua sendo a referência. O Figma MCP retornou limite do plano Starter tanto em get_metadata(0:1) quanto em download_assets(2:2) nesta etapa. Não houve novo acesso aos nove frames, nem recuperação dos assets403. Não se afirma comparação pixel a pixel ou finalização visual integral.

A revisão preserva os tokens e componentes existentes; contexto/screenshots obtidos nas etapas anteriores são descritos em STAGE3_API.md e STAGE4_CHECKOUT_SOCKET.md. Sem novo contexto de alta fidelidade, não se redesenham telas com proporções imaginadas. As capturas/baselines desta etapa comprovam estabilidade da implementação, não equivalência com o Figma.

## Nove telas e diferenças conhecidas

| Tela / referência conhecida | Implementação e trabalho visual restante |
|---|---|
| Home — Desktop2:2, Mobile14:5226 | Paleta escura/laranja e Roboto Mono locais, hero/grid/filtros existentes preservados. Hero e cards sem arte original; composição mobile de uma coluna difere do grid de duas colunas identificado na auditoria inicial. Navegação inferior do design ainda ausente. Não alterar sem nova conferência dos frames. |
| Detalhe — Desktop10:244, Mobile15:5536 | Galeria, informações, edições e ações funcionais. Quatro slots sem imagens originais. Conferir proporções da galeria, miniaturas e espaçamento após export. |
| Carrinho — Desktop11:1278 | Itens, cupom/resumo e quantidades funcionais. Miniaturas indisponíveis. Confirmar hierarquia e espaçamentos finos contra o frame. |
| Checkout — Desktop11:2862, Mobile16:748 | Carteira/rede, dados do colecionador, seleção/resumo e revisão responsivos. Arte dos itens indisponível; conferir composição exata dos painéis e campos. |
| Login — Desktop9:115 | Diálogo existente preservado. Não simular login social; identidade/ícones/imagens originais pendentes de export e comparação. |
| Cadastro — Desktop9:1022 | Formulário/validação funcionais; mesmos limites visuais do login. |
| Perfil — frame Desktop/Perfil do colecionador | Placeholder substituído por dados, avatar enviado pelo usuário e senha, mantendo tokens/painéis existentes. Composição exata do frame não verificada por limite MCP; mobile funcional adaptado. Não se inventa ID do frame não recuperado. |
| Carteiras — Desktop9:1670 | Gestão/conexão funcionais. Confirmar ícones das redes/provedores e espaçamentos contra exports. |
| Confirmação — Desktop11:4385 | Resultado e recibo imutável responsivos. Arte dos itens pendente; layout fino do recibo depende da comparação final. |

## Exportação manual necessária

No Figma, selecione cada camada indicada abaixo e use Export ou Copy/Paste as SVG para vetores; envie os arquivos originais, não screenshots de tela inteira como imagens do produto.

| Grupo | Exportar | Destino previsto / validação |
|---|---|---|
| Marca | Logo/wordmark Kurio e versões desktop/mobile presentes no arquivo | public/assets/brand; comparar dimensões intrínsecas e substituir somente pelo asset exato. Wordmark atual é texto, não o SVG original. |
| Hero | Arte principal/destaque da Home em desktop/mobile, incluindo variantes se forem distintas | public/assets/nfts ou hero; vincular à fixture correspondente após mapear nome/edição. Não duplicar arte arbitrariamente pelos36NFTs. |
| NFTs | Cada imagem única dos cards do catálogo e detalhe; quatro vistas/miniaturas realmente presentes no frame de detalhe | public/assets/nfts; registrar mapa filename→nftId/gallery. Fixtures mantêm src:null até o mapa correto estar disponível. |
| Coleções/criadores | Avatares/ícones de coleção e criador usados no detalhe/cards | public/assets/creators e collections; não usar avatar de teste no produto. |
| Redes/carteiras | SVGs originais Ethereum/Polygon/Solana e provedores realmente desenhados | public/assets/icons; preservar proporção e verificar cada callsite. |
| Conta | Ícones/marca de acesso social ou ilustrações efetivamente presentes nos frames login/cadastro/perfil | public/assets/account; recurso não implementado deve continuar identificado como indisponível. |
| Referência | Exports completos PNG dos nove frames desktop e dos frames mobile disponíveis, com nome/ID/dimensões | Apenas referências de QA, nunca usadas como fundos substituindo uma interface funcional. |

Fontes Roboto Mono400/500/700 já estão locais em public/assets/fonts; não são necessários downloads de fontes de procedência incerta. A variante Geist do template não é apresentada como fonte original do Figma.

## Ajustes verificáveis desta etapa

- Foco visível passou a cobrir textarea, incluindo biografia/observações.
- Perfil reutiliza painéis, inputs, erros, contraste e grid responsivo existentes.
- Título, descrição e theme-color da demonstração definidos; preload da fonte local utilizada, sem trocar assets.
- Regressão visual e auditoria automatizada de contraste/semântica serão registradas com resultados reais na entrega. Baselines não ocultam slots de arte ausente e não removem funções para melhorar medições.
