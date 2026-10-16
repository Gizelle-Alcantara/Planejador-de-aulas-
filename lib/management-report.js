import {blocksForDay,slotsOf,scheduleConflictDetails} from './schedule.js';
const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const metrics=()=>({scheduled:0,completed:0,cancelled:0,unconfirmed:0,future:0,plannedMinutes:0,completedMinutes:0,expected:0,remaining:0,missingTeachers:0});
function unionMinutes(intervals){
 let total=0,end=-1;
 for(const [a,b] of intervals.filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&a<b&&b<=1440).sort((a,b)=>a[0]-b[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b)}
 return total;
}
export function managementReport(docs,options={},asOf=new Date(Date.now()-3*3600e3).toISOString().slice(0,10)){
 const {from,to,turma=''}=options||{};
 if(!valid(from)||!valid(to)||from>to||(Date.parse(to)-Date.parse(from))/86400000>365)throw Error('Escolha um período válido de até 366 dias.');
 if(turma&&(!String(turma).startsWith('turma-')||!docs[turma]?.state))throw Error('Turma não encontrada.');
 const inPeriod=d=>valid(d)&&d>=from&&d<=to;
 const requests=(docs.reservas?.items||[]).filter(r=>inPeriod(r.data)&&(!turma||r.turmaId===turma));
 const classes=Object.entries(docs).filter(([id,d])=>id.startsWith('turma-')&&d?.state?.cfg&&(!turma||id===turma)&&
  (d.state.cfg.inicio<=to&&d.state.cfg.termino>=from||Object.keys(d.state.days||{}).some(inPeriod)||requests.some(r=>r.turmaId===id)));
 const rows=[],teachers=new Map(),rooms=new Map(),totals={...metrics(),conflicts:0,reservationsPending:0,reservationsReview:0,occupiedMinutes:0};
 function roomOf(id,name){
  const registered=(docs.ambientes?.items||[]).find(a=>a.id===id||norm(a.nome)===norm(name));
  const key=registered?.id||id||'nome:'+norm(name||'Sem ambiente');
  if(!rooms.has(key))rooms.set(key,{id:key,nome:registered?.nome||name||'Sem ambiente',registered:!!registered,calendarMinutes:0,reservedMinutes:0,occupiedMinutes:0,pending:0,review:0,dates:new Map()});
  return rooms.get(key);
 }
 for(const room of docs.ambientes?.items||[])roomOf(room.id,room.nome);
 function addInterval(room,date,kind,pair){if(!room.dates.has(date))room.dates.set(date,{calendar:[],reserved:[]});room.dates.get(date)[kind].push(pair)}
 for(const [id,{state:st}] of classes){
  const row={id,turma:st.cfg.turma||id,curso:st.cfg.curso||'',turno:st.cfg.turno||'',...metrics(),conflicts:0,reservationsPending:0,reservationsReview:0};
  const allocated={};for(const date of Object.keys(st.days||{}))for(const b of blocksForDay(st,date))allocated[b.sigla]=(allocated[b.sigla]||0)+b.quantidade;
  const teacherOf=uc=>{const key=uc?.docente||'';if(!teachers.has(key))teachers.set(key,{nome:key||'Sem docente',turmas:new Set(),...metrics()});const t=teachers.get(key);t.turmas.add(row.turma);return t};
  for(const uc of st.ucs||[]){
   const ch=Number(uc.ch),expected=Number.isFinite(ch)&&ch>0?Math.ceil(ch*(st.cfg.turno==='Matutino NEM'?1.2:1)):0,remaining=Math.max(0,expected-(allocated[uc.sigla]||0)),t=teacherOf(uc);
   for(const target of [row,t]){target.expected+=expected;target.remaining+=remaining;if(!uc.docente)target.missingTeachers++}
  }
  const slots=slotsOf(st.cfg);
  for(const date of Object.keys(st.days||{}).filter(inPeriod))for(const b of blocksForDay(st,date,true)){
   const uc=(st.ucs||[]).find(u=>u.sigla===b.sigla);if(!uc)continue;
   const t=teacherOf(uc),cancelled=st.reg?.[date]?.dado==='nao',completed=!cancelled&&date<=asOf&&st.reg?.[date]?.dado==='sim';
   const intervals=b.aulas.map(n=>slots[n-1]).filter(Boolean).map(s=>[s.i,s.f]),minutes=intervals.reduce((n,[a,z])=>n+z-a,0);
   for(const target of [row,t]){
    if(cancelled){target.cancelled+=b.quantidade;continue}
    target.scheduled+=b.quantidade;target.plannedMinutes+=minutes;
    if(completed){target.completed+=b.quantidade;target.completedMinutes+=minutes}
    else if(date>asOf)target.future+=b.quantidade;
    else target.unconfirmed+=b.quantidade;
   }
   if(!cancelled){
    const reserved=requests.find(r=>r.status==='aprovada'&&r.turmaId===id&&r.data===date&&r.sigla===b.sigla&&((r.bloco||'dia')===b.bloco||r.inicio===b.inicio&&r.fim===b.fim));
    const room=roomOf(reserved?.ambienteId,reserved?.ambienteNome||uc.sala||st.cfg.local);for(const interval of intervals)addInterval(room,date,'calendar',interval);
   }
  }
  rows.push(row);for(const key of Object.keys(metrics()))totals[key]+=row[key];
 }
 const rowMap=new Map(rows.map(r=>[r.id,r])),seen=new Set();
 for(const [id,{state:st}] of classes)for(const date of Object.keys(st.days||{}).filter(inPeriod))for(const c of scheduleConflictDetails(docs,id,st,date)){
  const key=JSON.stringify([c.tipo,norm(c.recurso),c.lessons.map(l=>[l.turmaId,l.data,l.sigla,l.bloco]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
  if(seen.has(key))continue;seen.add(key);totals.conflicts++;
  for(const classId of new Set(c.lessons.map(l=>l.turmaId)))if(rowMap.has(classId))rowMap.get(classId).conflicts++;
 }
 for(const r of requests){
  const room=roomOf(r.ambienteId,r.ambienteNome),row=rowMap.get(r.turmaId);
  if(r.status==='pendente'){room.pending++;totals.reservationsPending++;if(row)row.reservationsPending++}
  if(r.status==='revisao'){room.review++;totals.reservationsReview++;if(row)row.reservationsReview++}
  if(r.status==='aprovada')addInterval(room,r.data,'reserved',[Number(r.inicio),Number(r.fim)]);
 }
 for(const room of rooms.values()){
  for(const d of room.dates.values()){room.calendarMinutes+=unionMinutes(d.calendar);room.reservedMinutes+=unionMinutes(d.reserved);room.occupiedMinutes+=unionMinutes([...d.calendar,...d.reserved])}
  delete room.dates;totals.occupiedMinutes+=room.occupiedMinutes;
 }
 const sort=(a,b)=>String(a).localeCompare(String(b),'pt-BR',{numeric:true});
 rows.sort((a,b)=>sort(a.turma,b.turma));
 return {from,to,turma,asOf,classes:rows,teachers:[...teachers.values()].map(t=>({...t,turmas:[...t.turmas].sort(sort)})).sort((a,b)=>sort(a.nome,b.nome)),rooms:[...rooms.values()].sort((a,b)=>sort(a.nome,b.nome)),totals};
}
export function managementCsv(report){
 const headers=['De','Até','Grupo','Identificação','Curso / turmas','Aulas programadas','Aulas realizadas','Aulas canceladas','Sem confirmação','Horas programadas','Horas realizadas','Aulas a planejar (turma inteira)','Disciplinas sem docente (turma inteira)','Horas ocupadas do ambiente','Reservas pendentes','Reservas em revisão','Conflitos no período'];
 const hours=n=>(n/60).toFixed(2).replace('.',',');
 const line=(group,name,context,r)=>[report.from,report.to,group,name,context,r.scheduled??'',r.completed??'',r.cancelled??'',r.unconfirmed??'',r.plannedMinutes===undefined?'':hours(r.plannedMinutes),r.completedMinutes===undefined?'':hours(r.completedMinutes),r.remaining??'',r.missingTeachers??'',r.occupiedMinutes===undefined?'':hours(r.occupiedMinutes),r.reservationsPending??r.pending??'',r.reservationsReview??r.review??'',r.conflicts??''];
 const rows=[headers,line('Resumo','Total','',report.totals),...report.classes.map(r=>line('Turma',r.turma,r.curso,r)),...report.teachers.map(r=>line('Docente',r.nome,r.turmas.join(', '),r)),...report.rooms.map(r=>line('Ambiente',r.nome,'',r))];
 const cell=v=>{let s=String(v??'');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 return '\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
