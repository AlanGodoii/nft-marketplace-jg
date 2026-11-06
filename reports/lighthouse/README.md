# Lighthouse — 12 medições reais

Configuração: lighthouse.config.mjs. Execução: npm run lighthouse (preview otimizado em execução). Versões/ambiente/configuração efetiva e falhas por amostra em samples.json e summary.json; cada medição possui HTML e JSON completos.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms | Todas as metas? |
|---|---|---|---|---|---|---|---|---|---|
| home | mobile | 95 | 100 | 96 | 91 | 761 | 0.0003 | 272 | Sim |
| home | desktop | 100 | 100 | 96 | 91 | 252 | 0.0002 | 0 | Sim |
| detail | mobile | 84 | 100 | 96 | 91 | 4095 | 0.0000 | 197 | Não |
| detail | desktop | 99 | 100 | 96 | 91 | 906 | 0.0000 | 7 | Sim |

Medianas de três execuções por cenário. Ambiente local, não deploy público. Assets originais ausentes continuam nos slots reais; nenhuma funcionalidade foi removida para medição. Repetir após incorporar assets e publicar a versão final.
