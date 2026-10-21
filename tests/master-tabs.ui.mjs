// Teste de integração da interface em banco temporário; nunca toca nos dados enviados.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
const portProbe=createServer();await new Promise(r=>portProbe.listen(0,'127.0.0.1',r));const freePort=portProbe.address().port;await new Promise(r=>portProbe.close(r));
const project=fileURLToPath(new URL('../',import.meta.url)),temp=mkdtempSync(join(tmpdir(),'senai-ui-')),port=process.env.UI_TEST_PORT||String(freePort),base=`http://localhost:${port}`;
const server=spawn(process.execPath,['server.js'],{cwd:project,env:{...process.env,PORT:port,TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:'mestre-teste-ui',SESSION_SECRET:'segredo-temporario-ui'},stdio:'pipe'});
let browser;const errors=[], watched=[];
const day='2099-07-01',next='2099-07-02';
try {
 for(let i=0;i<50;i++){try{const r=await fetch(base+'/api');if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const context=await browser.newContext({acceptDownloads:true,serviceWorkers:'block'}),page=await context.newPage();
 await page.route('**/excel-preview.js',route=>route.abort());
 watched.push(page);page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 const call=async(ctx,body)=>{const r=await ctx.request.post(base+'/api',{data:body});assert.ok(r.ok(),`${body.op}: ${await r.text()}`);return r.json()};
 await page.goto(base+'/ambientes.html');await page.getByLabel('Senha',{exact:true}).fill('mestre-teste-ui');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('heading',{name:'Ambientes cadastrados',exact:true}).waitFor();
 await call(context,{op:'set',id:'geral',base:0,data:{docentes:[{nome:'Ana'}]}});
 const state={cfg:{turma:'T-UI',curso:'Desenvolvimento de Sistemas',turno:'Matutino',aulasDia:4,inicio:day,termino:next},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',sala:'',ch:40}],days:{[day]:{s:['LOG']},[next]:{s:['LOG']}},reg:{}};
 await call(context,{op:'set',id:'turma-ui',base:0,data:{state}});
 await call(context,{op:'user_add',login:'coordtabs',nome:'Coordenação',password:'senha-coord-tabs',role:'coord'});
 const coordContext=await browser.newContext({serviceWorkers:'block'}),coordPage=await coordContext.newPage();
 await call(coordContext,{op:'login',login:'coordtabs',password:'senha-coord-tabs'});
 for(const tab of ['dados','publicacao','diagnostico']){
  await coordPage.goto(base+'/?aba='+tab);await coordPage.getByRole('tab',{name:'Painel',exact:true}).waitFor();
  for(const label of ['Dados','Publicação','Diagnóstico'])assert.equal(await coordPage.getByRole('tab',{name:label,exact:true}).count(),0);
  await coordPage.evaluate(tab=>{UI.tab=tab;renderView()},tab);
  assert.equal(await coordPage.evaluate(()=>UI.tab),'painel');
 }
 await coordContext.close();
 const masterTabs=await context.newPage();await masterTabs.goto(base+'/?aba=painel');await masterTabs.getByRole('tab',{name:'Painel',exact:true}).waitFor();
 for(const label of ['Dados','Publicação','Diagnóstico'])assert.equal(await masterTabs.getByRole('tab',{name:label,exact:true}).count(),1);
 await masterTabs.close();
 console.log('Abas aprovadas: ocultas para coordenador, bloqueadas por acesso direto e visíveis para mestre.');
}finally{if(browser)await browser.close();if(server.exitCode===null&&server.signalCode===null){const exit=new Promise(r=>server.once('exit',r));server.kill();await exit;}rmSync(temp,{recursive:true,force:true});}
