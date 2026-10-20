import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {today} from '../lib/reservations.js';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-key-kiosk-')),'test.db');
process.env.ADMIN_PASSWORD='mestre-painel-teste';process.env.SESSION_SECRET='segredo-painel-teste';
const {handle}=await import('../lib/core.js');
const call=(body,cookie='',kiosk=true)=>handle(new Request('https://localhost/api'+(kiosk?'?kiosk=1':''),{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(body)}));
const get=(cookie='',query='?kiosk=1')=>handle(new Request('https://localhost/api'+query,{headers:{cookie}}));
const ok=async(body,cookie='',kiosk=true)=>{const response=await call(body,cookie,kiosk);const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));return result};
const login=async(body,kiosk=true)=>{const response=await call({op:'login',...body},'',kiosk);assert.equal(response.status,200);return response.headers.get('set-cookie')};
let master,kioskCookie,key,item;
test('prepara contas e chave liberada para o docente',async()=>{
 master=(await login({password:process.env.ADMIN_PASSWORD},false)).split(';')[0];
 await ok({op:'set',id:'geral',base:0,data:{docentes:[{nome:'Ana'},{nome:'Bia'}]}},master,false);
 for(const name of ['ana','bia']){await ok({op:'user_add',login:name,nome:name,password:'senha-docente-teste',role:'docente'},master,false);await ok({op:'user_link',login:name,docente:name==='ana'?'Ana':'Bia'},master,false)}
 await ok({op:'user_add',login:'gestao',nome:'Gestão',role:'ambientes',password:'senha-gestao-teste'},master,false);
 await ok({op:'environment_save',base:0,items:[{id:'lab',nome:'Laboratório piloto',tipo:'laboratorio',ativo:true,capacidade:20}]},master,false);
 await ok({op:'set',id:'turma-painel',base:0,data:{state:{cfg:{turma:'PILOTO',curso:'Sistemas',turno:'Matutino',aulasDia:4,inicio:today(),termino:today()},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',ch:40}],days:{[today()]:{s:['LOG']}},reg:{}}}},master,false);
 key=(await ok({op:'key_create',code:'CH-01',ambienteId:'lab'},master,false)).key;
 const lesson=(await ok({op:'managed_lessons'},master,false)).items[0];
 item=(await ok({op:'key_allocate',...lesson,keyId:key.id},master,false)).item;
});
test('painel não herda sessão mestre nem divulga catálogo sem identificação',async()=>{
 assert.deepEqual(await (await get(master)).json(),{user:null});
 assert.equal((await call({op:'key_list'},master)).status,401);
 assert.equal((await call({op:'login',password:process.env.ADMIN_PASSWORD})).status,403);
 assert.equal((await call({op:'login',login:'gestao',password:'senha-gestao-teste'})).status,403);
});
test('sessão docente do painel é curta, HttpOnly, Secure e isolada por finalidade',async()=>{
 const cookie=await login({login:'ana',password:'senha-docente-teste'});assert.match(cookie,/^plan_key_kiosk=/);assert.match(cookie,/Max-Age=300/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Secure/);kioskCookie=cookie.split(';')[0];
 const token=decodeURIComponent(kioskCookie.split('=')[1]),payload=JSON.parse(Buffer.from(token.split('.')[0],'base64url').toString());assert.equal(payload.k,true);assert.ok(payload.e>Date.now()&&payload.e<=Date.now()+300000);
 assert.equal((await (await get(kioskCookie)).json()).user.docente,'Ana');
 assert.equal((await (await get(kioskCookie,'')).json()).user,null);
 assert.equal((await (await get(kioskCookie.replace('plan_key_kiosk=','plan_sess='),'')).json()).user,null);
 assert.equal((await (await get(master.replace('plan_sess=','plan_key_kiosk='))).json()).user,null);
});
test('escopo do painel não permite gestão, agendas, exportações ou recuperação',async()=>{
 for(const op of ['set','users','key_create','key_allocate','environment_list','student_login','password_reset_request'])assert.equal((await call({op},kioskCookie)).status,403,op);
 assert.equal((await get(kioskCookie,'?kiosk=1&export=xlsx')).status,403);
 const snapshot=await (await get(kioskCookie)).json();assert.equal(Object.hasOwn(snapshot,'docs'),false);assert.equal(Object.hasOwn(snapshot.user,'sessionVersion'),false);
 const own=await ok({op:'key_list'},kioskCookie);assert.equal(own.items.length,1);assert.equal(own.keys.length,0);
 const bia=(await login({login:'bia',password:'senha-docente-teste'})).split(';')[0];assert.equal((await ok({op:'key_list'},bia)).items.length,0);
});
test('QR e assinatura registram movimentos reais; logout do painel preserva sessão administrativa',async()=>{
 const signature=[[[.1,.4],[.15,.3],[.2,.5],[.25,.2],[.3,.6],[.4,.3],[.5,.5],[.6,.4],[.7,.2],[.8,.5]]];
 assert.equal((await ok({op:'key_scan',token:key.token},kioskCookie)).items[0].id,item.id);
 await ok({op:'key_sign',id:item.id,token:key.token,action:'retirada',name:'Ana',consent:true,signature},kioskCookie);
 await ok({op:'key_sign',id:item.id,token:key.token,action:'devolucao',name:'Ana',consent:true,signature},kioskCookie);
 assert.equal((await ok({op:'key_list'},kioskCookie)).items[0].status,'devolvida');
 const result=await call({op:'logout'},master+'; '+kioskCookie);assert.match(result.headers.get('set-cookie'),/^plan_key_kiosk=;/);assert.equal(result.headers.get('set-cookie').includes('plan_sess='),false);
 assert.equal((await (await get(master,'')).json()).user.master,true);
});
