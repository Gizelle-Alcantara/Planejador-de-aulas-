import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createClient} from '@libsql/client';
import {base32,totp,matchCounter} from '../lib/master-mfa.js';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'master-mfa-')),'test.db');
process.env.ADMIN_PASSWORD='master-mfa-test-password';process.env.SESSION_SECRET='master-mfa-session-secret';
const {handle,restoreBackupPayload}=await import('../lib/core.js');
const db=createClient({url:process.env.TURSO_DATABASE_URL});
const call=(body,cookie='')=>handle(new Request('https://agenda.test/api',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(body)}));
const session=r=>r.headers.get('set-cookie')?.split(';')[0];
const password=process.env.ADMIN_PASSWORD;
let master,secret,codes,active;

test('TOTP confere os seis vetores SHA1 da RFC 6238 e rejeita reutilização',()=>{
 const key=base32(Buffer.from('12345678901234567890'));assert.equal(key,'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
 for(const [time,expected] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']])assert.equal(totp(key,Math.floor(time/30),8),expected);
 const counter=Math.floor(Date.now()/30000),code=totp(key,counter);assert.equal(matchCounter(key,code,counter),null);assert.equal(matchCounter(key,'abcdef'),null);assert.equal(matchCounter(key,totp(key,counter-3)),null);
});

test('configuração exige master e senha; chave pendente criptografada não ativa o segundo fator',async()=>{
 master=session(await call({op:'login',password}));
 assert.equal((await call({op:'master_mfa_begin',password})).status,401);
 await call({op:'user_add',login:'coord-mfa',password:'coord-mfa-password'},master);
 const coord=session(await call({op:'login',login:'coord-mfa',password:'coord-mfa-password'}));
 for(const op of ['master_mfa_status','master_mfa_begin','master_mfa_confirm','master_mfa_disable'])assert.equal((await call({op,password},coord)).status,403);
 assert.equal((await call({op:'master_mfa_begin',password:'errada'},master)).status,401);
 const setup=await(await call({op:'master_mfa_begin',password},master)).json();secret=setup.secret;assert.match(secret,/^[A-Z2-7]{32}$/);assert.match(setup.uri,/^otpauth:\/\/totp\//);
 const row=(await db.execute('SELECT * FROM master_mfa')).rows[0];assert.notEqual(row.pending,secret);assert.equal(row.secret,null);
 const status=await(await call({op:'master_mfa_status'},master)).json();assert.deepEqual(status,{ok:true,enabled:false,recoveryRemaining:0});
 assert.equal((await call({op:'master_mfa_confirm',password,code:'invalid'},master)).status,400);
 await db.execute('UPDATE master_mfa SET pending_until=0');assert.equal((await call({op:'master_mfa_confirm',password,code:totp(secret,Math.floor(Date.now()/30000))},master)).status,400);
 secret=(await(await call({op:'master_mfa_begin',password},master)).json()).secret;
});

test('ativação confirma posse, fornece recuperação uma vez e invalida sessões anteriores',async()=>{
 await db.execute('DELETE FROM login_limits');
 const response=await call({op:'master_mfa_confirm',password,code:totp(secret,Math.floor(Date.now()/30000))},master);assert.equal(response.status,200);
 const result=await response.json();codes=result.recoveryCodes;assert.equal(codes.length,10);assert.equal(new Set(codes).size,10);active=session(response);assert.ok(active);
 assert.equal((await call({op:'history'},master)).status,401);
 assert.equal((await call({op:'history'},active)).status,200);
 const status=await(await call({op:'master_mfa_status'},active)).json();assert.deepEqual(status,{ok:true,enabled:true,recoveryRemaining:10});
 const row=(await db.execute('SELECT * FROM master_mfa')).rows[0];assert.notEqual(row.secret,secret);assert.equal(row.pending,null);for(const code of codes)assert.ok(!row.recovery.includes(code));
 assert.equal((await call({op:'master_mfa_begin',password},active)).status,400);
 const backup=await(await call({op:'backup_now'},active)).json(),payload=JSON.parse((await(await call({op:'backup_download',id:backup.id},active)).json()).data);
 assert.ok(!JSON.stringify(payload).includes(secret));assert.equal(payload.master_mfa,undefined);
 await restoreBackupPayload(payload);assert.equal((await(await call({op:'master_mfa_status'},active)).json()).enabled,true);
});

test('login exige senha e segundo fator, recusa replay e consome recuperação atomicamente',async()=>{
 await db.execute('DELETE FROM login_limits');
 const noCode=await call({op:'login',password});assert.equal(noCode.status,401);assert.equal((await noCode.json()).mfaRequired,true);assert.equal(session(noCode),undefined);
 assert.equal((await call({op:'login',password,code:totp(secret,Math.floor(Date.now()/30000))})).status,401);
 const counter=Number((await db.execute('SELECT last_counter FROM master_mfa')).rows[0].last_counter)+1;
 const attempts=await Promise.all([call({op:'login',password,code:totp(secret,counter)}),call({op:'login',password,code:totp(secret,counter)})]);assert.deepEqual(attempts.map(r=>r.status).sort(),[200,401]);active=session(attempts.find(r=>r.status===200));
 assert.equal((await call({op:'login',password:'errada',code:codes[0]})).status,401);
 const concurrent=await Promise.all([call({op:'login',password,code:codes[0]}),call({op:'login',password,code:codes[0]})]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,401]);
 assert.equal((await call({op:'login',password,code:codes[0]})).status,401);
 assert.equal((await(await call({op:'master_mfa_status'},active)).json()).recoveryRemaining,9);
});



test('desativação exige senha e código; revoga sessões e limita tentativas',async()=>{
 await db.execute('DELETE FROM login_limits');
 assert.equal((await call({op:'master_mfa_disable',password:'errada',code:codes[1]},active)).status,401);
 assert.equal((await call({op:'master_mfa_disable',password,code:'invalido'},active)).status,401);
 const response=await call({op:'master_mfa_disable',password,code:codes[1]},active);assert.equal(response.status,200);
 assert.equal((await call({op:'history'},active)).status,401);active=session(response);
 assert.equal((await(await call({op:'master_mfa_status'},active)).json()).enabled,false);
 const logged=await call({op:'login',password});assert.equal(logged.status,200);active=session(logged);
 for(let i=0;i<10;i++)assert.equal((await call({op:'master_mfa_begin',password:'errada'},active)).status,401);
 const limited=await call({op:'master_mfa_begin',password},active);assert.equal(limited.status,429);assert.ok(Number(limited.headers.get('retry-after'))>0);
});

test('senha correta não contorna o limite de tentativas do segundo fator',async()=>{
 await db.execute('DELETE FROM login_limits');
 const setup=await(await call({op:'master_mfa_begin',password},active)).json();
 const confirmed=await call({op:'master_mfa_confirm',password,code:totp(setup.secret,Math.floor(Date.now()/30000))},active);assert.equal(confirmed.status,200);const recovery=(await confirmed.json()).recoveryCodes[0];
 await db.execute('DELETE FROM login_limits');
 for(let i=0;i<10;i++){const response=await call({op:'login',password,code:'invalido'});assert.equal(response.status,401);assert.equal(session(response),undefined)}
 const limited=await call({op:'login',password,code:recovery});assert.equal(limited.status,429);assert.equal(session(limited),undefined);
});
