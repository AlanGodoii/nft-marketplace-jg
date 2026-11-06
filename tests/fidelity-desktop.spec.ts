import {expect,test} from '@playwright/test'
import {add,login,reset} from './helpers/market'
for(const width of [1280,1920]) test(`todas as telas desktop sem overflow em ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1000});await reset(page);await login(page);await add(page)
 for(const path of ['/','/nfts/nft-002','/carrinho','/checkout','/perfil','/carteiras','/pedido/confirmacao','/login','/cadastro']){
  await page.goto(path);await expect(page.getByTestId('realtime-status')).toHaveAttribute('data-transport','websocket');await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(page.locator('.desktop-primary-nav a')).toHaveCount(4)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true)
  await page.screenshot({path:testInfo.outputPath(`${path.replaceAll('/','_')||'home'}-${width}.png`),fullPage:true})
 }
})
