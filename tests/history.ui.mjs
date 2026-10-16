import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {createServer} from 'node:net';
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const temp=mkdtempSync(join(tmpdir(),'senai-history-')),base=`http://localhost:${port}`;
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:`file:${join(temp,'test.db')}`,ADMIN_PASSWORD:'senha-historico-teste',SESSION_SECRET:'segredo-historico-teste'},stdio:'pipe'});
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(base+'/api')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}});
 const context=await browser.newContext({serviceWorkers:'block'});await context.route(/https:\/\//,r=>r.abort());
 const api=async data=>{const r=await context.request.post(base+'/api',{data});assert.equal(r.status(),200);return r.json()};
 await api({op:'login',password:'senha-historico-teste'});
 const data={state:{cfg:{turma:'HIST',curso:'Curso anterior',turno:'Matutino',aulasDia:4,inicio:'2028-01-01',termino:'2028-12-31'},ucs:[],days:{},reg:{},alunos:[]}};
 await api({op:'set',id:'turma-hist',data,base:0});data.state.cfg.curso='Curso atualizado <teste>';await api({op:'set',id:'turma-hist',data,base:1});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?aba=acesso');
 await page.getByRole('heading',{name:'Histórico de alterações',exact:true}).waitFor();
 const row=page.getByRole('row').filter({hasText:'Turma HIST'}).first();await row.getByRole('button',{name:'Ver alterações',exact:true}).click();
 await page.getByRole('cell',{name:'"Curso anterior"',exact:true}).waitFor();await page.getByRole('cell',{name:'"Curso atualizado <teste>"',exact:true}).waitFor();
 assert.equal(await row.getByRole('button',{name:'Ocultar alterações'}).getAttribute('aria-expanded'),'true');
 await row.getByRole('button',{name:'Ocultar alterações'}).click();assert.equal(await page.getByRole('cell',{name:'"Curso anterior"',exact:true}).count(),0);
 await row.getByRole('button',{name:'Ver alterações',exact:true}).click();await page.getByRole('cell',{name:'"Curso anterior"',exact:true}).waitFor();
 await page.getByRole('button',{name:'Atualizar',exact:true}).click();await page.getByRole('cell',{name:'"Curso anterior"',exact:true}).waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log('Histórico aprovado no navegador: abrir, comparar, escapar HTML, fechar, reabrir e atualizar.');
}finally{
 if(browser)await browser.close();if(server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}
 if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-history-'))throw Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true});
}
