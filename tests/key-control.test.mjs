import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {today} from '../lib/reservations.js';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-keys-')),'test.db');process.env.ADMIN_PASSWORD='senha-mestre-chave';process.env.SESSION_SECRET='segredo-chave-teste';
const {handle}=await import('../lib/core.js');
const call=(body,cookie)=>handle(new Request('http://localhost/api',{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)}));
const ok=async(body,cookie)=>{const r=await call(body,cookie),j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j};
const login=async body=>(await call({op:'login',...body})).headers.get('set-cookie').split(';')[0];
const signature=[[[.1,.4],[.15,.3],[.2,.5],[.25,.2],[.3,.6],[.4,.3],[.5,.5],[.6,.4],[.7,.2],[.8,.5]]];
let master,manager,ana,bia,key,second,item,receipt;
test('prepara aulas, ambientes e contas vinculadas',async()=>{
 master=await login({password:'senha-mestre-chave'});
 await ok({op:'set',id:'geral',base:0,data:{docentes:[{nome:'Ana'},{nome:'Bia'}]}},master);
 for(const [name,role] of [['gestor','ambientes'],['ana','docente'],['bia','docente']]){await ok({op:'user_add',login:name,nome:name,password:'senha-chave-123',role},master);if(role==='docente')await ok({op:'user_link',login:name,docente:name==='ana'?'Ana':'Bia'},master)}
 manager=await login({login:'gestor',password:'senha-chave-123'});ana=await login({login:'ana',password:'senha-chave-123'});bia=await login({login:'bia',password:'senha-chave-123'});
 await ok({op:'environment_save',base:0,items:[{id:'lab',nome:'Laboratório',tipo:'laboratorio',ativo:true,capacidade:20},{id:'sala',nome:'Sala 1',tipo:'sala',ativo:true,capacidade:25}]},master);
 const tomorrow=new Date(today()+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
 await ok({op:'set',id:'turma-chave',base:0,data:{state:{cfg:{turma:'T1',curso:'Sistemas',turno:'Matutino',aulasDia:4,inicio:today(),termino:'2099-12-31'},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',ch:40}],days:{[today()]:{s:['LOG']},[tomorrow.toISOString().slice(0,10)]:{s:['LOG']}},reg:{}}}},master);
});
test('cadastro exclusivo da gestão, identificação única e QR opaco',async()=>{
 assert.equal((await call({op:'key_create',code:'CH-1',ambienteId:'lab'})).status,401);
 assert.equal((await call({op:'key_create',code:'CH-1',ambienteId:'lab'},ana)).status,403);
 key=(await ok({op:'key_create',code:'CH-1',ambienteId:'lab'},manager)).key;second=(await ok({op:'key_create',code:'CH-2',ambienteId:'sala'},manager)).key;
 assert.match(key.token,/^[a-f0-9]{64}$/);assert.equal((await call({op:'key_create',code:'ch-1',ambienteId:'lab'},manager)).status,409);
 assert.equal((await ok({op:'key_list'},ana)).keys.length,0);
});
test('alocação cria reserva aprovada de laboratório e evita duplicidade',async()=>{
 const lesson=(await ok({op:'managed_lessons'},manager)).items.find(l=>l.data===today());
 assert.equal((await call({op:'key_allocate',...lesson,keyId:key.id},ana)).status,403);
 item=(await ok({op:'key_allocate',...lesson,keyId:key.id},manager)).item;
 assert.equal(item.status,'alocada');const reservations=(await ok({op:'reservation_list'},manager)).items;assert.equal(reservations.find(r=>r.id===item.reservationId).status,'aprovada');
 assert.equal((await call({op:'key_allocate',...lesson,keyId:key.id},manager)).status,409);
 assert.equal((await ok({op:'key_list'},bia)).items.length,0);
});
test('QR e assinatura são exigidos e outro docente não pode retirar',async()=>{
 const base={op:'key_sign',id:item.id,action:'retirada',token:key.token,name:'Ana',consent:true,signature};
 assert.equal((await call(base,bia)).status,403);assert.equal((await call({...base,token:second.token},ana)).status,409);
 assert.equal((await call({...base,signature:[]},ana)).status,400);assert.equal((await call({...base,consent:false},ana)).status,400);assert.equal((await call({...base,name:'Outro nome'},ana)).status,400);
 const scan=await ok({op:'key_scan',token:key.token},ana);assert.equal(scan.items[0].id,item.id);
 assert.equal((await ok({op:'key_scan',token:key.token},bia)).items.length,0);
 assert.equal((await call({op:'key_scan',token:'x'},ana)).status,400);
});
test('retirada concorrente grava uma única assinatura com integridade',async()=>{
 const body={op:'key_sign',id:item.id,action:'retirada',token:key.token,name:'Ana',consent:true,signature};
 const responses=await Promise.all([call(body,ana),call(body,ana)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);receipt=(await responses.find(r=>r.status===200).json()).receipt;
 const {hash,...payload}=receipt;assert.equal(hash,createHash('sha256').update(JSON.stringify(payload)).digest('hex'));assert.equal(receipt.login,'ana');assert.ok(Date.now()-Date.parse(receipt.at)<10000);
 assert.equal((await call({op:'key_cancel',id:item.id},manager)).status,409);assert.equal((await call({op:'key_toggle',id:key.id},manager)).status,409);
});
test('comprovantes são privados e não vazam na carga inicial',async()=>{
 assert.equal((await call({op:'key_receipt',id:receipt.id},bia)).status,404);assert.equal((await ok({op:'key_receipt',id:receipt.id},ana)).receipt.hash,receipt.hash);
 const response=await handle(new Request('http://localhost/api',{headers:{cookie:manager}}));assert.ok(!(await response.text()).includes(key.token));
 const item=(await ok({op:'key_list'},manager)).items[0];assert.equal(item.events[0].signature,undefined);
});
test('devolução permanece possível após cancelamento da reserva e não duplica',async()=>{
 await ok({op:'reservation_cancel',id:item.reservationId},manager);
 const r=await ok({op:'key_sign',id:item.id,action:'devolucao',token:key.token,name:'Ana',consent:true,signature},ana);assert.equal(r.receipt.previousHash,receipt.hash);
 assert.equal((await call({op:'key_sign',id:item.id,action:'devolucao',token:key.token,name:'Ana',consent:true,signature},ana)).status,409);
 assert.equal((await ok({op:'key_list'},manager)).items[0].status,'devolvida');
});
test('alocação futura não pode retirar e chave com alocação não pode desativar',async()=>{
 const future=(await ok({op:'managed_lessons'},manager)).items.find(l=>l.data>today());const a=(await ok({op:'key_allocate',...future,keyId:second.id},manager)).item;
 assert.ok((await ok({op:'key_list',upcoming:true},ana)).items.some(x=>x.id===a.id));assert.ok(!(await ok({op:'key_list',upcoming:true},bia)).items.some(x=>x.id===a.id));assert.equal((await ok({op:'key_list',upcoming:true},ana)).keys.length,0);
 assert.equal((await call({op:'key_sign',id:a.id,action:'retirada',token:second.token,name:'Ana',consent:true,signature},ana)).status,409);
 assert.equal((await call({op:'key_toggle',id:second.id},manager)).status,409);await ok({op:'key_cancel',id:a.id},manager);await ok({op:'key_toggle',id:second.id},manager);
});
test('backup completo inclui QR, alocações e assinaturas e restaura sem perder recibos',async()=>{
 const backup=await ok({op:'backup_now'},master),payload=JSON.parse((await ok({op:'backup_download',id:backup.id},master)).data);assert.equal(payload.keyControl.events.length,2);assert.equal(payload.keyControl.keys[0].token,key.token);
 await ok({op:'backup_restore',id:backup.id},master);master=await login({password:'senha-mestre-chave'});assert.equal((await ok({op:'key_receipt',id:receipt.id},master)).receipt.hash,receipt.hash);
});
