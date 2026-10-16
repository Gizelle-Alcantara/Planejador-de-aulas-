import test from 'node:test';import assert from 'node:assert/strict';
import {managementReport,managementCsv} from '../lib/management-report.js';
import {mkdtempSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
const fixture=()=>({geral:{docentes:[{nome:'Ana',email:'privado@example.test',observacoes:'Nota privada'}]},ambientes:{items:[{id:'lab1',nome:'Laboratório Á',ativo:true},{id:'lab2',nome:'Sala 2',ativo:true}]},'turma-a':{state:{cfg:{turma:'A',curso:'Curso A',turno:'Matutino',aulasDia:4,inicio:'2028-01-01',termino:'2028-01-31'},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',sala:' laboratorio a ',ch:20},{sigla:'SEM',nome:'Sem docente',docente:'',sala:'Laboratório Á',ch:2}],days:{'2028-01-03':{s:['LOG'],grade:['LOG','LOG','LOG','LOG']},'2028-01-04':{s:['LOG'],grade:['LOG','LOG','','']},'2028-01-05':{s:['LOG'],grade:['LOG','','','']},'2028-01-06':{s:['LOG'],grade:['LOG','LOG','LOG','']},'2028-01-07':{s:['SEM'],grade:['SEM','SEM','','']}},reg:{'2028-01-03':{dado:'sim',obs:'Nota privada'},'2028-01-04':{dado:'nao'},'2028-01-06':{dado:'sim'}},alunos:[{nome:'Aluno privado',cpf:'123'}]}}});
const filters={from:'2028-01-01',to:'2028-01-31'};
test('separa programadas, realizadas, canceladas e confirmações; mantém carga global explícita',()=>{
 const docs=fixture(),before=structuredClone(docs),r=managementReport(docs,filters,'2028-01-05');
 assert.equal(r.totals.scheduled,10);assert.equal(r.totals.completed,4);assert.equal(r.totals.cancelled,2);assert.equal(r.totals.unconfirmed,1);assert.equal(r.totals.future,5);
 assert.equal(r.totals.expected,22);assert.equal(r.totals.remaining,12);assert.equal(r.totals.missingTeachers,1);assert.equal(r.teachers.find(t=>t.nome==='Ana').plannedMinutes,480);assert.equal(r.teachers.find(t=>t.nome==='Ana').completedMinutes,240);
 const cut=managementReport(docs,{from:'2028-01-03',to:'2028-01-03'},'2028-01-05');assert.equal(cut.totals.scheduled,4);assert.equal(cut.totals.remaining,12);
 assert.deepEqual(docs,before);for(const secret of ['Aluno privado','123','Nota privada','privado@example.test'])assert.ok(!JSON.stringify(r).includes(secret));
});
test('NEM calcula minutos por aula sem incluir intervalo e não multiplica por aulas do dia',()=>{
 const docs=fixture(),st=docs['turma-a'].state;st.cfg.turno='Matutino NEM';st.cfg.aulasDia=6;st.ucs=[{...st.ucs[0],ch:5}];st.days={'2028-01-03':{s:['LOG']}};st.reg={'2028-01-03':{dado:'sim'}};
 const r=managementReport(docs,filters,'2028-01-05');assert.equal(r.totals.scheduled,6);assert.equal(r.totals.completedMinutes,300);assert.equal(r.totals.expected,6);assert.equal(r.totals.remaining,0);assert.equal(r.rooms.find(r=>r.id==='lab1').occupiedMinutes,300);
});
test('reserva define a sala efetiva e a ocupação une intervalos sem duplicidade',()=>{
 const docs=fixture();docs['turma-a'].state.days={'2028-01-03':{s:['LOG'],grade:['LOG','LOG','LOG','LOG']}};
 docs.reservas={items:[{status:'aprovada',turmaId:'turma-a',data:'2028-01-03',sigla:'LOG',bloco:'1-2-3-4',inicio:450,fim:690,ambienteId:'lab2',ambienteNome:'Sala 2'},
 {status:'aprovada',turmaId:'turma-a',data:'2028-01-03',sigla:'OUTRA',inicio:600,fim:720,ambienteId:'lab2',ambienteNome:'Sala 2'},
 {status:'pendente',turmaId:'turma-a',data:'2028-01-03',inicio:720,fim:780,ambienteId:'lab2',ambienteNome:'Sala 2'},
 {status:'revisao',turmaId:'turma-a',data:'2028-01-03',ambienteId:'lab2',ambienteNome:'Sala 2'}]};
 const r=managementReport(docs,filters,'2028-01-05'),room=r.rooms.find(r=>r.id==='lab2');
 assert.equal(r.rooms.find(r=>r.id==='lab1').occupiedMinutes,0);assert.equal(room.calendarMinutes,240);assert.equal(room.reservedMinutes,270);assert.equal(room.occupiedMinutes,270);assert.equal(r.totals.reservationsPending,1);assert.equal(r.totals.reservationsReview,1);
});
test('deduplica conflitos entre turmas e recorta aulas e reservas pelo período e turma',()=>{
 const docs=fixture();docs['turma-b']=structuredClone(docs['turma-a']);docs['turma-b'].state.cfg.turma='B';
 const r=managementReport(docs,{from:'2028-01-03',to:'2028-01-03'},'2028-01-05');assert.equal(r.totals.conflicts,2);assert.ok(r.classes.every(c=>c.conflicts===2));assert.equal(r.totals.occupiedMinutes,240);
 const single=managementReport(docs,{from:'2028-01-03',to:'2028-01-03',turma:'turma-a'},'2028-01-05');assert.equal(single.classes.length,1);assert.equal(single.totals.scheduled,4);assert.equal(single.totals.conflicts,2);
 const empty=managementReport(docs,{from:'2029-01-01',to:'2029-01-31'},'2029-01-31');assert.equal(empty.classes.length,0);assert.equal(empty.totals.scheduled,0);
});
test('valida datas e CSV mantém texto literal, acentos e período do relatório',()=>{
 for(const f of [{from:'2028-02-30',to:'2028-03-01'},{from:'2028-02-01',to:'2028-01-01'},{from:'2028-01-01',to:'2029-12-31'},{...filters,turma:'turma-ausente'}])assert.throws(()=>managementReport(fixture(),f));
 const docs=fixture();docs['turma-a'].state.cfg.turma='=HYPERLINK("teste")';docs['turma-a'].state.ucs[0].docente=' \t@SUM(1)';const csv=managementCsv(managementReport(docs,filters,'2028-01-05'));
 assert.ok(csv.startsWith('\ufeff'));assert.match(csv,/'=HYPERLINK/);assert.ok(csv.includes("' \t@SUM(1)"));assert.ok(csv.includes('Laboratório Á'));assert.ok(csv.includes('"2028-01-01";"2028-01-31"'));
});
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-management-')),'test.db');process.env.ADMIN_PASSWORD='senha-management-teste';process.env.SESSION_SECRET='segredo-management-teste';
const {handle}=await import('../lib/core.js');
const call=(body,cookie)=>handle(new Request('http://local/api',{method:'POST',headers:{'content-type':'application/json',...cookie?{cookie}:{}},body:JSON.stringify(body)}));
const api=async(body,cookie)=>{const r=await call(body,cookie);assert.equal(r.status,200,await r.clone().text());return r.json()};
const login=async body=>{const r=await call({op:'login',...body});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]};
test('API gerencial é restrita à coordenação e somente consulta os dados salvos',async()=>{
 const master=await login({password:process.env.ADMIN_PASSWORD}),docs=fixture();await api({op:'set',id:'geral',data:docs.geral,base:0},master);await api({op:'set',id:'turma-a',data:docs['turma-a'],base:0},master);
 const before=await api({op:'history'},master),result=await api({op:'management_report',filters},master);assert.ok(result.report);assert.ok(result.csv);assert.ok(result.generatedAt);assert.deepEqual(await api({op:'history'},master),before);
 assert.equal((await call({op:'management_report',filters})).status,401);
 for(const role of ['coord','docente','ambientes']){await api({op:'user_add',login:role,nome:role,password:'senha-relatorio-perfil',role},master);const cookie=await login({login:role,password:'senha-relatorio-perfil'});assert.equal((await call({op:'management_report',filters},cookie)).status,role==='coord'?200:403)}
 assert.equal((await call({op:'management_report',filters:{from:'2028-02-30',to:'2028-03-01'}},master)).status,400);
});
