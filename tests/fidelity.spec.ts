import {expect,test} from '@playwright/test'
import {add,login,reset,request,openCheckoutItems} from './helpers/market'
test.beforeEach(async({page})=>reset(page))
test('artes originais acompanham detalhe, favoritos, carrinho e checkout pela API',async({page})=>{
 await login(page,'alice','/favoritos'); await add(page)
 await expect(page.locator('.detail-art img')).toHaveAttribute('src','/assets/figma/home/sage-nomad.webp')
 await page.getByRole('button',{name:'Adicionar aos favoritos',exact:true}).click()
 await expect(page.getByRole('button',{name:'Remover dos favoritos',exact:true})).toBeEnabled()
 await page.goto('/favoritos');await expect(page.locator('.nft-card img:visible')).toHaveCount(1)
 await page.goto('/carrinho');await expect(page.locator('.cart-art img')).toHaveAttribute('src','/assets/figma/home/sage-nomad.webp')
 await page.goto('/checkout');await openCheckoutItems(page);await expect(page.locator('.checkout-art img')).toHaveAttribute('src','/assets/figma/home/sage-nomad.webp')
 expect(await page.locator('.checkout-art img').evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true)
 expect((await request(page,'/api/cart','GET')).body.items[0].quantity).toBe(1)
})
test('stepper respeita estoque e atualiza cotação real sem cálculo local',async({page})=>{
 await add(page);await page.goto('/carrinho')
 const row=page.getByTestId('cart-item');await row.getByRole('button',{name:'Aumentar quantidade de Sage Nomad #002'}).click()
 await expect(row.getByLabel('Quantidade',{exact:true})).toHaveValue('2');await expect(page.getByTestId('subtotal')).toHaveText('0.58 ETH')
 await page.reload();await expect(page.getByTestId('cart-item').getByLabel('Quantidade',{exact:true})).toHaveValue('2')
})
test('header e menu da conta permanecem disponíveis no detalhe, sem navegação antiga',async({page})=>{
 await login(page,'alice','/nfts/nft-002')
 if((page.viewportSize()?.width??0)>=1024){
  await expect(page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:'Mercado',exact:true})).toHaveClass(/is-active/)
  await page.locator('.desktop-account summary').click();await page.locator('.desktop-account').getByRole('link',{name:'Perfil',exact:true}).click()
 }else{
  await page.getByRole('button',{name:'Abrir menu'}).click();await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:'Perfil',exact:true}).click()
 }
 await expect(page.getByRole('heading',{name:'Perfil do colecionador',exact:true})).toBeVisible()
 await expect(page.locator('.kurio-header')).toHaveCount(0)
})
test('login usa composição desktop ou mobile sem fingir OAuth',async({page})=>{
 if((page.viewportSize()?.width??0)>=1024){await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.auth-backdrop .nft-card')).toHaveCount(9)}
 else{await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.auth-wordmark')).toHaveText('KURIO')}
 await page.getByRole('button',{name:'Continuar com Google'}).click();await expect(page.getByRole('status').filter({hasText:'indisponível'})).toBeVisible()
 await expect(page.getByLabel('Usuário conectado')).toHaveCount(0)
})

test('provedor selecionado usa a carteira persistida e não atravessa contas',async({page})=>{
 await login(page);await add(page)
 const mobile=(page.viewportSize()?.width??0)<1024
 await page.goto(mobile?'/checkout':'/carteiras')
 const saved=page.waitForResponse(response=>new URL(response.url()).pathname.startsWith('/api/wallets/')&&response.request().method()==='PATCH')
 if(mobile) await page.getByRole('button',{name:'Coinbase Wallet',exact:true}).click()
 else {await page.getByLabel('Tipo de carteira',{exact:true}).selectOption('coinbase');await page.getByRole('button',{name:'Salvar carteira',exact:true}).click()}
 expect((await saved).status()).toBe(200)
 expect((await request(page,'/api/wallets','GET')).body.items[0].provider).toBe('coinbase')
 await page.reload()
 if(mobile) await expect(page.getByRole('button',{name:'Coinbase Wallet',exact:true})).toHaveAttribute('aria-pressed','true')
 else await expect(page.getByLabel('Tipo de carteira',{exact:true})).toHaveValue('coinbase')
 await login(page,'bob','/carteiras');expect((await request(page,'/api/wallets','GET')).body.items[0].provider).toBe('metamask')
})
test('ENS e apelido do perfil gravam na carteira vinculada pela API',async({page})=>{
 await login(page,'alice','/perfil')
 await page.getByLabel('Nome ENS',{exact:true}).fill('nova-alice.eth')
 await page.getByLabel('Apelido da carteira',{exact:true}).fill('Coleção principal')
 await page.getByRole('button',{name:'Salvar carteira vinculada',exact:true}).click()
 await expect(page.getByText('Carteira vinculada atualizada.',{exact:true})).toBeVisible()
 const wallet=(await request(page,'/api/wallets','GET')).body.items[0]
 expect(wallet.collector.ensName).toBe('nova-alice.eth');expect(wallet.label).toBe('Coleção principal')
 await page.reload();await expect(page.getByLabel('Nome ENS',{exact:true})).toHaveValue('nova-alice.eth')
})
