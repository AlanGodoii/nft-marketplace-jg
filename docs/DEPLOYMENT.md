# Publicação da demonstração Kurio

## Vercel

1. Acesse https://vercel.com/new e importe `AlanGodoii/nft-marketplace-jg` pela sua conta GitHub.
2. Selecione a branch `feat/etapa5-finalizacao` para validar esta entrega antes do merge; depois configure `main` como Production Branch quando o PR tiver sido revisado/integrado.
3. Framework: Vite. Root Directory: raiz do repositório. Install: `npm ci`. Build: `npm run build:demo`. Output: `dist`. Node: 24.x.
4. Defina `VITE_ENABLE_MOCKS=true` e `VITE_MOCK_SCENARIO=normal` também no painel, caso existam overrides. Não cadastre senhas/tokens reais no frontend. As mesmas flags públicas estão em `.env.production` e `.env.demo`.
5. Clique Deploy e copie a URL HTTPS. Desative Deployment Protection para o ambiente destinado ao avaliador, de modo que ele não precise de uma conta Vercel.
6. Registre URL e SHA publicado em `docs/STAGE5_DELIVERY.md` somente após as verificações abaixo. Não confundir preview local ou deploy protegido com URL pública validada.

`vercel.json` configura fallback SPA e impede cache obsoleto do worker MSW. Assets existentes continuam servidos como arquivos. Não há servidor API ou Socket.IO externo: o navegador intercepta REST e WebSocket com MSW, inicializado antes do cliente Engine.IO. Endpoints usam a origem corrente; não dependem de localhost. HTTPS é necessário para Service Worker e Web Crypto.

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

## Estado desta execução

Não há integração Vercel conectada. O plugin Sites foi inspecionado, porém seus auxiliares obrigatórios de sincronização/empacotamento não estão instalados neste executor e o recurso `scripts/site-workflow.mjs` não pôde ser lido. Não foi criado um Site órfão nem utilizada uma rota alternativa sem proveniência. **Deploy público permanece pendente de execução e validação pelo usuário.** Os testes locais não substituem a compra na URL publicada.
