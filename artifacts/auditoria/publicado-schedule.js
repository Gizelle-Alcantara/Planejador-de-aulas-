window.SENAI_SCHEDULE=(()=>{const normalName=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const isEAD=uc=>/\bead\b/.test(normalName(uc?.docente));
const isAmbientacao=uc=>/^ambientacao(?:$|\s|[-:])/.test(normalName(uc?.nome));
const outsidePeriod=(state,iso,sigla)=>iso>state.cfg.termino||(iso<state.cfg.inicio&&!isAmbientacao(state.ucs?.find(u=>u.sigla===sigla)));
// Regras comuns ao servidor e à interface. Uma posição da grade corresponde a uma aula.
function slotsOf(c={}){
 const size=c.turno==='Matutino NEM'?50:60,count=Number(c.aulasDia)||(c.turno==='Matutino NEM'||c.turno==='Diurno'?6:4);
 const start={'Matutino':'07:30','Matutino NEM':'07:00','Vespertino NEM':'13:20','Vespertino':'13:00','Diurno':'07:30','Noturno (Comunidade)':'18:00'}[c.turno]||'18:40';
 let minute=start.split(':').reduce((a,n,i)=>a+Number(n)*(i?1:60),0);const rows=[];
 for(let i=0;i<Math.min(12,Math.max(1,count));i++){if(c.turno==='Diurno'&&i===4)minute=780;if(c.turno==='Matutino NEM'&&i===3)minute+=20;rows.push({aula:i+1,i:minute,f:minute+size});minute+=size}return rows;
}
function blocksForDay(state,iso,includeCancelled=false){
 const day=state.days?.[iso];if(!day||['feriado','sem'].includes(day.t)||(!includeCancelled&&state.reg?.[iso]?.dado==='nao'))return [];
 const slots=slotsOf(state.cfg),explicit=Array.isArray(day.grade),blocks=[];const finish=()=>{if(explicit)for(const sigla of day.ead||[])if(!blocks.some(b=>b.sigla===sigla)&&isEAD(state.ucs?.find(u=>u.sigla===sigla)))blocks.push({sigla,bloco:'ead',aulas:slots.map(s=>s.aula),quantidade:slots.length,inicio:slots[0].i,fim:slots.at(-1).f,explicita:true});for(const b of blocks)if(isEAD(state.ucs?.find(u=>u.sigla===b.sigla))){b.ead=true;const quantity=day.eadHours?.[b.sigla];if(Number.isInteger(quantity)&&quantity>0&&quantity<=slots.length){b.quantidade=quantity;b.aulas=slots.slice(0,quantity).map(s=>s.aula);b.fim=slots[quantity-1].f}}return blocks};
 if(!explicit){for(const sigla of day.s||[])blocks.push({sigla,bloco:'dia',aulas:slots.map(s=>s.aula),quantidade:Number(state.cfg.aulasDia)||slots.length,inicio:slots[0].i,fim:slots.at(-1).f,explicita:false});return finish()}
 for(let j=0;j<slots.length;j++){const sigla=day.grade[j];if(!sigla)continue;const previous=blocks.at(-1),slot=slots[j];if(previous?.sigla===sigla&&previous.fim===slot.i&&previous.aulas.at(-1)===j){previous.aulas.push(slot.aula);previous.fim=slot.f;previous.quantidade++;previous.bloco=previous.aulas.join('-')}else blocks.push({sigla,bloco:String(slot.aula),aulas:[slot.aula],quantidade:1,inicio:slot.i,fim:slot.f,explicita:true})}return finish();
}
function validateSchedule(state){
 const slots=slotsOf(state.cfg),known=new Set((state.ucs||[]).map(u=>u.sigla));
 for(const [iso,day] of Object.entries(state.days||{})){if(day.eadHours!==undefined&&(typeof day.eadHours!=='object'||!day.eadHours||Array.isArray(day.eadHours)||Object.entries(day.eadHours).some(([sg,n])=>!isEAD(state.ucs.find(u=>u.sigla===sg))||!day.s?.includes(sg)||!Number.isInteger(n)||n<1||n>slots.length)))return `Quantidade inválida nas atividades EAD (${iso}).`;if(!Object.hasOwn(day,'grade'))continue;if(!Number.isInteger(Number(state.cfg?.aulasDia))||Number(state.cfg.aulasDia)<1||Number(state.cfg.aulasDia)>12)return 'Informe de 1 a 12 aulas por dia na configuração da turma.';if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||isNaN(Date.parse(iso))||new Date(iso).toISOString().slice(0,10)!==iso)return 'Data inválida na grade.';if(slots.at(-1).f>1440)return 'A quantidade de aulas do turno ultrapassa a meia-noite. Ajuste a configuração da turma.';if(!Array.isArray(day.grade)||day.grade.length>slots.length||day.grade.some(s=>typeof s!=='string'||s&&!known.has(s)))return `Grade inválida em ${iso}. Use até ${slots.length} aulas e disciplinas cadastradas.`;
  const parallel=day.ead||[];if(!Array.isArray(parallel)||parallel.length!==new Set(parallel).size||parallel.some(s=>!known.has(s)||!isEAD(state.ucs.find(u=>u.sigla===s))||day.grade.includes(s)))return `Selecione somente disciplinas com docente EAD para as atividades paralelas (${iso}).`;
  const siglas=[...new Set([...day.grade.filter(Boolean),...parallel])];if(['feriado','sem'].includes(day.t)&&siglas.length)return `Não distribua aulas em um dia marcado como feriado ou sem aula (${iso}).`;
  if(!Array.isArray(day.s)||day.s.length!==new Set(day.s).size||siglas.length!==new Set(day.s).size||siglas.some(s=>!day.s.includes(s)))return `As disciplinas e a grade do dia ${iso} não correspondem.`;
 }return '';
}
function scheduleConflicts(docs,id,state,iso){
 const messages=new Set(),norm=s=>String(s||'').trim().toLowerCase(),own=blocksForDay(state,iso);
 for(const block of own){const uc=state.ucs?.find(u=>u.sigla===block.sigla);if(!uc||isEAD(uc))continue;const d=docs.geral?.docentes?.find(d=>d.nome===uc.docente),wd=new Date(iso+'T12:00:00Z').getUTCDay();if(d&&((d.semana||[]).includes(wd)||(d.bloqueios||[]).some(b=>b.de&&iso>=b.de&&iso<=(b.ate||b.de))))messages.add(`${uc.docente} está indisponível nesta data.`);
  for(const [otherId,doc] of Object.entries(docs)){if(otherId===id||!otherId.startsWith('turma-')||!doc.state)continue;for(const other of blocksForDay(doc.state,iso)){if(block.inicio>=other.fim||other.inicio>=block.fim)continue;const u=doc.state.ucs?.find(u=>u.sigla===other.sigla);if(!u||isEAD(u))continue;if(uc.docente&&uc.docente===u.docente)messages.add(`${uc.docente} já leciona na turma ${doc.state.cfg.turma} neste horário.`);const room=uc.sala||state.cfg.local;if(room&&norm(room)===norm(u.sala||doc.state.cfg.local))messages.add(`O ambiente ${room} já está ocupado pela turma ${doc.state.cfg.turma} neste horário.`)}}
 }return [...messages];
}

// Ocorrências estruturadas para revisão, sem alterar os dados ou as regras de gravação.
function scheduleConflictDetails(docs,id,state,date){
 const result=[],seen=new Set(),norm=s=>String(s||'').trim().toLowerCase();
 const lesson=(key,st,iso,block)=>{const uc=st.ucs?.find(u=>u.sigla===block.sigla)||{};return {turmaId:key,turma:st.cfg?.turma||key,curso:st.cfg?.curso||'',data:iso,sigla:block.sigla,disciplina:uc.nome||block.sigla,docente:uc.docente||'',sala:uc.sala||st.cfg?.local||'',inicio:block.inicio,fim:block.fim,bloco:block.bloco}};
 const add=(tipo,recurso,message,lessons)=>{const key=JSON.stringify([tipo,norm(recurso),lessons.map(l=>[l.turmaId,l.data,l.sigla,l.bloco].join('/')).sort()]);if(seen.has(key))return;seen.add(key);result.push({tipo,recurso,message,data:lessons[0].data,inicio:Math.max(...lessons.map(l=>l.inicio)),fim:Math.min(...lessons.map(l=>l.fim)),lessons})};
 for(const iso of (date?[date]:Object.keys(state.days||{}).sort())){
  const own=blocksForDay(state,iso).filter(b=>!b.ead).map(b=>lesson(id,state,iso,b));
  const others=Object.entries(docs).filter(([key,doc])=>key!==id&&key.startsWith('turma-')&&doc.state).flatMap(([key,doc])=>blocksForDay(doc.state,iso).filter(b=>!b.ead).map(b=>lesson(key,doc.state,iso,b)));
  for(let i=0;i<own.length;i++){
   const a=own[i],teacher=docs.geral?.docentes?.find(d=>d.nome===a.docente),wd=new Date(iso+'T12:00:00Z').getUTCDay();
   if(teacher&&((teacher.semana||[]).includes(wd)||(teacher.bloqueios||[]).some(b=>b.de&&iso>=b.de&&iso<=(b.ate||b.de))))add('indisponibilidade',a.docente,`${a.docente} está indisponível nesta data.`,[a]);
   for(const b of own.slice(i+1))if(a.inicio<b.fim&&b.inicio<a.fim)add('grade','Grade de aulas','Mais de uma disciplina ocupa os mesmos horários nesta turma. Distribua as disciplinas por aula.',[a,b]);
   for(const b of others){if(a.inicio>=b.fim||b.inicio>=a.fim)continue;
    if(a.docente&&a.docente===b.docente)add('docente',a.docente,`${a.docente} está em duas turmas no mesmo horário.`,[a,b]);
    if(norm(a.sala)&&norm(a.sala)===norm(b.sala))add('ambiente',a.sala,`O ambiente ${a.sala} está em duas turmas no mesmo horário.`,[a,b]);
   }
  }
 }
 return result.sort((a,b)=>a.data.localeCompare(b.data)||a.inicio-b.inicio||a.tipo.localeCompare(b.tipo));
}

function coordinationOverview(docs){
 const classes=Object.entries(docs).filter(([id,doc])=>id.startsWith('turma-')&&doc.state),conflicts=[],seen=new Set();
 for(const [id,doc] of classes)for(const conflict of scheduleConflictDetails(docs,id,doc.state)){
  const key=JSON.stringify([conflict.tipo,String(conflict.recurso||'').trim().toLowerCase(),conflict.lessons.map(l=>[l.turmaId,l.data,l.sigla,l.bloco]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
  if(!seen.has(key)){seen.add(key);conflicts.push(conflict)}
 }
 conflicts.sort((a,b)=>a.data.localeCompare(b.data)||a.inicio-b.inicio||a.tipo.localeCompare(b.tipo));
 const requests=(docs.reservas?.items||[]).filter(r=>['pendente','revisao'].includes(r.status));
 const rows=classes.map(([id,{state:st}])=>{
  const allocated={};for(const iso of Object.keys(st.days||{}))for(const b of blocksForDay(st,iso))allocated[b.sigla]=(allocated[b.sigla]||0)+b.quantidade;
  let pendentes=0,excedentes=0,previstas=0,lancadas=0;for(const uc of st.ucs||[]){const expected=Math.ceil((Number(uc.ch)||0)*(st.cfg?.turno==='Matutino NEM'?1.2:1)),actual=allocated[uc.sigla]||0;previstas+=expected;lancadas+=actual;pendentes+=Math.max(0,expected-actual);excedentes+=Math.max(0,actual-expected)}
  const semDocente=(st.ucs||[]).filter(u=>!u.docente).length,ocorrencias=conflicts.filter(c=>c.lessons.some(l=>l.turmaId===id)).length,reservas=requests.filter(r=>r.turmaId===id).length;
  return {id,turma:st.cfg?.turma||id,curso:st.cfg?.curso||'',turno:st.cfg?.turno||'',pendentes,excedentes,previstas,lancadas,semDocente,conflitos:ocorrencias,reservas,atencao:!!(pendentes||excedentes||semDocente||ocorrencias||reservas)};
 });
 rows.sort((a,b)=>Number(b.atencao)-Number(a.atencao)||String(a.turma).localeCompare(String(b.turma),'pt-BR',{numeric:true}));
 return {rows,conflicts,totals:{turmas:rows.length,atencao:rows.filter(r=>r.atencao).length,pendentes:rows.reduce((n,r)=>n+r.pendentes,0),excedentes:rows.reduce((n,r)=>n+r.excedentes,0),semDocente:rows.reduce((n,r)=>n+r.semDocente,0),conflitos:conflicts.length,reservas:requests.length}};
}
;return {slotsOf,blocksForDay,validateSchedule,scheduleConflicts,scheduleConflictDetails,coordinationOverview}})();