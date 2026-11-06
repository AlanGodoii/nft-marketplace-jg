# Perfil do colecionador — contratos e cenários

Todos os endpoints exigem Bearer da sessão simulada, usam Axios no cliente e handlers MSW em dev/demo/testes. O proprietário é derivado do token, nunca de um userId enviado. Contratos compartilhados: src/contracts/profile.ts. Exemplos usam somente contas fictícias.

## Dados

`GET /api/profile` retorna `{id,version,name,email,username,bio,website,avatar}`. Campos novos recebem defaults aditivos quando a conta já existia antes da etapa5; não é necessário apagar dados E3/E4.

`PATCH /api/profile` recebe o objeto abaixo. Campos extras são rejeitados400:

```json
{"version":1,"name":"Alice","email":"alice@kurio.test","username":"alice_nft","bio":"Colecionadora","website":"https://example.org"}
```

Nome2–80caracteres; e-mail válido/normalizado; username vazio ou3–40letras/números/_/-; bio até500; website vazio ou URL HTTP(S).200 retorna perfil atualizado com versão incrementada. Name/email também atualizam a conta, portanto o próximo login e a consulta de sessão usam os valores novos. Carteiras e recibos históricos não são reescritos.

409: versão desatualizada, e-mail de outra conta ou username já utilizado (comparação sem distinção de maiúsculas). Recarregue para obter a versão atual antes de conciliar uma edição concorrente. UI associa erros de campo e mantém o formulário quando há falha.

## Avatar

`PUT /api/profile/avatar` recebe `{version,avatar}`. Avatar é null para remover, ou dataURL base64 de PNG/JPEG/WebP. Limites:256KiB de bytes decodificados e4096×4096pixels. São verificadas assinatura, MIME, corpo limitado e decodificação real no navegador do mock. SVG, arquivo vazio, corrompido, formato/tamanho/dimensão inválidos retornam400; versão antiga409. Sessão é revalidada após decodificar, antes de persistir.

Imagem pertence somente ao perfil autenticado e persiste no banco local da simulação. Não há upload para serviço externo, nem geração/substituição de imagem do Figma. Quando o storage do navegador não está disponível, vale o fallback em memória documentado; persistência após refresh não é garantida nesse ambiente.

## Senha e sessão

`POST /api/profile/password` recebe `{currentPassword,newPassword}`. Ambas8–128caracteres; nova diferente da atual. Confirmação da nova senha é validada adicionalmente pelo formulário RHF/Zod. Senha atual incorreta retorna400 com `fields.currentPassword`, sem encerrar a sessão como se ela tivesse expirado. Corrida com outra alteração retorna409.

Sucesso204 ocorre somente após gravar PBKDF2-SHA256/120.000iterações com salt aleatório novo. Todas as sessões e conexões de carteira da conta são revogadas. O cliente encerra Manager/listeners e cache privado e redireciona ao login com retorno/perfil. A senha antiga deixa de autenticar; a nova autentica e os demais recursos permanecem associados à mesma conta. Não há senha em claro no localStorage/sessionStorage, resposta, query keys ou logs.

## Erros e cenários

Formato comum: `{error:{code,message,fields?}}`.400 validação,401 sessão ausente/expirada,409 conflito,500 falha simulada; rede/timeout também seguem a camada Axios existente. Não há lookup por ID de perfil de outro usuário; GET sempre consulta a sessão corrente.

Exemplo no console da aplicação:

```js
await fetch('/api/__mock/configure', {
  method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({name:'normal',latencyMs:100,
    faults:{'profile.update':{status:500,times:1}}})
})
```

Operações: profile.read, profile.update, profile.avatar, profile.password. Cada fault suporta status, networkError, latencyMs, times. Reset existente restaura contas/perfis/cenários junto dos demais recursos; recarregue a página depois. Não altera dados diretamente no componente nem no cache para fingir resposta.

Queries: ['private',userId,'profile'], staleTime15s, gc5min e política de retry de consultas compartilhada (uma repetição para rede/5xx; sem retry4xx). Consultas usam AbortSignal. Mutations: retryfalse e geração de identidade para descartar callbacks tardios. Sucesso atualiza a consulta de perfil e invalida sessão; falha preserva os dados anteriores. Favoritos continuam sendo a interação com otimismo/rollback exigida, sem otimismo de senha/avatar.

Validação: tests/profile.spec.ts,16casos desktop/mobile; acessibilidade e regressão integral têm resultados em STAGE5_DELIVERY.md. Credenciais após reset: alice@kurio.test e bob@kurio.test, ambas Kurio123!. Após trocar senha/e-mail, use os valores confirmados, ou faça reset para restaurar fixtures.
