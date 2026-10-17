import test from 'node:test';
import assert from 'node:assert/strict';
import {blocksForDay,validateSchedule,scheduleConflicts,scheduleConflictDetails,outsidePeriod} from '../lib/schedule.js';
import {calendarData} from '../lib/calendar-export.js';
import {calendarEntries} from '../lib/reservations.js';
import {environmentRemovalError,teacherLessons} from '../lib/environments.js';
import {teacherCalendarXlsx} from '../lib/teacher-calendar-export.js';
import {unzipSync,strFromU8} from 'fflate';
import {suggestPlanning} from '../lib/planning.js';
const state=()=>({cfg:{turma:'EDU',curso:'Curso',turno:'Matutino',aulasDia:4,local:'Sala 1',inicio:'2099-03-10',termino:'2099-03-31'},ucs:[{sigla:'AMB',nome:'Ambientação',docente:'Ana',ch:4},{sigla:'P',nome:'Presencial',docente:'Ana',ch:4},{sigla:'E',nome:'Online',docente:'Docente EAD',ch:4}],days:{},reg:{}});
const docs=st=>({geral:{docentes:[{nome:'Ana'},{nome:'Docente EAD'}]},ambientes:{items:[{id:'sala',nome:'Sala 1',tipo:'sala',capacidade:20,ativo:true}]},'turma-edu':{state:st}});
test('Ambientação antes do início é válida e entra na exportação e no planejamento',()=>{
 const st=state();st.days['2099-03-05']={s:['AMB'],grade:['AMB','AMB','AMB','AMB']};
 assert.equal(outsidePeriod(st,'2099-03-05','AMB'),false);assert.equal(outsidePeriod(st,'2099-03-05','P'),true);assert.equal(outsidePeriod(st,'2099-04-01','AMB'),true);
 assert.equal(calendarData(st).records.length,1);assert.equal(calendarData(st).records[0].data,'2099-03-05');
 const clean=state(),options={sigla:'AMB',from:'2099-03-05',to:'2099-03-06',quantity:4,weekdays:[0,1,2,3,4,5,6]};assert.equal(suggestPlanning(docs(clean),'turma-edu',options).added,4);assert.throws(()=>suggestPlanning(docs(clean),'turma-edu',{...options,sigla:'P'}),/período/);
});
test('EAD em paralelo mantém oito aulas sem ocupar sala ou criar conflito',()=>{
 const st=state(),date='2099-03-12';st.days[date]={s:['P','E'],grade:['P','P','P','P'],ead:['E']};const all=docs(st);
 assert.equal(validateSchedule(st),'');assert.deepEqual(blocksForDay(st,date).map(b=>[b.sigla,b.quantidade,!!b.ead]),[['P',4,false],['E',4,true]]);assert.deepEqual(scheduleConflicts(all,'turma-edu',st,date),[]);assert.deepEqual(scheduleConflictDetails(all,'turma-edu',st,date),[]);
 assert.equal(calendarEntries(all,date).length,1);assert.equal(teacherLessons(all,'Docente EAD').length,0);assert.equal(calendarData(st).records.find(r=>r.sigla==='E').sala,'EAD');
 const other=state();other.days[date]={s:['E'],grade:['E','E','E','E']};all['turma-other']={state:other};assert.deepEqual(scheduleConflicts(all,'turma-edu',st,date),[]);
 other.days[date]={s:['P'],grade:['P','P','P','P']};assert.ok(scheduleConflicts(all,'turma-edu',st,date).length>0);
});
test('paralelo não aceita disciplinas presenciais nem duplicidade e respeita cancelamento',()=>{
 const st=state(),date='2099-03-12';st.days[date]={s:['P','E'],grade:['P','P','P','P'],ead:['P']};assert.match(validateSchedule(st),/EAD/);
 st.days[date].ead=['E','E'];assert.match(validateSchedule(st),/EAD/);st.days[date].ead=['E'];st.reg[date]={dado:'nao'};assert.deepEqual(blocksForDay(st,date),[]);assert.equal(blocksForDay(st,date,true).length,2);
});


test('Excel do docente EAD conserva atividades simultâneas sem rotulá-las como conflito',()=>{
 const st=state();st.days['2099-03-12']={s:['E'],grade:['E','E','E','E']};const all=docs(st),second=structuredClone(st);second.cfg.turma='EDU2';all['turma-other']={state:second};
 const zip=unzipSync(teacherCalendarXlsx(all,'Docente EAD',2099)),sheet=strFromU8(zip['xl/worksheets/sheet1.xml']);assert.ok(sheet.includes('E.1 + E.2'));assert.ok(!sheet.includes('CONFLITO:'));assert.ok(sheet.includes('COUNTIF'));
});

test('planejamento EAD dispensa ambiente e mantém a contagem exata de aulas',()=>{
 const st=state();st.cfg.local='';st.ucs[2].ch=6;const all=docs(st);all.ambientes.items=[];const options={sigla:'E',from:'2099-03-12',to:'2099-03-13',quantity:6,weekdays:[0,1,2,3,4,5,6]},plan=suggestPlanning(all,'turma-edu',options);assert.equal(plan.added,6);assert.equal(plan.ambiente,'EAD (sem ambiente físico)');assert.deepEqual(plan.changes.map(d=>d.quantity),[4,2]);assert.throws(()=>suggestPlanning(all,'turma-edu',{...options,sigla:'P'}),/sala ou laboratório/);
});
test('exclusão de ambiente protege usos atuais e futuros, preservando históricos e ignorando EAD',()=>{
 const st=state(),all=docs(st),date='2099-03-12';assert.equal(environmentRemovalError(all,[],'2099-03-01'),'');st.days[date]={s:['P'],grade:['P','P','P','P']};assert.match(environmentRemovalError(all,[],'2099-03-01'),/aulas presenciais/);st.days[date]={s:['E'],grade:['E','E','E','E']};assert.equal(environmentRemovalError(all,[],'2099-03-01'),'');
 all.reservas={items:[{ambienteId:'sala',data:date,status:'aprovada'}]};assert.match(environmentRemovalError(all,[],'2099-03-01'),/reservas/);assert.equal(environmentRemovalError(all,[],'2099-04-01'),'');all.reservas.items[0].status='cancelada';assert.equal(environmentRemovalError(all,[],'2099-03-01'),'');all.bloqueios={items:[{ambienteId:'sala',de:date,ate:date}]};assert.match(environmentRemovalError(all,[],'2099-03-01'),/bloqueios/);
});

test('EAD é planejado em dias cheios sem alterar a grade presencial ou exigir horários livres',()=>{
 const st=state();st.ucs[2].ch=6;for(const date of ['2099-03-12','2099-03-13'])st.days[date]={s:['P'],grade:['P','P','P','P'],h:'Nota preservada'};const all=docs(st);all.geral.docentes[1].semana=[0,1,2,3,4,5,6];all.bloqueios={items:[{ambienteId:'sala',de:'2099-03-01',ate:'2099-03-31',inicio:0,fim:1440}]};const before=structuredClone(st);const plan=suggestPlanning(all,'turma-edu',{sigla:'E',from:'2099-03-12',to:'2099-03-13',quantity:6,weekdays:[0,1,2,3,4,5,6]});assert.equal(plan.added,6);assert.equal(plan.ead,true);assert.deepEqual(st,before);
 for(const [i,change] of plan.changes.entries()){assert.deepEqual(change.day.grade,['P','P','P','P']);assert.deepEqual(change.day.s,['P','E']);assert.equal(change.day.h,'Nota preservada');assert.equal(change.day.eadHours.E,i?2:4);const candidate={...st,days:{...st.days,[change.date]:change.day}};assert.equal(validateSchedule(candidate),'');assert.deepEqual(blocksForDay(candidate,change.date).map(b=>b.quantidade),[4,i?2:4]);}
});
test('aulas presenciais podem ser sugeridas em dia que contém apenas uma citação EAD parcial',()=>{
 const st=state();st.days['2099-03-12']={s:['E'],ead:['E'],eadHours:{E:2}};const plan=suggestPlanning(docs(st),'turma-edu',{sigla:'P',from:'2099-03-12',to:'2099-03-12',quantity:4,weekdays:[0,1,2,3,4,5,6]});assert.equal(plan.added,4);assert.equal(plan.changes[0].day.eadHours.E,2);assert.deepEqual(plan.changes[0].day.s,['P','E']);
});
