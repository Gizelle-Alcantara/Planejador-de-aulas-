import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'auth-security-')),'test.db');
process.env.ADMIN_PASSWORD='master-security-test';process.env.SESSION_SECRET='session-security-test';
const {handle}=await import('../lib/core.js');
const call=(body,headers={})=>handle(new Request('https://agenda.test/api',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)}));
test('CSRF blocks external origins, sibling sites and form submissions',async()=>{
 for(const headers of [{origin:'https://evil.test'},{origin:'null'},{'sec-fetch-site':'same-site'},{'sec-fetch-site':'cross-site'},{'content-type':'text/plain'}])assert.equal((await call({op:'login',password:process.env.ADMIN_PASSWORD},headers)).status,403);
 assert.equal((await call({op:'login',password:process.env.ADMIN_PASSWORD},{origin:'https://agenda.test','sec-fetch-site':'same-origin'})).status,200);
});
test('master cookie carries random version and password rotation invalidates it',async()=>{
 const response=await call({op:'login',password:process.env.ADMIN_PASSWORD}),cookie=response.headers.get('set-cookie').split(';')[0];
 const payload=JSON.parse(Buffer.from(decodeURIComponent(cookie.split('=')[1]).split('.')[0],'base64url'));
 assert.match(payload.v,/^[a-f0-9-]{36}$/);assert.notEqual(payload.v,createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex'));
 process.env.ADMIN_PASSWORD='changed-master-password';
 assert.equal((await handle(new Request('https://agenda.test/api',{headers:{cookie}}))).status,401);
 assert.equal((await call({op:'login',password:process.env.ADMIN_PASSWORD})).status,200);
});
test('login limit persists across requests and normalizes account names',async()=>{
 for(let i=0;i<10;i++)assert.equal((await call({op:'login',login:i%2?' LIMITED ':'limited',password:'wrong'},{'x-forwarded-for':'192.0.2.'+i})).status,401);
 const blocked=await call({op:'login',login:'limited',password:'wrong'},{'x-forwarded-for':'192.0.2.99'});assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);
 assert.equal((await call({op:'login',password:process.env.ADMIN_PASSWORD},{'x-forwarded-for':'192.0.2.100'})).status,200);
});
