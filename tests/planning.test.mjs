import test from 'node:test';import assert from 'node:assert/strict';
import {suggestPlanning} from '../lib/planning.js';
import {mkdtempSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
const state={cfg:{turma:'PLAN',curso:'Curso',turno:'Matutino',aulasDia:4,inicio:'2028-01-01',termino:'2028-01-31'},ucs:[{sigla:'LOG',nome:'Lógica',docente:'Ana',sala:'Lab 1',ch:6}],days:{},reg:{}};
const fixture=()=>({geral:{docentes:[{nome:'Ana'}]},ambientes:{items:[{id:'lab',nome:'Lab 1',tipo:'laboratorio',capacidade:30,ativo:true}]},'turma-plan':{state:structuredClone(state)}});
const options={sigla:'LOG',from:'2028-01-03',to:'2028-01-10',quantity:6,weekdays:[0,1,2,3,4,5,6]};
test('sugestões limitam a carga pendente, preservam entradas e não alteram a origem',()=>{
 const docs=fixture();docs['turma-plan'].state.days['2028-01-01']={s:['LOG'],grade:['LOG','LOG','','']};
 docs['turma-plan'].state.days['2028-01-03']={h:'Anotação preservada'};const before=structuredClone(docs);
 const plan=suggestPlanning(docs,'turma-plan',{...options,quantity:20});
 assert.equal(plan.pending,4);assert.equal(plan.target,4);assert.equal(plan.added,4);assert.equal(plan.remaining,0);assert.equal(plan.changes[0].day.h,'Anotação preservada');assert.deepEqual(docs,before);
});
test('combina disponibilidade, feriados, registros, conflitos, bloqueios e reservas por horário',()=>{
 const docs=fixture(),st=docs['turma-plan'].state;
 docs.geral.docentes[0].bloqueios=[{de:'2028-01-03'}];st.days['2028-01-04']={t:'feriado',s:[]};st.days['2028-01-05']={s:['LOG'],grade:['LOG','','','']};st.reg['2028-01-06']={obs:'Registro que deve ser preservado'};
 docs['turma-outra']={state:{...structuredClone(state),cfg:{...state.cfg,turma:'OUTRA'},ucs:[{...state.ucs[0],sala:'Outro laboratório'}],days:{'2028-01-07':{s:['LOG'],grade:['LOG','LOG','','']}}}};
 docs.bloqueios={items:[{ambienteId:'lab',de:'2028-01-08',ate:'2028-01-08',inicio:450,fim:570}]};
 docs.reservas={items:[{status:'aprovada',data:'2028-01-09',ambienteId:'lab',inicio:570,fim:690,docente:'Bia'}]};
 const plan=suggestPlanning(docs,'turma-plan',options);
 assert.deepEqual(plan.changes.map(d=>[d.date,d.slots.map(s=>s.aula)]),[['2028-01-07',[3,4]],['2028-01-08',[3,4]],['2028-01-09',[1]]]);
 assert.equal(plan.added,5);assert.equal(plan.remaining,0);assert.ok(plan.skipped.some(d=>d.reasons.some(r=>r.includes('registro de aula'))));
});
test('explica falta de horários, respeita dias escolhidos e reconhece ambientes com acentos',()=>{
 const docs=fixture();docs.ambientes.items[0].nome='Laboratório';docs['turma-plan'].state.ucs[0].sala=' laboratorio ';
 docs['turma-outra']={state:{...structuredClone(state),ucs:[{...state.ucs[0],docente:'Bia',sala:'LABORATÓRIO'}],days:{'2028-01-03':{s:['LOG']}}}};
 const plan=suggestPlanning(docs,'turma-plan',{...options,to:'2028-01-03',weekdays:[1]});
 assert.equal(plan.added,0);assert.equal(plan.unfilled,6);assert.ok(plan.skipped[0].reasons.some(r=>r.includes('Ambiente ocupado')));
 const none=suggestPlanning(fixture(),'turma-plan',{...options,to:'2028-01-03',weekdays:[2]});assert.equal(none.added,0);
});
test('NEM converte carga para aulas e mantém o intervalo; cancelamentos não contam como alocação',()=>{
 const docs=fixture(),st=docs['turma-plan'].state;st.cfg.turno='Matutino NEM';st.cfg.aulasDia=6;st.ucs[0].ch=5;st.days['2028-01-01']={s:['LOG']};st.reg['2028-01-01']={dado:'nao'};
 const plan=suggestPlanning(docs,'turma-plan',options);assert.equal(plan.expected,6);assert.equal(plan.allocated,0);assert.equal(plan.added,6);assert.equal(plan.changes[0].slots[3].i-plan.changes[0].slots[2].f,20);
});
test('rejeita período, quantidade, docente, ambiente e configuração inválidos',()=>{
 for(const change of [{from:'2027-12-31'},{to:'2028-02-01'},{quantity:0},{quantity:1.5},{weekdays:[]},{from:'2028-02-30'}])assert.throws(()=>suggestPlanning(fixture(),'turma-plan',{...options,...change}));
 const docs=fixture();docs.ambientes.items[0].ativo=false;assert.throws(()=>suggestPlanning(docs,'turma-plan',options),/ativo/);
 docs.ambientes.items[0].ativo=true;docs['turma-plan'].state.ucs[0].docente='Não cadastrado';assert.throws(()=>suggestPlanning(docs,'turma-plan',options),/docente/);
});
test('permite planejar sem docente, sem sala ou sem ambos, sem inventar alocações',()=>{
 for(const [docente,sala] of [['','Lab 1'],['Ana',''],['','']]){
  const docs=fixture(),uc=docs['turma-plan'].state.ucs[0];Object.assign(uc,{docente,sala});
  if(!sala)delete docs.ambientes;if(!docente)delete docs.geral;
  docs.reservas={items:[{status:'aprovada',data:options.from,docente:'',ambienteId:null,inicio:0,fim:1440}]};
  const before=structuredClone(docs),plan=suggestPlanning(docs,'turma-plan',options);
  assert.equal(plan.added,6);assert.equal(plan.pendingTeacher,!docente);assert.equal(plan.pendingRoom,!sala);assert.equal(plan.docente,docente);assert.equal(plan.ambiente,sala);assert.deepEqual(docs,before);
 }
});
test('alocação parcial continua respeitando conflitos do recurso já informado',()=>{
 for(const resource of ['docente','sala']){
  const docs=fixture(),uc=docs['turma-plan'].state.ucs[0];uc[resource==='docente'?'sala':'docente']='';
  const other=structuredClone(docs['turma-plan']);other.state.days[options.from]={s:['LOG'],grade:['LOG','LOG','LOG','LOG']};docs['turma-other']=other;
  const plan=suggestPlanning(docs,'turma-plan',{...options,to:options.from});assert.equal(plan.added,0);assert.ok(plan.skipped.length);
 }
});
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-planning-')),'test.db');process.env.ADMIN_PASSWORD='senha-planning-teste';process.env.SESSION_SECRET='segredo-planning-teste';
const {handle}=await import('../lib/core.js');
const call=(body,cookie)=>handle(new Request('http://local/api',{method:'POST',headers:{'content-type':'application/json',...cookie?{cookie}:{}},body:JSON.stringify(body)}));
const api=async(body,cookie)=>{const r=await call(body,cookie);assert.equal(r.status,200,await r.clone().text());return r.json()};
const login=async body=>{const r=await call({op:'login',...body});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]};
let master,preview;
test('prévia usa dados salvos sem escrever; somente coordenação pode planejar',async()=>{
 master=await login({password:process.env.ADMIN_PASSWORD});
 await api({op:'set',id:'geral',data:{docentes:[{nome:'Ana'}]},base:0},master);
 await api({op:'environment_save',items:fixture().ambientes.items,base:0},master);
 await api({op:'set',id:'turma-plan',data:{state},base:0},master);
 const history=await api({op:'history'},master);
 preview=await api({op:'planning_preview',turmaId:'turma-plan',options},master);assert.equal(preview.plan.added,6);assert.ok(preview.token);assert.deepEqual(await api({op:'history'},master),history);
 assert.equal((await call({op:'planning_preview',turmaId:'turma-plan',options})).status,401);
 for(const role of ['docente','ambientes']){await api({op:'user_add',login:role,nome:role,password:'senha-planning-perfil',role},master);const cookie=await login({login:role,password:'senha-planning-perfil'});for(const op of ['planning_preview','planning_apply'])assert.equal((await call({op,turmaId:'turma-plan',options,token:preview.token},cookie)).status,403)}
});
test('aplicação concorrente é única, gera histórico e recusa reaplicação',async()=>{
 const results=await Promise.all([1,2].map(()=>call({op:'planning_apply',turmaId:'turma-plan',options,token:preview.token},master)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const history=await api({op:'history'},master);assert.ok(history.items.some(h=>h.doc==='turma-plan'&&h.note==='Planejamento assistido: 6 aulas'));
 const next=await api({op:'planning_preview',turmaId:'turma-plan',options},master);assert.equal(next.plan.pending,0);assert.equal(next.plan.added,0);
});
test('mudança de ambiente após prévia impede aplicação e não grava aulas',async()=>{
 await api({op:'set',id:'turma-stale',data:{state:{...structuredClone(state),cfg:{...state.cfg,turma:'STALE',turno:'Vespertino'}}},base:0},master);
 const request={turmaId:'turma-stale',options},p=await api({op:'planning_preview',...request},master);
 assert.equal(p.plan.added,6);
 await api({op:'environment_save',items:[{...fixture().ambientes.items[0],capacidade:31}],base:1},master);
 assert.equal((await call({op:'planning_apply',...request,token:p.token},master)).status,409);
 const after=await api({op:'planning_preview',...request},master);assert.equal(after.plan.pending,6);
});
test('calendário pode ser salvo sem alocação e preenchido depois com verificação de conflitos',async()=>{
 const records=(await(await handle(new Request('http://local/api',{headers:{cookie:master}}))).json()).docs;const g=records.find(d=>d.id==='geral'),a=records.find(d=>d.id==='ambientes');
 await api({op:'set',id:g.id,data:{...g.data,docentes:[...g.data.docentes,{nome:'Bia'}]},base:g.rev},master);await api({op:'environment_save',items:[...a.data.items,{id:'lab2',nome:'Lab 2',tipo:'laboratorio',capacidade:30,ativo:true}],base:a.rev},master);
 const draft=structuredClone(state);draft.cfg.turma='RASCUNHO';Object.assign(draft.ucs[0],{docente:'',sala:''});
 await api({op:'set',id:'turma-draft',data:{state:draft},base:0},master);
 const request={turmaId:'turma-draft',options},p=await api({op:'planning_preview',...request},master);assert.equal(p.plan.added,6);
 await api({op:'planning_apply',...request,token:p.token},master);
 const load=async()=>(await(await handle(new Request('http://local/api',{headers:{cookie:master}}))).json()).docs;
 const row=(await load()).find(d=>d.id==='turma-draft');assert.equal(row.data.state.ucs[0].docente,'');assert.equal(row.data.state.ucs[0].sala,'');
 for(const change of [{docente:'Ana'},{sala:'Lab 1'}]){const data=structuredClone(row.data);Object.assign(data.state.ucs[0],change);assert.equal((await call({op:'set',id:row.id,data,base:row.rev},master)).status,422)}
 const data=structuredClone(row.data);Object.assign(data.state.ucs[0],{docente:'Bia',sala:'Lab 2'});assert.equal((await call({op:'set',id:row.id,data,base:row.rev},master)).status,200);
 const updated=(await load()).find(d=>d.id===row.id);assert.deepEqual(updated.data.state.days,row.data.state.days);assert.equal(updated.data.state.ucs[0].docente,'Bia');assert.equal(updated.data.state.ucs[0].sala,'Lab 2');
});
