# Evidências da revisão desktop/mobile

Código medido e condições em lighthouse/summary.json. Checks e commits em checks.json; execução integral e retestes estão separados, sem somar execuções repetidas como casos distintos. Logs de falhas intermediárias/traces no ZIP; não representam a aprovação final.

- Comparações lado a lado: comparisons/. Hero desktop1160×450 e mobile366×190; demais capturas usam dados reais, não os valores ilustrativos do Figma.
- Oito telas ×3larguras: ../../tests/__screenshots__/visual.spec.ts. Home ampla: ../../tests/__screenshots__/desktop-visual.spec.ts.
- Recibos em screenshots/ são capturas de pedidos confirmados pela API; não baselines fabricadas.
- Inventário de43PNGs e prova de preservação das36fixtures em JSON; verify-fixtures.mjs executa a comparação somente de leitura a partir da raiz (Node24 como no executor, stripTypeScriptTypes experimental).
- Lighthouse:12HTML+12JSON completos em lighthouse/reports.zip; extraia no mesmo diretório para abrir os nomes referenciados por samples.json. Medianas/amostras/configuração/ambiente permanecem fora do ZIP. Summaries anteriores preservam a evolução, sem escolher melhor amostra.
- Relatórios PlaywrightHTML completos em playwright-reports.zip. Extraia e abra cada pasta/index.html ou use npx playwright show-report <pasta>.

| Página | Perfil | P | A | BP | SEO | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|---|---|
| home | mobile | 81 | 100 | 96 | 92 | 4114 | 0.0000 | 278 |
| home | desktop | 99 | 100 | 96 | 92 | 910 | 0.0002 | 0 |
| detail | mobile | 81 | 100 | 96 | 92 | 4142 | 0.0000 | 288 |
| detail | desktop | 99 | 100 | 96 | 92 | 877 | 0.0009 | 0 |

Performance mobile continua abaixo de90; demais metas atingidas. Produção deste SHA não validada. Relatório principal: ../../docs/RESPONSIVE_FIDELITY.md.
