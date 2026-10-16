import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';import {createClient} from '@libsql/client';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-reset-')),'test.db');process.env.ADMIN_PASSWORD='mestre-reset-teste';process.env.SESSION_SECRET='segredo-reset-teste';process.env.PUBLIC_URL='https://agenda.example.test';process.env.RESEND_API_KEY='teste-sem-envio-real';process.env.MAIL_FROM='Agenda <avisos@example.test>';
const {handle}=await import('../lib/core.js'),client=createClient({url:process.env.TURSO_DATABASE_URL}),mails=[];
globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails/batch');mails.push(...JSON.parse(options.body));return new Response('{}',{status:200})};
const call=(body,cookie)=>handle(new Request('https://host-nao-confiavel.example/api',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.1',...(cookie?{cookie}:{})},body:JSON.stringify(body)}));
const master=(await call({op:'login',password:process.env.ADMIN_PASSWORD})).headers.get('set-cookie').split(';')[0];
async function account(login){assert.equal((await call({op:'user_add',login,password:'senha-antiga-123',recoveryEmail:login+'@example.test'},master)).status,200)}
async function request(login,cookie){const before=mails.length,response=await call({op:'password_reset_request',login,email:login+'@example.test'},cookie);assert.equal(response.status,200);assert.equal(mails.length,before+1);return {response,token:mails.at(-1).text.match(/#token=([a-f0-9]{64})/)[1]}}
test('recuperação entrega somente por e-mail, usa origem configurada e revoga sessões após a troca',async()=>{
 await account('recupera');const session=(await call({op:'login',login:'recupera',password:'senha-antiga-123'})).headers.get('set-cookie').split(';')[0],{response,token}=await request('recupera');
 assert.ok(mails.at(-1).text.includes('https://agenda.example.test/recuperar.html#token='));assert.ok(!mails.at(-1).text.includes('host-nao-confiavel'));assert.ok(!(await response.text()).includes(token));assert.deepEqual(mails.at(-1).to,['recupera@example.test']);
 const row=(await client.execute({sql:'SELECT token_hash FROM password_resets WHERE login=?',args:['recupera']})).rows[0];assert.notEqual(row.token_hash,token);assert.equal(row.token_hash,createHash('sha256').update(token).digest('hex'));
 assert.equal((await call({op:'password_reset_confirm',token,password:'nova-senha-123'})).status,200);assert.equal((await call({op:'password_reset_confirm',token,password:'outra-senha-123'})).status,400);
 assert.equal((await call({op:'login',login:'recupera',password:'senha-antiga-123'})).status,401);assert.equal((await call({op:'login',login:'recupera',password:'nova-senha-123'})).status,200);assert.equal((await handle(new Request('https://agenda.example.test/api',{headers:{cookie:session}}))).status,401);
});
test('links expiram, são substituídos e somente uma confirmação concorrente pode ter sucesso',async()=>{
 await account('expira');let {token}=await request('expira');await client.execute({sql:'UPDATE password_resets SET expires_at=0 WHERE login=?',args:['expira']});assert.equal((await call({op:'password_reset_confirm',token,password:'senha-nova-123'})).status,400);
 const old=(await request('expira')).token,current=(await request('expira')).token;assert.equal((await call({op:'password_reset_confirm',token:old,password:'senha-nova-123'})).status,400);
 const results=await Promise.all([call({op:'password_reset_confirm',token:current,password:'nova-concorrente-1'}),call({op:'password_reset_confirm',token:current,password:'nova-concorrente-2'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
});
test('respostas não revelam contas; limitação persiste no banco e ausência de serviço não simula envio',async()=>{
 await account('limite');const valid=await request('limite'),generic=await valid.response.json(),before=mails.length;assert.deepEqual(await(await call({op:'password_reset_request',login:'naoexiste',email:'naoexiste@example.test'})).json(),generic);assert.deepEqual(await(await call({op:'password_reset_request',login:'limite',email:'errado@example.test'})).json(),generic);assert.equal(mails.length,before);
 for(let i=0;i<6;i++)await call({op:'password_reset_request',login:'limite',email:'limite@example.test'});assert.equal(mails.filter(m=>m.to[0]==='limite@example.test').length,4);
 delete process.env.RESEND_API_KEY;assert.equal((await(await call({op:'password_reset_status'})).json()).enabled,false);assert.equal((await call({op:'password_reset_request',login:'limite',email:'limite@example.test'})).status,503);process.env.RESEND_API_KEY='teste-sem-envio-real';
});
test('somente mestre altera e-mails e alterações administrativas invalidam links pendentes',async()=>{
 await account('controle');const session=(await call({op:'login',login:'controle',password:'senha-antiga-123'})).headers.get('set-cookie').split(';')[0];assert.equal((await call({op:'user_recovery_email',login:'controle',email:'intruso@example.test'},session)).status,403);
 let {token}=await request('controle');assert.equal((await call({op:'user_recovery_email',login:'controle',email:'novo@example.test'},master)).status,200);assert.equal((await call({op:'password_reset_confirm',token,password:'senha-nova-123'})).status,400);
 await call({op:'user_recovery_email',login:'controle',email:'controle@example.test'},master);token=(await request('controle')).token;await call({op:'user_pw',login:'controle',password:'senha-administrada'},master);assert.equal((await call({op:'password_reset_confirm',token,password:'senha-nova-123'})).status,400);
 assert.equal((await call({op:'password_reset_confirm',token:'invalido',password:'senha-nova-123'})).status,400);assert.equal((await call({op:'password_reset_confirm',token:'a'.repeat(64),password:'curta'})).status,400);
});
test('backup preserva e-mails de recuperação sem restaurar links pendentes',async()=>{
 await account('backupreset');const backup=await(await call({op:'backup_now'},master)).json(),download=await(await call({op:'backup_download',id:backup.id},master)).json(),payload=JSON.parse(download.data);
 assert.equal(payload.users.find(u=>u.login==='backupreset').recovery_email,'backupreset@example.test');assert.equal(payload.password_resets,undefined);
 const {token}=await request('backupreset');await call({op:'user_recovery_email',login:'backupreset',email:'alterado@example.test'},master);assert.equal((await call({op:'backup_restore',id:backup.id},master)).status,200);
 const users=await(await call({op:'users'},master)).json();assert.equal(users.users.find(u=>u.login==='backupreset').recoveryEmail,'backupreset@example.test');assert.equal((await call({op:'password_reset_confirm',token,password:'senha-nova-123'})).status,400);
});
test('falha de entrega não deixa token utilizável e origem pública insegura desabilita recuperação',async()=>{
 await account('falhaemail');const savedFetch=globalThis.fetch;globalThis.fetch=async()=>new Response('indisponível',{status:503});
 try{assert.equal((await call({op:'password_reset_request',login:'falhaemail',email:'falhaemail@example.test'})).status,200);assert.equal((await client.execute({sql:'SELECT COUNT(*) AS n FROM password_resets WHERE login=?',args:['falhaemail']})).rows[0].n,0)}finally{globalThis.fetch=savedFetch}
 const old=process.env.PUBLIC_URL;process.env.PUBLIC_URL='http://site-inseguro.example';assert.equal((await(await call({op:'password_reset_status'})).json()).enabled,false);process.env.PUBLIC_URL=old;
});
