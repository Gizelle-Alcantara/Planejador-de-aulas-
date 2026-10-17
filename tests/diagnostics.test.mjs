import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createClient} from '@libsql/client';
import {failureCode,responseIncident,clientIncident} from '../lib/diagnostics.js';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-diagnostics-')),'test.db');process.env.ADMIN_PASSWORD='senha-diagnostics-teste';process.env.SESSION_SECRET='segredo-diagnostics-teste';
const {handle}=await import('../lib/core.js'),db=createClient({url:process.env.TURSO_DATABASE_URL});
const call=(body,cookie)=>handle(new Request('http://local/api',{method:'POST',headers:{'content-type':'application/json',...cookie?{cookie}:{}},body:JSON.stringify(body)}));
const api=async(body,cookie)=>{const r=await call(body,cookie);assert.equal(r.status,200,await r.clone().text());return r.json()};
const login=async body=>{const r=await call({op:'login',...body});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]};
let master;
test('classificação usa códigos fixos, ignora concorrência e não carrega mensagens',()=>{
 assert.equal(failureCode({code:'SQLITE_ERROR',message:'senha privada'}),'DATABASE_FAILURE');assert.equal(failureCode(Error('Configure SESSION_SECRET antes de iniciar o sistema.')),'CONFIGURATION_FAILURE');
 assert.equal(failureCode(Error('Modelo do docente não encontrado na instalação.')),'EXPORT_MODEL_MISSING');
 for(const status of [200,400,401,403,404,409,429])assert.equal(responseIncident('set',status),null);
 assert.equal(responseIncident('xlsx',400).code,'EXPORT_REJECTED');assert.equal(responseIncident('set',500).category,'salvamento');assert.equal(responseIncident('diagnostics_list',500),null);
 assert.equal(clientIncident('script','URL COM SENHA').operation,'api');assert.throws(()=>clientIncident('texto livre','set'));
});
test('apenas mestre consulta e trata; equipe envia somente eventos limitados e alunos não enviam',async()=>{
 master=await login({password:process.env.ADMIN_PASSWORD});await api({op:'set',id:'turma-diag',base:0,data:{state:{cfg:{turma:'DIAG',turno:'Matutino',aulasDia:4},ucs:[],days:{},reg:{}}}},master);
 assert.equal((await call({op:'diagnostics_list'})).status,401);
 for(const role of ['coord','docente','ambientes']){
  await api({op:'user_add',login:role,nome:role,password:'senha-diag-perfil',role},master);const cookie=await login({login:role,password:'senha-diag-perfil'});
  assert.equal((await call({op:'diagnostics_list'},cookie)).status,403);assert.equal((await call({op:'diagnostics_resolve',id:'x',count:1},cookie)).status,403);
  assert.equal((await call({op:'diagnostics_client',event:'script',operation:'ui'},cookie)).status,200);
 }
 const code=await api({op:'student_code_generate',turmaId:'turma-diag'},master),response=await call({op:'student_login',code:code.code}),student=response.headers.get('set-cookie').split(';')[0];assert.equal((await call({op:'diagnostics_client',event:'script'},student)).status,403);
});
test('agrupa falhas sem dados pessoais, marca análise e reabre após recorrência',async()=>{
 for(let i=0;i<2;i++)await api({op:'diagnostics_client',event:'network',operation:'set',message:'Aluno privado senha=123',url:'https://privado/?token=segredo',stack:'Dado privado'},master);
 const list=await api({op:'diagnostics_list',category:'conexao'},master),item=list.items[0];assert.equal(list.items.length,1);assert.equal(item.count,2);assert.equal(item.operation,'set');
 for(const secret of ['Aluno privado','senha=123','token=segredo','Dado privado','https://privado'])assert.ok(!JSON.stringify(list).includes(secret));
 const rows=JSON.stringify((await db.execute('SELECT * FROM system_events')).rows);assert.ok(!rows.includes('Aluno privado'));assert.ok(!rows.includes('segredo'));
 await api({op:'diagnostics_resolve',id:item.id,count:2},master);assert.equal((await api({op:'diagnostics_list',category:'conexao'},master)).items.length,0);
 await api({op:'diagnostics_client',event:'network',operation:'set'},master);
 const again=(await api({op:'diagnostics_list',category:'conexao'},master)).items[0];assert.equal(again.id,item.id);assert.equal(again.count,3);assert.equal(again.resolvedAt,null);
 assert.equal((await call({op:'diagnostics_resolve',id:item.id,count:2},master)).status,409);
});
test('falha de salvamento reverte dados e mantém o diagnóstico com referência fora da transação',async()=>{
 await db.execute("CREATE TRIGGER diag_save_fail BEFORE UPDATE ON docs WHEN NEW.id='turma-diag' BEGIN SELECT RAISE(ABORT,'Aluno privado senha-secreta'); END");
 try{
  const response=await call({op:'set',id:'turma-diag',base:1,data:{state:{cfg:{turma:'ALTERADA',turno:'Matutino',aulasDia:4},ucs:[],days:{},reg:{}}}},master);
  assert.equal(response.status,500);const body=await response.json();assert.ok(!JSON.stringify(body).includes('Aluno privado'));assert.ok(!body.error.includes('senha-secreta'));
  const item=(await api({op:'diagnostics_list',category:'salvamento'},master)).items[0];assert.equal(item.code,'DATABASE_FAILURE');assert.equal(item.reference,response.headers.get('x-request-id'));assert.ok(body.error.includes(item.reference));
  assert.equal(JSON.parse((await db.execute("SELECT data FROM docs WHERE id='turma-diag'")).rows[0].data).state.cfg.turma,'DIAG');
 }finally{await db.execute('DROP TRIGGER diag_save_fail')}
});
test('exportações recusadas geram avisos e autenticação recusada não gera ruído',async()=>{
 const get=cookie=>handle(new Request('http://local/api?export=xlsx&turma=turma-diag',{headers:cookie?{cookie}:{}}));
 assert.equal((await get()).status,401);for(let i=0;i<2;i++)assert.equal((await get(master)).status,400);
 const items=(await api({op:'diagnostics_list',category:'exportacao'},master)).items;assert.equal(items.length,1);assert.equal(items[0].count,2);assert.equal(items[0].code,'EXPORT_REJECTED');
});
test('serviços com falha registram somente canal e código HTTP, sem resposta ou destinatários',async()=>{
 await api({op:'set',id:'turma-email-diag',base:0,data:{state:{cfg:{turma:'EMAIL',turno:'Matutino',aulasDia:4,destinatarios:'privado@example.test'},ucs:[],days:{},reg:{}}}},master);
 process.env.RESEND_API_KEY='chave-secreta-teste';process.env.MAIL_FROM='avisos@example.test';const original=globalThis.fetch;globalThis.fetch=async()=>new Response('Aluno privado token=confidencial',{status:503});
 try{await api({op:'notify_send',turma:'email-diag',kind:'manual',assunto:'Teste',texto:'Conteúdo privado',canal:'email'},master)}finally{globalThis.fetch=original;delete process.env.RESEND_API_KEY;delete process.env.MAIL_FROM}
 const list=await api({op:'diagnostics_list',category:'servicos'},master);assert.equal(list.items[0].operation,'email');assert.equal(list.items[0].status,503);assert.equal(list.items[0].code,'SERVICE_FAILURE');
 assert.ok(!JSON.stringify(list).includes('confidencial'));assert.ok(!JSON.stringify(list).includes('privado@example.test'));
 const log=await api({op:'notify_log'},master);assert.equal(log.items[0].erro,'Resend 503');
});
test('limita envios do navegador por conta e mantém registros fora dos backups de dados',async()=>{
 await api({op:'user_add',login:'limite',nome:'Limite',password:'senha-diag-limite'},master);const cookie=await login({login:'limite',password:'senha-diag-limite'});
 for(let i=0;i<10;i++)assert.equal((await call({op:'diagnostics_client',event:'promise',operation:'ui'},cookie)).status,200);
 assert.equal((await call({op:'diagnostics_client',event:'promise',operation:'ui'},cookie)).status,429);
 const backup=await api({op:'backup_now'},master),payload=JSON.parse((await api({op:'backup_download',id:backup.id},master)).data);assert.ok(!Object.hasOwn(payload,'system_events'));assert.ok(!Object.hasOwn(payload,'diagnostic_limits'));
});
test('falha do próprio registro não muda a resposta do serviço nem grava mensagens brutas no console',async()=>{
 await db.execute("CREATE TRIGGER diag_log_fail BEFORE INSERT ON system_events BEGIN SELECT RAISE(ABORT,'Aluno privado no registro'); END");
 const original=globalThis.fetch,warn=console.warn,warnings=[];console.warn=(...args)=>warnings.push(args.join(' '));process.env.RESEND_API_KEY='teste-sem-envio-real';process.env.MAIL_FROM='avisos@example.test';globalThis.fetch=async()=>new Response('senha-secreta no provedor',{status:503});
 try{
  const response=await call({op:'notify_send',turma:'email-diag',kind:'manual',assunto:'Teste',texto:'Conteúdo privado',canal:'email'},master);assert.equal(response.status,200);assert.equal((await response.json()).ok,false);assert.ok(warnings.length);assert.ok(!warnings.join(' ').includes('Aluno privado'));assert.ok(!warnings.join(' ').includes('senha-secreta'));
 }finally{globalThis.fetch=original;console.warn=warn;delete process.env.RESEND_API_KEY;delete process.env.MAIL_FROM;await db.execute('DROP TRIGGER diag_log_fail')}
});
test('rotina diária registra falha de backup mesmo quando é executada sem requisição HTTP',async()=>{
 const {runDaily}=await import('../lib/core.js');await db.execute("CREATE TRIGGER diag_backup_fail BEFORE INSERT ON backups BEGIN SELECT RAISE(ABORT,'senha-secreta do backup'); END");
 try{
  // Força uma mudança para que o backup agendado tente criar uma versão.
  await api({op:'set',id:'controle-diag',data:{value:1},base:0},master);
  const result=await runDaily(new Date('2028-01-04T12:00:00Z'));assert.match(result.backup.error,/DATABASE_FAILURE/);assert.ok(!JSON.stringify(result).includes('senha-secreta'));
  const list=await api({op:'diagnostics_list',category:'salvamento'},master);assert.ok(list.items.some(i=>i.operation==='backup_now'&&i.code==='DATABASE_FAILURE'));
 }finally{await db.execute('DROP TRIGGER diag_backup_fail')}
});
test('retém apenas 30 dias e no máximo 500 grupos',async()=>{
 await db.execute("UPDATE system_events SET last_at='2000-01-01T00:00:00.000Z'");assert.equal((await api({op:'diagnostics_list',state:'all'},master)).items.length,0);
 const now=new Date().toISOString();await db.execute({sql:`WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<501)
 INSERT INTO system_events(id,fingerprint,source,category,severity,operation,status,code,reference,first_at,last_at) SELECT 'seed-'||x,'seed-'||x,'servidor','servidor','erro','api',500,'SERVER_UNEXPECTED','ref',?,? FROM n`,args:[now,now]});
 await api({op:'diagnostics_client',event:'promise',operation:'ui'},master);
 const report=await api({op:'diagnostics_list',state:'all'},master);assert.equal(report.summary.open,500);assert.equal(report.items.length,100);assert.equal(report.matching,500);
});
