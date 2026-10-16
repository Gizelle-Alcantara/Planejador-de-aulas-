import {chromium} from 'playwright';import AxeBuilder from '@axe-core/playwright';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve,dirname,basename} from 'node:path';import {createServer} from 'node:net';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const temp=mkdtempSync(join(tmpdir(),'senai-planning-ui-')),base=`http://localhost:${port}`;
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:'senha-planning-ui',SESSION_SECRET:'segredo-planning-ui'},stdio:'pipe'});let browser,page;const errors=[];
try{
 for(let i=0;i<60;i++){try{if((await fetch(base+'/api')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\//,r=>r.abort());
 const api=async data=>{const r=await context.request.post(base+'/api',{data});assert.equal(r.status(),200,await r.text());return r.json()};
 await api({op:'login',password:'senha-planning-ui'});await api({op:'set',id:'geral',data:{docentes:[{nome:'Ana'}]},base:0});
 const room={id:'lab',nome:'Lab 1',tipo:'laboratorio',capacidade:30,ativo:true};await api({op:'environment_save',items:[room],base:0});
 const state={cfg:{turma:'ASSIST',curso:'Curso de teste',turno:'Matutino',aulasDia:4,inicio:'2028-01-01',termino:'2028-01-10'},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',sala:'Lab 1',ch:6}],days:{'2028-01-04':{h:'Nota preservada',s:[]}},reg:{},alunos:[]};await api({op:'set',id:'turma-assist',data:{state},base:0});
 page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?aba=calendario&turma=assist');await page.getByText('Todos os lançamentos salvos',{exact:true}).waitFor();
 await page.getByText('Planejamento assistido',{exact:true}).click();await page.locator('#aQty').fill('6');await page.locator('#aFrom').fill('2028-01-03');await page.getByRole('button',{name:'Sugerir horários',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Prévia do planejamento',exact:true});await dialog.getByRole('button',{name:'Aplicar sugestões',exact:true}).waitFor();await dialog.getByText(/6 aula\(s\) sugerida\(s\)/).waitFor();
 const request={turmaId:'turma-assist',options:{sigla:'LOG',from:'2028-01-03',to:'2028-01-10',quantity:6,weekdays:[2,4]}};
 assert.equal((await api({op:'planning_preview',...request})).plan.pending,6);
 await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal((await api({op:'planning_preview',...request})).plan.pending,6);
 await page.getByRole('button',{name:'Sugerir horários',exact:true}).click();await dialog.getByRole('button',{name:'Aplicar sugestões',exact:true}).waitFor();
 await api({op:'environment_save',items:[{...room,capacidade:31}],base:1});await dialog.getByRole('button',{name:'Aplicar sugestões',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'Os dados mudaram desde a prévia'}).waitFor();assert.equal((await api({op:'planning_preview',...request})).plan.pending,6);
 await dialog.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await dialog.getByRole('button',{name:'Aplicar sugestões',exact:true}).waitFor();
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[]);
 await dialog.getByRole('button',{name:'Aplicar sugestões',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.getByRole('status').filter({hasText:'6 aula(s) gravada(s) pelo planejamento assistido.'}).waitFor();
 const result=await api({op:'planning_preview',...request});assert.equal(result.plan.pending,0);
 const snapshot=await(await context.request.get(base+'/api')).json(),saved=snapshot.docs.find(d=>d.id==='turma-assist').data.state;assert.equal(saved.days['2028-01-04'].h,'Nota preservada');assert.deepEqual(saved.days['2028-01-06'].grade,['LOG','LOG','','']);
 await page.reload();await page.getByText('Planejamento assistido',{exact:true}).click();await page.getByRole('button',{name:'Sugerir horários',exact:true}).click();await dialog.getByText('Nenhum horário disponível ou carga horária já completa.',{exact:true}).waitFor();assert.equal(await dialog.getByRole('button',{name:'Aplicar sugestões',exact:true}).isDisabled(),true);
 assert.deepEqual(errors,[]);console.log('Planejamento aprovado: prévia, cancelamento, dados alterados, atualização, aplicação, preservação, carga completa, acessibilidade e celular.');
}catch(e){if(page)console.error((await page.locator('body').innerText()).slice(-4500));console.error(errors);throw e}
finally{if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-planning-ui-'))throw Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true})}
