import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{})});
try{
 const page=await browser.newPage();await page.setContent('<html lang="pt-BR"><body><main></main></body></html>');await page.addScriptTag({path:resolve('public/whatsapp-manual.js')});
 await page.evaluate(()=>document.querySelector('main').innerHTML=SENAI_WHATSAPP.render('a','A1',[{nome:'Ana',tel:'11999999999'}],['Aula alterada']));
 const open=page.locator('[data-wa-open]');await page.waitForFunction(()=>document.querySelector('[data-wa-open]').getAttribute('aria-disabled')==='true');assert.equal(await open.getAttribute('href'),null);
 await page.getByLabel('Destinatário do WhatsApp').selectOption('11999999999');await page.getByLabel('Mensagem para WhatsApp').fill('Olá!\nAula & sala 2');assert.equal(new URL(await open.getAttribute('href')).searchParams.get('text'),'Olá!\nAula & sala 2');assert.equal(new URL(await open.getAttribute('href')).pathname,'/5511999999999');assert.equal(await open.getAttribute('target'),'_blank');
 await page.evaluate(()=>document.querySelector('main').innerHTML=SENAI_WHATSAPP.render('a','A1',[]));assert.equal(await page.getByLabel('Mensagem para WhatsApp').inputValue(),'Olá!\nAula & sala 2');await page.getByLabel('Telefone do WhatsApp').fill('123');assert.equal(await open.getAttribute('href'),null);
 await page.evaluate(()=>document.querySelector('main').innerHTML=SENAI_WHATSAPP.render('b','B1',[]));assert.equal(await page.getByLabel('Telefone do WhatsApp').inputValue(),'');assert.ok(!(await page.getByLabel('Mensagem para WhatsApp').inputValue()).includes('sala 2'));
 console.log('WhatsApp manual: destinatário, codificação, validação e isolamento dos rascunhos aprovados. Nenhuma mensagem enviada.');
}finally{await browser.close()}
