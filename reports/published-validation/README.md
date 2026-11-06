# Implantação pública — evidências

URL: https://nft-marketplace-jg-psi.vercel.app/

**32/32 testes aprovados em 2,2 minutos**, desktop/mobile, em06/11/2026 01:45–01:47 America/Sao_Paulo.

Source da Vercel: **ad6dfbc1141fa27aa41b2ec69632d49aea8ddc8c**, main/merge PR6, contendo a Etapa5 final36bd750. Confirmação através de capturas/SHA fornecidos pelo proprietário e histórico GitHub/Git; não por um endpoint de versão inexistente no site.

- [summary.json](summary.json): resultados individuais, horário/ambiente/proveniência.
- [http-routes.json](http-routes.json):10rotas e worker HTTPS.
- [playwright.log](playwright.log): saída real da execução.
- [html/index.html](html/index.html): relatório completo; após checkout, abra com `npx playwright show-report reports/published-validation/html`.
- [receipt-desktop.png](receipt-desktop.png) e [receipt-mobile.png](receipt-mobile.png): recibos confirmados na implantação real.
- [home-desktop.png](home-desktop.png): Home pública.

Reprodução: TEST_BASE_URL=https://nft-marketplace-jg-psi.vercel.app/ npm run test:published -- --workers=2. Detalhes de TLS/proxy, escopo dos oito itens, interpretação dos resultados e limitações em [PUBLISHED_VALIDATION.md](../../docs/PUBLISHED_VALIDATION.md).

Os testes não realizaram pagamento/blockchain real: exercitaram a simulação MSW publicada. Não houve falhas na suíte final para produzir novos traces de erro. Os206testes locais e Lighthouse não foram reexecutados contra o host nesta rodada. Assets/fidelidade e a meta de performance anterior continuam pendentes; disponibilidade futura não é garantida por uma janela pontual.
