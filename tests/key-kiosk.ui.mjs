import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const project=fileURLToPath(new URL('../',import.meta.url)),temp=mkdtempSync(join(tmpdir(),'senai-kiosk-ui-')),base=`http://localhost:${port}`,today=new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
const server=spawn(process.execPath,['server.js'],{cwd:project,env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:'mestre-kiosk-teste',SESSION_SECRET:'segredo-kiosk-teste'},stdio:'pipe'});
let browser,page;const errors=[];
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/api')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{})});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\//,route=>route.abort());
 const call=async(body,kiosk=false)=>{const response=await context.request.post(base+'/api'+(kiosk?'?kiosk=1':''),{data:body});const data=await response.json();assert.equal(response.status(),200,JSON.stringify(data));return data};
 await call({op:'login',password:'mestre-kiosk-teste'});
 await call({op:'set',id:'geral',base:0,data:{docentes:[{nome:'Ana'}]}});
 await call({op:'user_add',login:'ana',nome:'Ana',role:'docente',password:'senha-docente-teste'});await call({op:'user_link',login:'ana',docente:'Ana'});
 await call({op:'environment_save',base:0,items:[{id:'lab',nome:'Laboratório de Sistemas',tipo:'laboratorio',capacidade:25,ativo:true}]});
 await call({op:'set',id:'turma-kiosk',base:0,data:{state:{cfg:{turma:'PILOTO-01',curso:'Sistemas',turno:'Matutino',aulasDia:4,inicio:today,termino:today},ucs:[{sigla:'LOG',nome:'Lógica',ch:40,docente:'Ana'}],days:{[today]:{s:['LOG']}},reg:{}}}});
 const key=(await call({op:'key_create',code:'CH-01',ambienteId:'lab'})).key,lesson=(await call({op:'managed_lessons'})).items[0];await call({op:'key_allocate',...lesson,keyId:key.id});
 page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/secretaria-chaves.html');await page.getByRole('heading',{name:'O que você deseja fazer?',exact:true}).waitFor();
 assert.equal((await (await context.request.get(base+'/api')).json()).user.master,true);assert.equal(await page.getByText('Ana',{exact:true}).count(),0);
 mkdirSync(join(project,'artifacts','painel-secretaria'),{recursive:true});
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  for(const width of [390,768,1440]){await page.setViewportSize({width,height:960});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 }
 await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.screenshot({path:join(project,'artifacts','painel-secretaria','inicio-desktop.png'),fullPage:true});
 const identify=async action=>{
  await page.locator(`[data-action="${action}"]`).click();await page.getByLabel('Usuário',{exact:true}).fill('ana');await page.getByLabel('Senha',{exact:true}).fill('senha-docente-teste');await page.getByRole('button',{name:'Entrar e continuar',exact:true}).click();await page.locator('#kiosk-end').waitFor();await page.locator('#key-refresh').waitFor();
 };
 const sign=async action=>{
  await page.getByRole('button',{name:action==='retirada'?'Retirar chave':'Devolver chave',exact:true}).click();
  await page.locator('.key-terminal-qr svg').waitFor();
  if(action==='retirada'){await page.screenshot({path:join(project,'artifacts','painel-secretaria','retirada-desktop.png'),fullPage:true});const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>v.id),[])}
  await page.locator('#key-terminal-sign').click();
  const dialog=page.getByRole('dialog');await dialog.locator('[name=consent]').check();const bounds=await dialog.locator('canvas').boundingBox();await page.mouse.move(bounds.x+bounds.width*.12,bounds.y+bounds.height*.5);await page.mouse.down();for(let i=1;i<=20;i++)await page.mouse.move(bounds.x+bounds.width*(.12+i*.035),bounds.y+bounds.height*(.5+Math.sin(i)*.2));await page.mouse.up();
  await dialog.getByRole('button',{name:action==='retirada'?'Confirmar e registrar retirada':'Confirmar e registrar devolução',exact:true}).click();
  await page.getByRole('heading',{name:action==='retirada'?'Retirada registrada':'Devolução registrada',exact:true}).waitFor();assert.equal((await (await context.request.get(base+'/api?kiosk=1')).json()).user,null);assert.equal((await (await context.request.get(base+'/api')).json()).user.master,true);
  assert.equal(await page.locator('.key-dialog,canvas').count(),0);await page.getByRole('button',{name:'Concluir e voltar ao início',exact:true}).click();await page.getByRole('heading',{name:'O que você deseja fazer?',exact:true}).waitFor();assert.equal(await page.getByText('Ana',{exact:true}).count(),0);
 };
 await identify('devolucao');await page.getByText('Você não possui chave pendente de devolução.',{exact:true}).waitFor();await page.getByRole('button',{name:'Encerrar atendimento',exact:true}).click();await page.getByRole('heading',{name:'O que você deseja fazer?',exact:true}).waitFor();
 await identify('retirada');await sign('retirada');await identify('devolucao');await sign('devolucao');assert.equal((await call({op:'key_list'})).items[0].status,'devolvida');
 await identify('retirada');await page.getByText('Nenhuma chave liberada para retirada hoje. Confira sua alocação com a gestão.',{exact:true}).waitFor();
 await page.clock.install();await page.clock.fastForward(91_000);await page.getByRole('heading',{name:'O que você deseja fazer?',exact:true}).waitFor();assert.equal((await (await context.request.get(base+'/api?kiosk=1')).json()).user,null);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(project,'artifacts','painel-secretaria','inicio-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
 console.log('Painel da secretaria aprovado: início sem dados pessoais, sessões isoladas, retirada/devolução, QR/assinatura, filtros, conclusão com logout, encerramento por inatividade, responsividade, temas e acessibilidade.');
}catch(error){if(page)console.error(await page.locator('body').innerText());throw error}
finally{if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-kiosk-ui-'))throw Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true})}
