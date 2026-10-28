import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {createServer} from 'node:net';
import {totp} from '../lib/master-mfa.js';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const temp=mkdtempSync(join(tmpdir(),'senai-mfa-ui-')),base=`http://localhost:${port}`,password='senha-mfa-ui-teste';
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:password,SESSION_SECRET:'segredo-mfa-ui-teste'},stdio:'pipe'});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(base+'/api')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\//,r=>r.abort());
 assert.equal((await context.request.post(base+'/api',{data:{op:'login',password}})).status(),200);
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?aba=acesso');
 await page.getByRole('heading',{name:'Autenticação em dois fatores',exact:true}).waitFor();
 const form=page.locator('#master-mfa-form');await form.getByLabel('Senha mestre atual').fill(password);await form.getByRole('button',{name:'Configurar autenticador'}).click();
 await form.locator('[data-mfa-qr] svg').waitFor();const secret=await form.getByLabel('Chave de configuração').inputValue();assert.match(secret,/^[A-Z2-7]{32}$/);
 await form.getByLabel('Código de confirmação').fill(totp(secret,Math.floor(Date.now()/30000)));await form.getByRole('button',{name:'Confirmar ativação'}).click();
 const recovery=page.getByLabel('Códigos de recuperação');await recovery.waitFor();const codes=(await recovery.inputValue()).split('\n');assert.equal(codes.length,10);
 assert.equal(await form.getByLabel('Chave de configuração').inputValue(),'');assert.equal(await form.getByLabel('Senha mestre atual').inputValue(),'');
 await page.waitForTimeout(6000);assert.equal(await recovery.inputValue(),codes.join('\n'));
 assert.ok(!await page.evaluate(()=>JSON.stringify(localStorage)+JSON.stringify(sessionStorage)).then(s=>s.includes(secret)||s.includes(codes[0])));
 await page.getByRole('button',{name:'Já guardei os códigos'}).click();await page.getByRole('tab',{name:'Acesso',exact:true}).click();await page.getByText('Ativa para o administrador master.',{exact:false}).waitFor();
 mkdirSync('artifacts/mfa',{recursive:true});await page.screenshot({path:'artifacts/mfa/mfa-ativo-teste.png',fullPage:true});
 await page.getByRole('button',{name:'Sair (Administrador)',exact:true}).click();await page.getByRole('link',{name:/Coordenação Organize/}).waitFor();await page.getByRole('link',{name:/Coordenação Organize/}).click();await page.getByLabel('Senha',{exact:true}).waitFor();
 await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();
 const code=page.getByLabel('Código do autenticador ou de recuperação',{exact:true});await code.waitFor();await code.fill(codes[0]);await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByRole('tab',{name:'Acesso',exact:true}).waitFor();await page.getByRole('tab',{name:'Acesso',exact:true}).click();await page.getByText('Códigos de recuperação restantes: 9.',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Sair (Administrador)',exact:true}).click();await page.getByRole('link',{name:/Coordenação Organize/}).waitFor();await page.getByRole('link',{name:/Coordenação Organize/}).click();await page.getByLabel('Senha',{exact:true}).waitFor();await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await code.waitFor();await code.fill(codes[0]);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('alert').filter({hasText:'Informe um código válido'}).waitFor();assert.equal(await page.getByRole('tab',{name:'Acesso',exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log('MFA validado no navegador: QR, ativação, recuperação preservada, novo login e código usado recusado.');
}finally{
 if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}
 if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-mfa-ui-'))throw Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true});
}
