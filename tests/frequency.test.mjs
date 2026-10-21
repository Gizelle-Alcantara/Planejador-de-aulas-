import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createClient} from '@libsql/client';
import {unzipSync,strFromU8} from 'fflate';
import {frequencyOperation,recordKeyFrequency,frequencyDays,unionPeriods} from '../lib/frequency.js';
import {frequencyXlsx} from '../lib/frequency-export.js';
import {today} from '../lib/reservations.js';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'frequency-')),'db.sqlite');process.env.ADMIN_PASSWORD='master-frequency-test';process.env.SESSION_SECRET='frequency-test-secret';
const {handle}=await import('../lib/core.js'),client=createClient({url:process.env.TURSO_DATABASE_URL});
const call=(body,cookie='')=>handle(new Request('https://local/api',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(body)}));
const ok=async(body,cookie)=>{const r=await call(body,cookie),data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data};
const login=async(login,password='frequency-password')=>{const r=await call({op:'login',login,password});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]};
const q=(sql,args=[])=>client.execute({sql,args});
const me={login:'profana',nome:'Ana',role:'docente',docente:'Ana',docenteId:'ana'},coord={login:'coord1',nome:'Coordenação 1',role:'coord'},masterMe={login:'admin',nome:'Mestre',role:'coord',master:true};
let master,teacherCookie,coordCookie,otherCookie,key,item,docs;
const signature=[[[.1,.4],[.15,.3],[.2,.5],[.25,.2],[.3,.6],[.4,.3],[.5,.5],[.6,.4],[.7,.2],[.8,.5]]];
test('prepara horista, coordenador responsável e chave no banco isolado',async()=>{
 master=await login('admin',process.env.ADMIN_PASSWORD);
 for(const [login,role] of [['coord1','coord'],['coord2','coord'],['profana','docente'],['profbia','docente'],['gestor','ambientes']])await ok({op:'user_add',login,nome:login,role,password:'frequency-password'},master);
 await ok({op:'set',id:'geral',base:0,data:{docentes:[{id:'ana',nome:'Ana',vinculo:'Horista',matricula:'123',unidade:'Unidade teste',coordenadorFrequencia:'coord1'},{id:'bia',nome:'Bia',vinculo:'Mensalista'}]}},master);
 await ok({op:'user_link',login:'profana',docente:'Ana'},master);await ok({op:'user_link',login:'profbia',docente:'Bia'},master);
 await ok({op:'environment_save',base:0,items:[{id:'lab',nome:'Lab',tipo:'laboratorio',ativo:true,capacidade:20}]},master);
 await ok({op:'set',id:'turma-freq',base:0,data:{state:{cfg:{turma:'FREQ',curso:'Curso',turno:'Matutino',aulasDia:4,inicio:today(),termino:today()},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',ch:4}],days:{[today()]:{s:['LOG']}},reg:{}}}},master);
 key=(await ok({op:'key_create',code:'CH-1',ambienteId:'lab'},master)).key;
 const lesson=(await ok({op:'managed_lessons'},master)).items[0];item=(await ok({op:'key_allocate',...lesson,keyId:key.id},master)).item;
 teacherCookie=await login('profana');coordCookie=await login('coord1');otherCookie=await login('coord2');docs=Object.fromEntries((await q('SELECT id,data FROM docs')).rows.map(r=>[r.id,JSON.parse(r.data)]));
});
test('retirada e devolução reais alimentam a frequência, sem duplicação',async()=>{
 await ok({op:'key_sign',id:item.id,token:key.token,action:'retirada',name:'Ana',consent:true,signature},teacherCookie);
 let sheet=(await ok({op:'frequency_month',month:today().slice(0,7)},teacherCookie)).sheet;assert.equal(sheet.sources.length,1);assert.equal(sheet.pending,1);assert.equal(sheet.sources[0].pickupEventId.length,36);
 assert.equal((await call({op:'frequency_submit',month:sheet.month,rev:sheet.rev,consent:true},teacherCookie)).status,409);
 await ok({op:'key_sign',id:item.id,token:key.token,action:'devolucao',name:'Ana',consent:true,signature},teacherCookie);
 sheet=(await ok({op:'frequency_month',month:sheet.month},teacherCookie)).sheet;assert.equal(sheet.sources.length,1);assert.equal(sheet.pending,0);assert.ok(sheet.sources[0].returnEventId);
 assert.equal((await call({op:'key_sign',id:item.id,token:key.token,action:'devolucao',name:'Ana',consent:true,signature},teacherCookie)).status,409);
});
test('perfis e coordenador responsável são verificados pelo servidor',async()=>{
 assert.equal((await call({op:'frequency_month',teacherId:'ana'},otherCookie)).status,403);
 assert.equal((await call({op:'frequency_month',teacherId:'bia'},teacherCookie)).status,403);
 const gestor=await login('gestor');assert.equal((await call({op:'frequency_config'},gestor)).status,403);
 assert.equal((await call({op:'frequency_month',teacherId:'ana'})).status,401);
 assert.equal((await ok({op:'frequency_config'},coordCookie)).teachers[0].id,'ana');
 assert.equal((await ok({op:'frequency_config'},otherCookie)).teachers.length,0);
 const changed=structuredClone(docs.geral);changed.docentes[0].coordenadorFrequencia='coord2';assert.equal((await call({op:'set',id:'geral',data:changed,base:1},coordCookie)).status,403);
});
test('união de períodos não conta sobreposições nem intervalos vazios',()=>{
 assert.deepEqual(unionPeriods([[480,600],[570,660],[780,900],[900,960]]),[[480,660],[780,960]]);
 const days=frequencyDays({sources:[{date:'2026-09-01',start:480,end:600},{date:'2026-09-01',start:570,end:660},{date:'2026-09-01',start:780,end:900}],adjustments:{}});assert.equal(days[0].minutes,300);
});
const direct=(body,user=me,now=new Date('2026-10-05T12:00:00Z'))=>frequencyOperation(body,user,{q,docs,now});
test('fluxo mensal exige conferência, justificativa, revisão e coordenador correto',async()=>{
 const month='2026-09';let sheet=(await direct({op:'frequency_month',month})).sheet;
 sheet=(await direct({op:'frequency_day_edit',month,rev:sheet.rev,date:'2026-09-01',periods:[[480,720],[780,1020]],note:'Atividade sem chave, horários conferidos.'})).sheet;
 assert.equal(sheet.totalMinutes,480);
 await assert.rejects(()=>direct({op:'frequency_submit',month,rev:sheet.rev,consent:false}),/Confirme/);
 await assert.rejects(()=>direct({op:'frequency_day_edit',month,rev:0,date:'2026-09-01',periods:[],note:'Alteração concorrente'}),e=>e.status===409);
 sheet=(await direct({op:'frequency_submit',month,rev:sheet.rev,consent:true})).sheet;assert.equal(sheet.status,'submitted');
 await assert.rejects(()=>direct({op:'frequency_day_edit',month,rev:sheet.rev,date:'2026-09-01',periods:[],note:'Ajuste docente'}),e=>e.status===409);
 await assert.rejects(()=>direct({op:'frequency_review',teacherId:'ana',month,rev:sheet.rev,decision:'validate',note:'Conferido.'},{...coord,login:'coord2'}),e=>e.status===403);
 sheet=(await direct({op:'frequency_review',teacherId:'ana',month,rev:sheet.rev,decision:'return',note:'Conferir o intervalo do almoço.'},coord)).sheet;assert.equal(sheet.status,'returned');
 sheet=(await direct({op:'frequency_submit',month,rev:sheet.rev,consent:true})).sheet;
 sheet=(await direct({op:'frequency_review',teacherId:'ana',month,rev:sheet.rev,decision:'validate',note:'Horários conferidos e validados.'},coord)).sheet;assert.equal(sheet.status,'validated');assert.equal(sheet.validation.by,'coord1');
 const file=frequencyXlsx(sheet),xml=strFromU8(unzipSync(file)['xl/worksheets/sheet1.xml']);assert.match(xml,/Ana/);assert.match(xml,/SUM\(L11:L41\)/);assert.ok(!xml.includes('GIZELLE KARINE SANTOS'));
 await assert.rejects(()=>direct({op:'frequency_day_edit',month,rev:sheet.rev,date:'2026-09-01',periods:[],note:'Ajuste posterior'}),e=>e.status===409);
 sheet=(await direct({op:'frequency_review',teacherId:'ana',month,rev:sheet.rev,decision:'reopen',note:'Reabrir para revisão solicitada.'},coord)).sheet;assert.equal(sheet.status,'returned');assert.equal(sheet.validation,null);
});
test('ajustes inválidos e envio prematuro não são aceitos',async()=>{
 let sheet=(await direct({op:'frequency_month',month:'2026-08'})).sheet;
 await assert.rejects(()=>direct({op:'frequency_day_edit',month:'2026-08',rev:sheet.rev,date:'2026-08-01',periods:[[480,700],[600,800]],note:'Sobreposição informada'}),/sobrepor/);
 await assert.rejects(()=>direct({op:'frequency_day_edit',month:'2026-08',rev:sheet.rev,date:'2026-08-32',periods:[],note:'Data inexistente'}),/dia válido/);
 await assert.rejects(()=>direct({op:'frequency_day_edit',month:'2026-08',rev:sheet.rev,date:'2026-08-01',periods:[],note:'abc'}),/justificativa/);
 sheet=(await direct({op:'frequency_month',month:'2026-10'})).sheet;await assert.rejects(()=>direct({op:'frequency_submit',month:'2026-10',rev:sheet.rev,consent:true}),/encerramento/);
});
test('backup mestre inclui frequência e backup de coordenação remove esse escopo',async()=>{
 const backup=await ok({op:'backup_now'},master),full=JSON.parse((await ok({op:'backup_download',id:backup.id},master)).data),reduced=JSON.parse((await ok({op:'backup_download',id:backup.id},coordCookie)).data);
 assert.ok(full.frequencySheets.length>=2);assert.equal(reduced.frequencySheets,undefined);
});
test('virada de dia e de mês divide horas sem perder o registro de origem',async()=>{
 const existing=JSON.parse((await q('SELECT data FROM key_control WHERE id=1')).rows[0].data);
 const movement={...item,id:'overnight',data:'2026-07-31'},pickup={id:'pickup-night',assignmentId:'overnight',docenteId:'ana',login:'profana',action:'retirada',at:'2026-07-31T23:00:00-03:00',hash:'pickup-hash'},returned={...pickup,id:'return-night',action:'devolucao',at:'2026-08-01T01:00:00-03:00',hash:'return-hash'};
 existing.events.push(pickup);await q('UPDATE key_control SET data=? WHERE id=1',[JSON.stringify(existing)]);await recordKeyFrequency(pickup,movement,{q,docs});
 existing.events.push(returned);await q('UPDATE key_control SET data=? WHERE id=1',[JSON.stringify(existing)]);await recordKeyFrequency(returned,movement,{q,docs});
 let july=(await direct({op:'frequency_month',month:'2026-07'})).sheet,aug=(await direct({op:'frequency_month',month:'2026-08'})).sheet;
 assert.equal(july.totalMinutes,60);assert.equal(aug.totalMinutes,60);assert.equal(july.pending,0);assert.equal(july.days[0].periods[0][1],1440);assert.equal(aug.days[0].periods[0][0],0);
 july=(await direct({op:'frequency_day_edit',month:'2026-07',rev:july.rev,date:'2026-07-31',periods:[[1380,1440]],note:'Conferência após expediente.'})).sheet;
 await recordKeyFrequency(returned,movement,{q,docs});july=(await direct({op:'frequency_month',month:'2026-07'})).sheet;assert.equal(july.pending,1);assert.equal(july.days[0].staleAdjustment,true);
 await assert.rejects(()=>direct({op:'frequency_submit',month:'2026-07',rev:july.rev,consent:true}),/ajustes desatualizados/);
});
test('frequência não é criada para mensalista e preserva ajustes contra novas fontes',async()=>{
 const existing=JSON.parse((await q('SELECT data FROM key_control WHERE id=1')).rows[0].data),event={id:'monthly-pickup',assignmentId:'monthly',docenteId:'bia',login:'profbia',action:'retirada',at:'2026-07-02T08:00:00-03:00',hash:'hash'};existing.events.push(event);await q('UPDATE key_control SET data=? WHERE id=1',[JSON.stringify(existing)]);
 await recordKeyFrequency(event,{...item,id:'monthly'},{q,docs});assert.equal((await q('SELECT id FROM frequency_sheets WHERE id=?',['bia/2026-07'])).rows.length,0);
});
test('mais de dois períodos exige conferência e os minutos não são truncados',()=>{
 const day=frequencyDays({sources:[{date:'2026-07-01',start:420,end:480},{date:'2026-07-01',start:540,end:600},{date:'2026-07-01',start:660,end:720}],adjustments:{}})[0];assert.equal(day.tooMany,true);assert.equal(day.minutes,180);
});
test('falha ao salvar frequência desfaz a movimentação da chave na mesma transação',async()=>{
 const lesson=(await ok({op:'managed_lessons'},master)).items[0],allocation=(await ok({op:'key_allocate',...lesson,keyId:key.id},master)).item;
 const row=(await q('SELECT data,rev FROM frequency_sheets WHERE id=?',['ana/'+today().slice(0,7)])).rows[0],saved=String(row.data),sheet=JSON.parse(saved);sheet.audit.push({detail:'x'.repeat(2_000_001)});await q('UPDATE frequency_sheets SET data=? WHERE id=?',[JSON.stringify(sheet),sheet.id]);
 const before=JSON.parse((await q('SELECT data FROM key_control WHERE id=1')).rows[0].data);
 const result=await call({op:'key_sign',id:allocation.id,token:key.token,action:'retirada',name:'Ana',consent:true,signature},teacherCookie);assert.equal(result.status,409);
 const after=JSON.parse((await q('SELECT data FROM key_control WHERE id=1')).rows[0].data);assert.equal(after.events.length,before.events.length);assert.equal(after.assignments.find(a=>a.id===allocation.id).status,'alocada');
 await q('UPDATE frequency_sheets SET data=? WHERE id=?',[saved,sheet.id]);
});
test('restauração mestre recupera frequências e avança revisão para evitar sobrescrita antiga',async()=>{
 const month='2026-08',before=(await direct({op:'frequency_month',month})).sheet,backup=await ok({op:'backup_now'},master);
 await direct({op:'frequency_day_edit',month,rev:before.rev,date:'2026-08-02',periods:[[480,600]],note:'Registro de teste posterior à cópia.'});
 const changed=(await direct({op:'frequency_month',month})).sheet;await ok({op:'backup_restore',id:backup.id},master);
 const restored=(await direct({op:'frequency_month',month})).sheet;assert.equal(restored.totalMinutes,before.totalMinutes);assert.ok(restored.rev>changed.rev);
});
