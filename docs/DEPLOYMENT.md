# Publicação da demonstração Kurio

## Vercel

1. Acesse https://vercel.com/new e importe `AlanGodoii/nft-marketplace-jg` pela sua conta GitHub.
2. A importação pode usar `main` inicialmente. Para publicar esta etapa antes do merge, abra **Deployments → Create Deployment**, informe a Git Reference **feat/etapa5-finalizacao** e confirme o SHA mais recente dessa branch. Essa implantação terá sua própria URL HTTPS. Não avalie a Etapa5 usando uma implantação antiga da main.
3. Framework: Vite. Root Directory: raiz do repositório. Install: `npm ci`. Build: `npm run build:demo`. Output: `dist`. Node: 24.x.
4. Defina `VITE_ENABLE_MOCKS=true` e `VITE_MOCK_SCENARIO=normal` também no painel, caso existam overrides. Não cadastre senhas/tokens reais no frontend. As mesmas flags públicas estão em `.env.production` e `.env.demo`.
5. Clique Deploy e copie a URL HTTPS. Desative Deployment Protection para o ambiente destinado ao avaliador, de modo que ele não precise de uma conta Vercel.
6. Registre URL e SHA publicado em `docs/STAGE5_DELIVERY.md` somente após as verificações abaixo. Não confundir preview local ou deploy protegido com URL pública validada.

Uma implantação Preview da Vercel pode ser usada pelo avaliador desde que esteja publicamente acessível, sem Deployment Protection. Se preferir usar o domínio de produção antes do merge, use **Promote to Production** na implantação correta, ou configure a Production Branch nas configurações de Git/Environments. Isso não exige integrar o PR na main. Após o merge revisado, volte a usar main como branch de produção.

Alternativa pelo terminal do VS Code (publica o checkout selecionado, sem fazer merge):

```powershell
git fetch origin
git switch feat/etapa5-finalizacao
git pull --ff-only
npm ci
npm run build:demo
npx vercel login
npx vercel --prod
```

Na primeira execução, selecione sua conta, vincule/crie o projeto e confirme a pasta raiz. Preserve os parâmetros de vercel.json. O login ocorre na sua conta; nenhum token precisa ser adicionado ao código. Copie a URL retornada e envie-a para a validação. Se a branch local ainda não existir, `git switch` normalmente cria o acompanhamento da branch remota homônima; se não o fizer, use `git switch --track origin/feat/etapa5-finalizacao`.

`vercel.json` configura fallback SPA e impede cache obsoleto do worker MSW. Assets existentes continuam servidos como arquivos. Não há servidor API ou Socket.IO externo: o navegador intercepta REST e WebSocket com MSW, inicializado antes do cliente Engine.IO. Endpoints usam a origem corrente; não dependem de localhost. HTTPS é necessário para Service Worker e Web Crypto.

`.vercelignore` exclui logs, relatórios e diretórios temporários do upload CLI; a Vercel gera um novo dist durante o build. `.env.production`, `.env.demo`, fontes e mockServiceWorker.js permanecem incluídos. Os relatórios Lighthouse continuam versionados no GitHub para o avaliador, sem aumentar o pacote público de execução.

Alternativa: Netlify, build `npm run build:demo`, publish `dist`; `public/_redirects` fornece fallback. Em ambos os hosts publique `mockServiceWorker.js` na raiz. APIs de mocks funcionam no navegador, portanto um curl direto a `/api/nfts` não é uma verificação da API simulada.

## Validação da URL real

Em um contexto novo do navegador, sem autenticação no provedor de hospedagem:

- Abra `/`, `/nfts/nft-002`, `/carrinho`, `/login`, `/cadastro` e atualize cada uma.
- Entre como Alice e abra/atualize `/perfil`, `/carteiras`, `/favoritos`, `/checkout`, `/pedido/confirmacao`.
- Adicione um NFT, conecte carteira simulada, revise/aceite a cotação e finalize. Aguarde o recibo confirmado pela API e verifique o carrinho.
- Verifique o indicador de atualizações ao vivo e os cenários de alteração de NFT/reconexão documentados em `STAGE4_CHECKOUT_SOCKET.md`.

Automação, após `npm ci` e `npx playwright install chromium`:

```sh
TEST_BASE_URL=https://SUA-URL-PUBLICA npx playwright test tests/deployment.spec.ts tests/checkout.spec.ts tests/realtime.spec.ts --workers=1
```

No PowerShell, defina primeiro `$env:TEST_BASE_URL="https://SUA-URL-PUBLICA"` e execute o comando `npx playwright test ...` sem o prefixo de variável. Remova a variável após a validação (`Remove-Item Env:TEST_BASE_URL`).

## Estado atual — publicação validada

O usuário publicou https://nft-marketplace-jg-psi.vercel.app/ na Vercel. Source confirmado: **main ad6dfbc1141fa27aa41b2ec69632d49aea8ddc8c**, merge PR6/head Etapa5 36bd750. Em06/11/2026,01:45–01:47 America/Sao_Paulo,32/32 testes HTTPS passaram em desktop/mobile: rotas/refresh, MSW/APIs, sessão, carrinho/checkout, pedido/recibo, eventos/reconexão e isolamento. Evidências completas em [PUBLISHED_VALIDATION.md](PUBLISHED_VALIDATION.md).

Para repetir, use npm run test:published com TEST_BASE_URL. Manter o host público ativo e validar mudanças futuras continua necessário. Não há garantia de disponibilidade futura ou aprovação das pendências de assets/performance por esses testes.

## Histórico da preparação Etapa5

Na entrega anterior ainda não havia URL pública. A integração Vercel não estava conectada ao executor, e os auxiliares do plugin Sites estavam indisponíveis. Foram preparados arquivos/instruções para o usuário publicar a branch. Essa limitação de publicação automática não impede a validação posterior da URL fornecida; a referência anterior a publicação pendente está superada pela evidência pública acima.
