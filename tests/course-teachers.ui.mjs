import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';

const probe=createServer();
await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const temp=mkdtempSync(join(tmpdir(),'course-teachers-'));
const base='http://localhost:'+port;
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),TURSO_DATABASE_URL:'file:'+join(temp,'test.db'),ADMIN_PASSWORD:'course-teachers-test',SESSION_SECRET:'course-teachers-secret'},stdio:'pipe'});
let browser;
try{
 for(let i=0;i<60;i++){
  try{if((await fetch(base+'/api')).ok)break}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE_PATH});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('https://**',route=>route.abort());
 const api=async body=>{
  const response=await context.request.post(base+'/api',{data:body});
  const data=await response.json();
  assert.equal(response.status(),200,JSON.stringify(data));
  return data;
 };
 await api({op:'login',password:'course-teachers-test'});
 const course=await api({op:'course_save',course:{nome:'Curso de teste',tipo:'rapido',ucs:[]}});
 await api({op:'user_add',login:'coord',password:'course-teachers-coord',role:'coord'});
 await api({op:'user_courses',login:'coord',courseIds:[course.course.id]});
 await api({op:'course_enable'});
 await api({op:'login',login:'coord',password:'course-teachers-coord'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/?aba=cursos');
 await page.getByRole('button',{name:'Abrir curso',exact:true}).click();
 await page.getByRole('button',{name:'Professores',exact:true}).click();
 await page.getByRole('button',{name:'Adicionar professor',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Adicionar professor'});
 await dialog.getByLabel('Nome completo',{exact:true}).fill('Professora do curso');
 await dialog.getByLabel('E-mail de contato',{exact:true}).fill('docente@example.test');
 await dialog.getByRole('button',{name:'Salvar professor',exact:true}).click();
 await dialog.waitFor({state:'hidden'});
 await page.getByRole('heading',{name:'Professora do curso',exact:true}).waitFor();
 await page.reload();
 await page.getByRole('button',{name:'Abrir curso',exact:true}).click();
 await page.getByRole('button',{name:'Professores',exact:true}).click();
 await page.getByRole('heading',{name:'Professora do curso',exact:true}).waitFor();
 await page.getByRole('button',{name:'Modelo do curso',exact:true}).click();
 await page.getByRole('button',{name:'Adicionar unidade curricular',exact:true}).click();
 const options=await page.getByLabel('Professor sugerido',{exact:true}).locator('option').allTextContents();
 assert.ok(options.includes('Professora do curso'));
 assert.deepEqual(errors,[]);
 console.log('Cadastro por coordenador sem turma validado: formulário, persistência, vínculo ao curso e seleção nas unidades.');
}finally{
 if(browser)await browser.close();
 server.kill();
 await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));
 rmSync(temp,{recursive:true,force:true});
}
