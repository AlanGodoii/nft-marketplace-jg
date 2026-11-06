# PR8 — atualização após integração do PR7

06/11/2026. O proprietário integrou PR7 à main1b2edee43cf8e83adec6e9ced562392bb6fcae82 depois da criação do PR8 em86728c2171932a1e778cc675aa7aeee65105c9bd. A main foi incorporada à branch feat/fidelidade-home-desktop por merge comum, preservando ambos os históricos, sem forcepush e sem integrar o PR8 à main.

Seis conflitos resolvidos:

- .gitattributes: preservadas regras dos relatórios Lighthouse/desktop e publicação.
- ARCHITECTURE.md e README.md: mantidos Home desktop/assets e documentação da validação pública; contexto atualizado para PR7 já integrado.
- docs/REQUIREMENTS_CHECKLIST.md: preservadas evidências DESK-01 e PUB-01, incluindo limites de cada rodada e distinção entre a publicação anterior e a nova Home.326VALIDADO/18PARCIAL, sem transformar pendências visuais em aprovação.
- playwright.config.ts: suíte local separa visual.spec, desktop-visual.spec e published.spec; nenhuma suíte removida.
- tsconfig.e2e.json: ambos os configs desktop/published incluídos na tipagem.

package.json mesclou os comandos test:desktop e test:published. Os testes, helper TLS e artefatos do PR7 foram preservados. As duas expectativas do título em tests/published.spec.ts agora aceitam o título desktop original e o texto mobile anterior; sem excluir asserções de negócio.

`git diff --exit-code 86728c2 -- src`: nenhuma diferença na aplicação. Rotas,36NFTs, catálogo, compra/conta e tempo real permanecem como no PR8. Não houve redesign nesta correção.

Validação real após resolver:

| Comando | Resultado |
|---|---|
| npm run typecheck |Código0. |
| npm run lint |Código0, dois avisos FastRefresh preexistentes. |
| npm run build |Código0. |
| npm run build:demo |Código0. |
| npm run test:e2e -- --list |213casos locais preservados. |
| npm run test:published -- --list |32casos públicos preservados; não reexecutados contra HTTPS nesta correção. |
| Preview4176: desktop-home.spec.ts +deployment.spec.ts,1worker |11/11aprovados,34.1s, Home1280/1440/1920, conta/busca/carrinho e navegação/refresh desktop/mobile. |
| Preview4176: npm run test:visual -- --workers=1 |12/12aprovados,22.5s, snapshots:none, sem alterarPNGs. |
| Preview4176: npm run test:desktop -- --workers=1 |3/3aprovados,8.7s, snapshots:none. |

Não foram repetidos a suíte integral ou Lighthouse: src e baselines permaneceram idênticos. Resultados anteriores com timeout continuam documentados em DESKTOP_HOME_FIDELITY.md, sem serem convertidos em aprovação. Logs desta resolução ficam em work/pr8-conflicts. A prontidão Preview mostrada pelo proprietário não substitui validação pública do novo SHA.
