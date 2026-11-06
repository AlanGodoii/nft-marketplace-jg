# Regressão visual e acessibilidade

Execute `npm ci`, instale Chromium com `npx playwright install chromium` e rode `npm run test:visual -- --workers=1`. O servidor padrão inicia via Playwright; `TEST_BASE_URL` permite usar preview/build ou URL pública.

As12baselines em tests/__screenshots__/visual.spec.ts cobrem Home/detalhe/carrinho/checkout nas larguras390/768/1440, Linux/Chromium, escala1, altura1000, fontes locais, relógio fixo e movimento reduzido. Cada caso usa reset MSW e contexto próprio; visitante visual-guest torna a referência da cotação determinística. Não há máscaras de conteúdo nem dados fictícios nos componentes. Chromium validado:155; diferenças de versão/SO podem afetar rasterização.

`npm run test:visual` compara com zero pixels diferentes; não atualiza PNGs. Para criar somente arquivos ausentes use `--update-snapshots=missing`. Para uma mudança visual intencional, examine expected/actual/diff, selecione o caso por `--grep` e atualize somente esse caso, registrando motivo e revisão. Não aceitar todas as diferenças sem inspeção. As primeiras baselines representam a implementação real com arte indisponível, não o Figma completo; exports originais exigirão nova revisão visual explícita.

`npm run test:a11y -- --workers=1` usa axe-core nas nove telas e nas três larguras, incluindo recibo confirmado por compra MSW. Verifica também foco/teclado/zoom200%/movimento reduzido. Relatórios/capturas/traces seguem a configuração Playwright. Axe e Lighthouse não substituem testes humanos com leitores de tela ou uma análise manual integral de acessibilidade.
