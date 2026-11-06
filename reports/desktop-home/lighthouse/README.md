# Lighthouse — Home desktop com artes originais

Três medições reais sequenciais, build demo otimizado em http://127.0.0.1:4176, sem outros testes de navegador em execução. Aplicação f1cb945; MSW/Socket.IO e quatro artes presentes, sem simplificação para auditoria. Configuração lighthouse.config.mjs, perfil desktop dense4G/simulate com storage reset. Condições/versões/config efetiva e falhas de cada amostra em summary.json e HTML/JSON completos.

| Mediana | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms |
|---|---|---|---|---|---|---|---|
| 3execuções |99|100|96|92|899.3|0.000176|0|

Todas as metas desta Home desktop foram alcançadas. Não revalida o detalhe/mobile nem mede o deploy público. Console registra401 de sessão anônima e robots.txt segue recebendo fallbackHTML, limitando BP/SEO; não foram mascarados para pontuação. Cadeia inicial JS/MSW e descoberta do LCP continuam oportunidades de melhoria. As três amostras tiveram as mesmas notas99/100/96/92.
