const earlierEAD=(day,sigla,ead)=>ead&&(day.s||[]).includes(sigla);
import {blocksForDay,slotsOf,scheduleConflicts,validateSchedule,isAmbientacao,isEAD} from './schedule.js';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const next=d=>new Date(Date.parse(d+'T12:00:00Z')+86400000).toISOString().slice(0,10);
export function suggestPlanning(docs,id,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw Error('Informe as opções do planejamento.');
 const state=docs[id]?.state;if(!id?.startsWith('turma-')||!state)throw Error('Turma não encontrada.');
 const c=state.cfg||{},uc=(state.ucs||[]).find(u=>u.sigla===options.sigla);
 if(!uc)throw Error('Selecione uma disciplina cadastrada.');
 const teacherName=String(uc.docente||'').trim();
 if(teacherName&&!(docs.geral?.docentes||[]).some(d=>d.nome===uc.docente))throw Error('O docente informado não está cadastrado. Selecione um docente válido ou deixe para definir depois.');
 const ead=isEAD(uc),roomName=String(uc.sala||c.local||'').trim(),room=ead?{id:null,nome:'EAD (sem ambiente físico)',ativo:true}:roomName?(docs.ambientes?.items||[]).find(a=>norm(a.nome)===norm(roomName)):null;
 if(roomName&&!room?.ativo)throw Error('O ambiente informado deve estar cadastrado e ativo. Selecione outro ambiente ou deixe para definir depois.');
 const from=options.from,to=options.to||c.termino,quantity=Number(options.quantity),weekdays=options.weekdays;
 if(!valid(c.inicio)||!valid(c.termino)||!valid(from)||!valid(to)||from>to||(from<c.inicio&&!isAmbientacao(uc))||to>c.termino)throw Error('Escolha um intervalo válido dentro do período da turma.');
 if((Date.parse(to)-Date.parse(from))/86400000>365)throw Error('Gere sugestões para um intervalo de até 366 dias.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>1000)throw Error('Informe de 1 a 1000 aulas para sugerir.');
 if(!Array.isArray(weekdays)||!weekdays.length||weekdays.length>7||weekdays.some(w=>!Number.isInteger(w)||w<0||w>6))throw Error('Selecione os dias da semana.');
 const slots=slotsOf(c);if(!Number.isInteger(Number(c.aulasDia))||Number(c.aulasDia)<1||Number(c.aulasDia)>12||slots.at(-1).f>1440)throw Error('Revise o turno e a quantidade de aulas por dia da turma.');
 if(!Number.isFinite(Number(uc.ch))||Number(uc.ch)<0)throw Error('Revise a carga horária da disciplina.');
 const expected=Math.ceil(Number(uc.ch)*(c.turno==='Matutino NEM'?1.2:1));
 const allocated=Object.keys(state.days||{}).reduce((n,d)=>n+blocksForDay(state,d).filter(b=>b.sigla===uc.sigla).reduce((sum,b)=>sum+b.quantidade,0),0);
 const pending=Math.max(0,expected-allocated),target=Math.min(quantity,pending),changes=[],skipped=[];
 let added=0;
 for(let date=from;date<=to&&added<target;date=next(date)){
  if(!weekdays.includes(new Date(date+'T12:00:00Z').getUTCDay()))continue;
  const old=state.days?.[date]||{},reasons=new Set();
  if(['feriado','sem'].includes(old.t))reasons.add('Feriado ou dia sem aula.');
  if(!ead&&((old.s||[]).some(sg=>!isEAD(state.ucs.find(u=>u.sigla===sg)))||(old.grade||[]).some(sg=>sg&&!isEAD(state.ucs.find(u=>u.sigla===sg)))))reasons.add('Dia já possui aulas; os lançamentos existentes são preservados.');
  if(Object.keys(state.reg?.[date]||{}).length)reasons.add('Dia possui registro de aula; escolha outra data.');
  if(earlierEAD(old,uc.sigla,ead))reasons.add('Esta disciplina EAD já foi lançada neste dia.');
  if(reasons.size){skipped.push({date,reasons:[...reasons]});continue}
  if(ead){const quantity=Math.min(slots.length,target-added);changes.push({date,day:{...old,s:[...new Set([...(old.s||[]),uc.sigla])],ead:[...new Set([...(old.ead||[]),uc.sigla])],eadHours:{...old.eadHours,[uc.sigla]:quantity}},slots:[],quantity});added+=quantity;continue}
  const parallel=(old.s||[]).filter(sg=>isEAD(state.ucs.find(u=>u.sigla===sg)));
  const parallelHours=Object.fromEntries(parallel.map(sg=>[sg,blocksForDay(state,date).filter(b=>b.sigla===sg).reduce((n,b)=>n+b.quantidade,0)]));
  const grade=slots.map(()=>''),chosen=[];
  for(let i=0;i<slots.length&&added+chosen.length<target;i++){
   const slot=slots[i],single=slots.map((_,j)=>j===i?uc.sigla:'');
   const candidate={...state,days:{...state.days,[date]:{...old,t:'letivo',s:[uc.sigla,...parallel],...(parallel.length?{ead:parallel,eadHours:{...old.eadHours,...parallelHours}}:{}),grade:single}}};
   const conflicts=scheduleConflicts(docs,id,candidate,date);
   for(const [otherId,doc] of Object.entries(docs))if(otherId!==id&&otherId.startsWith('turma-')&&doc.state){
    for(const block of blocksForDay(doc.state,date))if(slot.i<block.fim&&block.inicio<slot.f){
     const other=doc.state.ucs?.find(u=>u.sigla===block.sigla);
     if(!ead&&room&&!block.ead&&other&&norm(other.sala||doc.state.cfg?.local)===norm(room.nome))conflicts.push(`Ambiente ocupado pela turma ${doc.state.cfg?.turma||otherId}.`);
    }
   }
   if(!ead&&room&&(docs.bloqueios?.items||[]).some(b=>b.ambienteId===room.id&&date>=b.de&&date<=b.ate&&slot.i<b.fim&&b.inicio<slot.f))conflicts.push('Ambiente bloqueado neste horário.');
   if(!ead&&(docs.reservas?.items||[]).some(r=>r.status==='aprovada'&&r.data===date&&(room&&r.ambienteId===room.id||teacherName&&r.docente===uc.docente)&&slot.i<r.fim&&r.inicio<slot.f))conflicts.push('Ambiente ou docente ocupado por reserva aprovada.');
   if(conflicts.length){conflicts.forEach(m=>reasons.add(m));continue}
   grade[i]=uc.sigla;chosen.push(slot);
  }
  if(chosen.length){changes.push({date,day:{...old,t:'letivo',s:[uc.sigla,...parallel],...(parallel.length?{ead:parallel}:{}),grade},slots:chosen,quantity:chosen.length});added+=chosen.length}
  if(reasons.size)skipped.push({date,reasons:[...reasons]});
 }
 const candidate={...state,days:{...state.days,...Object.fromEntries(changes.map(x=>[x.date,x.day]))}};
 const error=validateSchedule(candidate);if(error)throw Error(error);
 return {ead,sigla:uc.sigla,disciplina:uc.nome,docente:uc.docente||'',ambiente:room?.nome||'',pendingTeacher:!teacherName,pendingRoom:!ead&&!room,expected,allocated,pending,requested:quantity,target,added,unfilled:target-added,remaining:pending-added,changes,skipped};
}
