# Evidências — Home desktop

Referências PNG fornecidas pelo proprietário em `reference/`; não são assets da UI. Capturas reais da aplicação em `screenshots/`, larguras1280/1440/1920. `home-before-1440.png` é a captura reduzida do teste inicial em mainad6dfbc, antes das mudanças. Comparações de seis seções estão em `comparisons/`.

`attachment-inventory.json` contém todos os21PNGs do ZIP (inclusive demais telas, não redesenhadas nesta tarefa). Arte original recortada/otimizada e manifest ficam em `public/assets/figma/home/`.

As baselines Playwright versionadas em `tests/__screenshots__` representam a aplicação revisada, não o Figma. Alteração intencional limitada à Home desktop; mobile e demais telas devem continuar comparáveis às baselines anteriores.

Condições, diferenças deliberadas, limitações de assets e comandos em `docs/DESKTOP_HOME_FIDELITY.md`. Resultados reais em validation-summary.json:212/213na rodada integral(1timeout), recuperação no preview45/45, Home final7/7, baselines12/12+3/3, Lighthouse99/100/96/92. Não somar repetições como casos distintos ou declarar213/213em uma única rodada. Relatórios completos HTML/dados/viewer estão nos ZIPs playwright-*.zip; extraia em work/qa-report antes de npx playwright show-report. Traces e logs intermediários foram preservados.
