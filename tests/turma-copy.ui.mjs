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
const project=fileURLToPath(new URL('../',import.meta.url)),temp=mkdtempSync(join(tmpdir(),'senai-copy-')),base=`http://localhost:${port}`;
const server=spawn(process.execPath,['server.js'],{cwd:project,env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:'senha-copia-teste',SESSION_SECRET:'segredo-copia-teste'},stdio:'pipe'});
let browser,page;const errors=[];
try{
 for(let i=0;i<60;i++){try{if((await fetch(base+'/api')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}: {})});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\//,route=>route.abort());
 const call=async body=>{const response=await context.request.post(base+'/api',{data:body}),data=await response.json();assert.ok(response.ok(),JSON.stringify(data));return data};
 await call({op:'login',password:'senha-copia-teste'});await call({op:'set',id:'geral',base:0,data:{docentes:[{nome:'Ana'}]}});
 const source={cfg:{turma:'A1',curso:'Curso de origem',turno:'Vespertino',modulo:'II',aulasDia:2,coord:'Coordenação',email:'coord@example.test',local:'Laboratório',destinatarios:'privado@example.test',inicio:'2099-01-01',termino:'2099-06-30'},ucs:[{sigla:'ABC',nome:'Disciplina de origem',ch:8,docente:'Ana',sala:'Sala 1'}],days:{'2099-01-10':{s:['ABC']},'2099-02-01':{s:[],t:'feriado',h:'Feriado'},'2098-12-31':{s:[],t:'feriado',h:'Fora do período'}},alunos:[{id:'aluno',nome:'Aluno da origem'}],reg:{'2099-01-10':{dado:'sim',faltas:{aluno:1}}},envios:[{texto:'Histórico privado'}],aviso:{auto:true,lembrete:true}};
 await call({op:'set',id:'turma-origem',base:0,data:{state:source}});
 const before=(await(await context.request.get(base+'/api')).json()).docs.find(d=>d.id==='turma-origem').data;
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?aba=turma');await page.waitForFunction(()=>UI.loaded&&CUR==='origem');
 await page.getByRole('button',{name:'Duplicar turma',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Duplicar turma',exact:true});await dialog.waitFor();
 await dialog.getByLabel('Novo código da turma',{exact:true}).fill('A1');await dialog.getByLabel('Novo início',{exact:true}).fill('2099-01-01');await dialog.getByLabel('Novo término',{exact:true}).fill('2099-03-01');
 await dialog.getByRole('button',{name:'Criar cópia da turma',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'Já existe uma turma'}).waitFor();assert.equal(await page.evaluate(()=>Object.keys(T).length),1);
 await dialog.getByLabel('Novo código da turma',{exact:true}).fill('B1');await dialog.getByLabel('Docentes das disciplinas',{exact:true}).uncheck();await dialog.getByLabel('Ambientes',{exact:true}).uncheck();await dialog.getByLabel('Feriados e dias sem aula',{exact:true}).check();
 await dialog.getByLabel('Disciplinas e cargas horárias',{exact:true}).uncheck();assert.equal(await dialog.getByLabel('Docentes das disciplinas',{exact:true}).isDisabled(),true);await dialog.getByLabel('Disciplinas e cargas horárias',{exact:true}).check();
 await dialog.locator('#duplicate-preview').filter({hasText:'1 feriado(s)'}).waitFor();
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false)}
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[]);
 if(process.env.UI_EVIDENCE_DIR){mkdirSync(process.env.UI_EVIDENCE_DIR,{recursive:true});await dialog.screenshot({path:join(process.env.UI_EVIDENCE_DIR,'duplicar-turma.png')})}
 await dialog.getByRole('button',{name:'Criar cópia da turma',exact:true}).click();await dialog.waitFor({state:'detached'});await page.waitForFunction(()=>CUR==='b1'&&!dirty&&UI.status==='saved');await page.reload();await page.waitForFunction(()=>UI.loaded&&CUR==='b1');
 const saved=await(await context.request.get(base+'/api')).json(),copy=saved.docs.find(d=>d.id==='turma-b1').data.state;
 assert.equal(copy.cfg.inicio,'2099-01-01');assert.equal(copy.cfg.termino,'2099-03-01');assert.equal(copy.cfg.turno,'Vespertino');assert.equal(copy.cfg.aulasDia,2);assert.equal(copy.ucs[0].docente,'');assert.equal(copy.ucs[0].sala,'');assert.equal(copy.cfg.local,'');assert.equal(copy.cfg.destinatarios,'');assert.deepEqual(Object.keys(copy.days),['2099-02-01']);assert.deepEqual(copy.alunos,[]);assert.deepEqual(copy.reg,{});assert.deepEqual(copy.envios,[]);assert.equal(copy.aviso.auto,false);assert.equal(copy.aviso.lembrete,false);assert.deepEqual(saved.docs.find(d=>d.id==='turma-origem').data,before);
 assert.deepEqual(errors,[]);console.log('Duplicação aprovada: código único, opções, feriados, origem preservada, persistência, acessibilidade e layout móvel.');
}catch(error){if(page)console.error(await page.locator('body').innerText());console.error(errors);throw error}
finally{if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-copy-'))throw new Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true})}
