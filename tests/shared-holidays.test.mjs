import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createClient} from '@libsql/client';
import {sharedHolidayPlan} from '../lib/shared-holidays.js';
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'shared-holidays-')),'test.db');process.env.ADMIN_PASSWORD='master-holiday-test';process.env.SESSION_SECRET='holiday-session-secret';
const {handle}=await import('../lib/core.js'),db=createClient({url:process.env.TURSO_DATABASE_URL});
const call=(data,cookie='')=>handle(new Request('https://agenda.test/api',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(data)}));
const api=async(data,cookie,status=200)=>{const r=await call(data,cookie),j=await r.json();assert.equal(r.status,status,JSON.stringify(j));return j};
const login=async data=>(await call({op:'login',...data})).headers.get('set-cookie').split(';')[0];
const date='2099-01-05',name='Feriado institucional',state=(turma,curso)=>({cfg:{turma,curso,turno:'Matutino',aulasDia:4,inicio:'2099-01-01',termino:'2099-12-31'},ucs:[{sigla:'LOG',nome:'Lógica',docente:'',sala:'',ch:40}],days:{[date]:{s:['LOG'],grade:['LOG','LOG','','']},'2099-01-06':{s:[],h:'Nota preservada'}},reg:{},alunos:[{nome:'Cadastro preservado'}]});
let master,preview;
const snapshot=async()=>JSON.stringify((await db.execute("SELECT id,data,rev FROM docs ORDER BY id")).rows);
test('valida a data e o nome do feriado',()=>{
 for(const d of ['2099-02-30','ontem','2099-13-01','2099-01-00'])assert.throws(()=>sharedHolidayPlan([],d,name));
 for(const n of ['',null,'x'.repeat(161)])assert.throws(()=>sharedHolidayPlan([],date,n));
});
test('prévia exige master, cruza cursos e preserva o banco',async()=>{
 master=await login({password:process.env.ADMIN_PASSWORD});
 for(const [id,data] of [['a',state('A','Curso A')],['b',state('B','Curso B')],['completed',{...state('CONF','Curso C'),reg:{[date]:{dado:'sim',obs:'Aula realizada'}}}],['outside',{...state('FORA','Curso D'),cfg:{...state('FORA','Curso D').cfg,inicio:'2098-01-01',termino:'2098-12-31'}}]])await api({op:'set',id:'turma-'+id,data:{state:data},base:0},master);
 for(const role of ['coord','docente','ambientes']){await api({op:'user_add',login:'holiday-'+role,password:'senha-holiday-test',role},master);const cookie=await login({login:'holiday-'+role,password:'senha-holiday-test'});for(const op of ['holiday_preview','holiday_apply'])await api({op,date,name},cookie,403)}
 await api({op:'holiday_preview',date,name},'',401);
 await api({op:'course_enable'},master);
 const coord=await login({login:'holiday-coord',password:'senha-holiday-test'});await api({op:'holiday_apply',date,name},coord,403);
 const before=await snapshot();preview=await api({op:'holiday_preview',date,name},master);assert.deepEqual(preview.items.map(x=>x.turma),['A','B']);assert.ok(preview.items.every(x=>x.hasLessons));assert.equal(preview.skipped.completed,1);assert.equal(preview.skipped.outsidePeriod,1);assert.equal(await snapshot(),before);
});
test('prévia alterada e falha no segundo calendário não deixam alterações parciais',async()=>{
 const before=await snapshot();await api({op:'holiday_apply',date,name,token:'invalido'},master,409);assert.equal(await snapshot(),before);
 const current=JSON.parse(String((await db.execute("SELECT data FROM docs WHERE id='turma-b'")).rows[0].data));current.state.cfg.coord='Novo coordenador';await api({op:'set',id:'turma-b',data:current,base:1},master);
 const changed=await snapshot();await api({op:'holiday_apply',date,name,token:preview.token},master,409);assert.equal(await snapshot(),changed);
 preview=await api({op:'holiday_preview',date,name},master);
 await db.execute("CREATE TRIGGER holiday_fail BEFORE UPDATE ON docs WHEN NEW.id='turma-b' BEGIN SELECT RAISE(ABORT,'test rollback'); END");
 const beforeHistory=await api({op:'history'},master);await api({op:'holiday_apply',date,name,token:preview.token},master,500);assert.equal(await snapshot(),changed);assert.deepEqual(await api({op:'history'},master),beforeHistory);await db.execute('DROP TRIGGER holiday_fail');
});
test('aplica em todas as turmas elegíveis com histórico, sem apagar registros, e não duplica',async()=>{
 const before=(await db.execute('SELECT id,data FROM docs')).rows;const result=await api({op:'holiday_apply',date,name,token:preview.token},master);assert.equal(result.updated,2);
 for(const id of ['turma-a','turma-b']){const actual=JSON.parse(String((await db.execute({sql:'SELECT data FROM docs WHERE id=?',args:[id]})).rows[0].data));const original=JSON.parse(String(before.find(r=>r.id===id).data));assert.deepEqual(actual.state.days[date],{s:[],t:'feriado',h:name});delete actual.state.days[date];delete original.state.days[date];assert.deepEqual(actual,original)}
 for(const id of ['turma-completed','turma-outside'])assert.equal(String((await db.execute({sql:'SELECT data FROM docs WHERE id=?',args:[id]})).rows[0].data),String(before.find(r=>r.id===id).data));
 const history=(await api({op:'history'},master)).items;assert.equal(history.filter(h=>h.note?.startsWith('Feriado geral:')).length,2);
 await api({op:'holiday_apply',date,name,token:preview.token},master,409);
 const next=await api({op:'holiday_preview',date,name},master);assert.equal(next.items.length,0);assert.equal(next.skipped.unchanged,2);assert.equal((await api({op:'holiday_apply',date,name,token:next.token},master)).updated,0);
});
test('feriado geral coloca em revisão a reserva da aula retirada',async()=>{
 await api({op:'set',id:'geral',data:{docentes:[{nome:'Ana'}]},base:0},master);
 await api({op:'environment_save',items:[{id:'sala-r',nome:'Sala R',tipo:'sala',capacidade:30,ativo:true}],base:0},master);
 const st=state('RES','Curso R');st.ucs[0].docente='Ana';st.ucs[0].sala='Sala R';await api({op:'set',id:'turma-reserva',data:{state:st},base:0},master);
 const booking=await api({op:'reservation_book',docente:'Ana',turmaId:'turma-reserva',data:date,sigla:'LOG',ambienteId:'sala-r',finalidade:'Aula prática'},master);assert.equal(booking.item.status,'aprovada');
 const p=await api({op:'holiday_preview',date,name:'Feriado de reservas'},master);await api({op:'holiday_apply',date,name:p.name,token:p.token},master);
 const updated=(await api({op:'reservation_list'},master)).items.find(r=>r.id===booking.item.id);assert.equal(updated.status,'revisao');assert.match(updated.motivo,/removida|cancelada/);assert.equal(updated.historico.at(-1).status,'revisao');
});
