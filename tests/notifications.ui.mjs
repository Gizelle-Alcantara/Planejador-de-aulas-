import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {createServer} from 'node:net';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const temp=mkdtempSync(join(tmpdir(),'senai-notifications-ui-')),base=`http://localhost:${port}`;
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:'senha-notifications-ui',SESSION_SECRET:'segredo-notifications-ui'},stdio:'pipe'});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(base+'/api')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\//,r=>r.abort());
 const api=async data=>{const r=await context.request.post(base+'/api',{data});assert.equal(r.status(),200,await r.text());return r.json()};
 await api({op:'login',password:'senha-notifications-ui'});
 await api({op:'set',id:'geral',data:{docentes:[{nome:'Ana'}]},base:0});
 const data={state:{cfg:{turma:'NOT-UI',curso:'Curso teste',turno:'Matutino',aulasDia:4,inicio:'2099-01-01',termino:'2099-12-31'},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',ch:40}],days:{'2099-03-01':{s:['LOG']}},reg:{},alunos:[]}};
 await api({op:'set',id:'turma-not-ui',data,base:0});
 data.state.cfg.curso='Curso atualizado';await api({op:'set',id:'turma-not-ui',data,base:1});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto(base+'/');await page.getByRole('link',{name:'Notificações (2 não lidas)',exact:true}).waitFor();await page.getByRole('link',{name:'Notificações (2 não lidas)',exact:true}).click();
 await page.getByRole('heading',{name:'Central de notificações',exact:true}).waitFor();await page.getByText('2 não lida(s)',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),2);
 await page.getByLabel('Tipo de aviso',{exact:true}).selectOption('reserva');await page.getByText('Nenhum aviso para os filtros selecionados.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Marcar exibidas como lidas'}).isDisabled(),true);
 await page.getByLabel('Tipo de aviso',{exact:true}).selectOption('calendario');await page.locator('article').first().waitFor();await page.getByRole('button',{name:'Marcar como lida',exact:true}).first().click();await page.getByText('1 não lida(s)',{exact:true}).waitFor();
 await page.getByLabel('Situação',{exact:true}).selectOption('unread');await page.getByRole('button',{name:'Marcar exibidas como lidas',exact:true}).click();await page.getByText('0 não lida(s)',{exact:true}).waitFor();await page.getByText('Nenhum aviso para os filtros selecionados.',{exact:true}).waitFor();
 await page.getByLabel('Situação',{exact:true}).selectOption('');await page.locator('article').first().waitFor();assert.equal(await page.locator('article.read').count(),2);

 data.state.cfg.curso='Curso com novo aviso';await api({op:'set',id:'turma-not-ui',data,base:2});await page.clock.fastForward(30001);await page.getByText('Novos avisos disponíveis.',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),2);assert.equal(await page.getByLabel('Tipo de aviso',{exact:true}).inputValue(),'calendario');await page.getByRole('button',{name:'Mostrar novos avisos',exact:true}).click();await page.getByText('1 não lida(s)',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),3);
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Excluir aviso',exact:true}).first().click();assert.equal(await page.locator('article').count(),3);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Excluir aviso',exact:true}).first().click();await page.getByText('Aviso excluído da sua conta.',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),2);await page.reload();await page.getByText('0 não lida(s)',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),2);
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[]);
 await page.getByRole('link',{name:'Abrir calendário',exact:true}).first().click();await page.getByRole('tab',{name:'Calendário',exact:true,selected:true}).waitFor();assert.equal(await page.locator('#turmaSel').inputValue(),'not-ui');
 await page.getByRole('link',{name:'Notificações (0 não lidas)',exact:true}).waitFor();
 const guest=await browser.newContext({serviceWorkers:'block'}),guestPage=await guest.newPage();await guestPage.goto(base+'/notificacoes.html');await guestPage.getByText('Acesso restrito às contas da equipe.',{exact:true}).waitFor();assert.equal(await guestPage.locator('article').count(),0);
 assert.deepEqual(errors,[]);console.log('Notificações aprovadas: contador, filtros, leitura individual e em lote, retorno ao calendário, privacidade, celular e acessibilidade.');
}finally{
 if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}
 if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-notifications-ui-'))throw Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true});
}
