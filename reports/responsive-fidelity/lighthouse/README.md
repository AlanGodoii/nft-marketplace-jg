# Lighthouse — 12 medições reais

Configuração: lighthouse.config.mjs. Execução: npm run lighthouse (preview otimizado em execução). Versões/ambiente/configuração efetiva e falhas por amostra em samples.json e summary.json; cada medição possui HTML e JSON completos.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms | Todas as metas? |
|---|---|---|---|---|---|---|---|---|---|
| home | mobile | 81 | 100 | 96 | 92 | 4114 | 0.0000 | 278 | Não |
| home | desktop | 99 | 100 | 96 | 92 | 910 | 0.0002 | 0 | Sim |
| detail | mobile | 81 | 100 | 96 | 92 | 4142 | 0.0000 | 288 | Não |
| detail | desktop | 99 | 100 | 96 | 92 | 877 | 0.0009 | 0 | Sim |

Medianas de três execuções por cenário. Ambiente local, não deploy público. Artes originais dos exports fornecidos carregadas; nenhuma funcionalidade foi removida para medição. Medições locais precisam ser repetidas no deploy da versão final.
