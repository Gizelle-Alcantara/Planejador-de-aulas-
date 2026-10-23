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

 await call({op:'login',password:'senha-copia-teste'});await call({op:'set',id:'geral',base:0,data:{docentes:[{id:'t1',nome:'Ana'}]}});
 const state={cfg:{turma:'A1',curso:'Técnico A',turno:'Matutino',aulasDia:4,inicio:'2099-01-01',termino:'2099-06-30'},ucs:[],days:{},reg:{}};
 await call({op:'set',id:'turma-a',base:0,data:{state}});
 await call({op:'set',id:'turma-b',base:0,data:{state:{...state,cfg:{...state.cfg,turma:'B1',curso:'Rápido B'}}}});
 await call({op:'user_add',login:'coord',nome:'Coordenação A',password:'senha-coord-123',role:'coord'});
 await call({op:'user_add',login:'vazio',nome:'Sem curso',password:'senha-coord-123',role:'coord'});
 page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?aba=cursos');await page.getByRole('button',{name:'Novo curso',exact:true}).waitFor();await page.waitForFunction(()=>UI.courseLoaded);
 // Criar curso rápido pelo formulário e verificar persistência.
 await page.getByRole('button',{name:'Novo curso',exact:true}).click();await page.getByLabel('Nome do curso',{exact:true}).fill('Excel profissional');
 await page.getByLabel('Tipo',{exact:true}).selectOption('rapido');await page.getByRole('button',{name:'Adicionar unidade curricular',exact:true}).click();
 await page.getByLabel('Sigla',{exact:true}).fill('EXC');await page.getByLabel('Unidade curricular',{exact:true}).fill('Planilhas');await page.getByLabel('Carga horária',{exact:true}).fill('20');await page.getByLabel('Professor sugerido',{exact:true}).selectOption('t1');
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 const editorAudit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(editorAudit.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[]);
 await page.getByRole('button',{name:'Salvar modelo do curso',exact:true}).click();await page.waitForFunction(()=>G.cursos.some(c=>c.nome==='Excel profissional'&&c.ucs.length===1));
 await page.getByRole('button',{name:'Voltar aos cursos',exact:true}).first().click();
 const card=page.locator('.course-card').filter({hasText:'Técnico A'});await card.getByRole('button',{name:'Abrir curso',exact:true}).click();
 await page.getByRole('button',{name:'Adicionar unidade curricular',exact:true}).click();await page.getByLabel('Sigla',{exact:true}).fill('LOG');await page.getByLabel('Unidade curricular',{exact:true}).fill('Lógica');
 await page.getByLabel('Carga horária',{exact:true}).fill('40');await page.getByLabel('Professor sugerido',{exact:true}).selectOption('t1');await page.getByRole('button',{name:'Salvar modelo do curso',exact:true}).click();
 await page.waitForFunction(()=>G.cursos.find(c=>c.nome==='Técnico A')?.ucs.length===1);await page.getByRole('button',{name:'Voltar aos cursos',exact:true}).first().click();
 await page.getByRole('button',{name:'Acessos por curso',exact:true}).click();const account=page.locator('.course-access-form[data-login=coord]');await account.getByLabel('Técnico A',{exact:true}).check();await account.getByRole('button',{name:'Salvar vínculos de Coordenação A',exact:true}).click();await account.getByRole('status').filter({hasText:'Vínculos salvos'}).waitFor();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Ativar restrições por curso',exact:true}).click();await page.getByText('Restrições por curso ativas.',{exact:true}).waitFor();
 const coord=await browser.newContext({serviceWorkers:'block'});await coord.route("https://**",route=>route.abort());await coord.request.post(base+'/api',{data:{op:'login',login:'coord',password:'senha-coord-123'}});
 const cp=await coord.newPage();cp.on('pageerror',e=>errors.push(e.message));await cp.goto(base);await cp.waitForFunction(()=>UI.loaded&&UI.courseLoaded);assert.equal(await cp.locator('.course-card').count(),1);assert.equal(await cp.getByText('Rápido B',{exact:true}).count(),0);
 await cp.getByRole('button',{name:'Abrir curso',exact:true}).click();await cp.getByRole('button',{name:'Nova turma deste curso',exact:true}).click();const dialog=cp.getByRole('dialog',{name:'Nova turma',exact:true});
 await dialog.getByLabel('Código da turma',{exact:true}).fill('NOVA');await dialog.getByLabel('Início',{exact:true}).fill('2099-01-01');await dialog.getByLabel('Término',{exact:true}).fill('2099-06-30');await dialog.getByRole('button',{name:'Criar turma',exact:true}).click();
 await cp.waitForFunction(()=>CUR==='nova'&&!dirty&&UI.status==='saved');assert.equal(await cp.evaluate(()=>S.ucs[0].nome),'Lógica');assert.equal(await cp.evaluate(()=>S.ucs[0].docente),'Ana');
 await cp.reload();await cp.waitForFunction(()=>UI.loaded);assert.equal(await cp.evaluate(()=>T.nova.ucs[0].ch),40);assert.equal(await cp.getByRole('tab',{name:'Docentes',exact:true}).count(),0);
 await cp.getByRole('tab',{name:'Cursos',exact:true}).click();
 for(const width of [320,768,1280]){await cp.setViewportSize({width,height:900});assert.equal(await cp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 const audit=await new AxeBuilder({page:cp}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[]);
 if(process.env.UI_EVIDENCE_DIR){mkdirSync(process.env.UI_EVIDENCE_DIR,{recursive:true});await cp.screenshot({path:join(process.env.UI_EVIDENCE_DIR,'cursos-coordenador.png'),fullPage:true})}
 await call({op:'user_courses',login:'coord',courseIds:[]});await cp.getByText('Nenhum curso vinculado à sua conta. Solicite o vínculo ao administrador.',{exact:true}).waitFor();assert.equal(await cp.evaluate(()=>Object.keys(T).length),0);
 const empty=await browser.newContext({serviceWorkers:'block'});await empty.route("https://**",route=>route.abort());await empty.request.post(base+'/api',{data:{op:'login',login:'vazio',password:'senha-coord-123'}});const ep=await empty.newPage();ep.on('pageerror',e=>errors.push(e.message));await ep.goto(base);await ep.getByText('Nenhum curso vinculado à sua conta. Solicite o vínculo ao administrador.',{exact:true}).waitFor();assert.equal(await ep.evaluate(()=>Object.keys(T).length),0);
 assert.deepEqual(errors,[]);console.log('Cursos aprovados: cadastro de modelo/professor, vínculo por coordenador, ativação, nova turma, persistência, conta sem curso, acessibilidade e telas de 320/768/1280px.');
}catch(error){if(page)console.error(await page.locator('body').innerText());console.error(errors);throw error}
finally{if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-copy-'))throw new Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true})}

