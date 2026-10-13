window.SENAI_SCHEDULE=(()=>{// Regras comuns ao servidor e à interface. Uma posição da grade corresponde a uma aula.
function slotsOf(c={}){
 const size=c.turno==='Matutino NEM'?50:60,count=Number(c.aulasDia)||(c.turno==='Matutino NEM'||c.turno==='Diurno'?6:4);
 const start={'Matutino':'07:30','Matutino NEM':'07:00','Vespertino NEM':'13:20','Vespertino':'13:00','Diurno':'07:30','Noturno (Comunidade)':'18:00'}[c.turno]||'18:40';
 let minute=start.split(':').reduce((a,n,i)=>a+Number(n)*(i?1:60),0);const rows=[];
 for(let i=0;i<Math.min(12,Math.max(1,count));i++){if(c.turno==='Diurno'&&i===4)minute=780;if(c.turno==='Matutino NEM'&&i===3)minute+=20;rows.push({aula:i+1,i:minute,f:minute+size});minute+=size}return rows;
}
function blocksForDay(state,iso,includeCancelled=false){
 const day=state.days?.[iso];if(!day||['feriado','sem'].includes(day.t)||(!includeCancelled&&state.reg?.[iso]?.dado==='nao'))return [];
 const slots=slotsOf(state.cfg),explicit=Array.isArray(day.grade),blocks=[];
 if(!explicit){for(const sigla of day.s||[])blocks.push({sigla,bloco:'dia',aulas:slots.map(s=>s.aula),quantidade:Number(state.cfg.aulasDia)||slots.length,inicio:slots[0].i,fim:slots.at(-1).f,explicita:false});return blocks}
 for(let j=0;j<slots.length;j++){const sigla=day.grade[j];if(!sigla)continue;const previous=blocks.at(-1),slot=slots[j];if(previous?.sigla===sigla&&previous.fim===slot.i&&previous.aulas.at(-1)===j){previous.aulas.push(slot.aula);previous.fim=slot.f;previous.quantidade++;previous.bloco=previous.aulas.join('-')}else blocks.push({sigla,bloco:String(slot.aula),aulas:[slot.aula],quantidade:1,inicio:slot.i,fim:slot.f,explicita:true})}return blocks;
}
function validateSchedule(state){
 const slots=slotsOf(state.cfg),known=new Set((state.ucs||[]).map(u=>u.sigla));
 for(const [iso,day] of Object.entries(state.days||{})){if(!Object.hasOwn(day,'grade'))continue;if(!Number.isInteger(Number(state.cfg?.aulasDia))||Number(state.cfg.aulasDia)<1||Number(state.cfg.aulasDia)>12)return 'Informe de 1 a 12 aulas por dia na configuração da turma.';if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||isNaN(Date.parse(iso))||new Date(iso).toISOString().slice(0,10)!==iso)return 'Data inválida na grade.';if(slots.at(-1).f>1440)return 'A quantidade de aulas do turno ultrapassa a meia-noite. Ajuste a configuração da turma.';if(!Array.isArray(day.grade)||day.grade.length>slots.length||day.grade.some(s=>typeof s!=='string'||s&&!known.has(s)))return `Grade inválida em ${iso}. Use até ${slots.length} aulas e disciplinas cadastradas.`;
  const siglas=[...new Set(day.grade.filter(Boolean))];if(['feriado','sem'].includes(day.t)&&siglas.length)return `Não distribua aulas em um dia marcado como feriado ou sem aula (${iso}).`;
  if(!Array.isArray(day.s)||day.s.length!==new Set(day.s).size||siglas.length!==new Set(day.s).size||siglas.some(s=>!day.s.includes(s)))return `As disciplinas e a grade do dia ${iso} não correspondem.`;
 }return '';
}
function scheduleConflicts(docs,id,state,iso){
 const messages=new Set(),norm=s=>String(s||'').trim().toLowerCase(),own=blocksForDay(state,iso);
 for(const block of own){const uc=state.ucs?.find(u=>u.sigla===block.sigla);if(!uc)continue;const d=docs.geral?.docentes?.find(d=>d.nome===uc.docente),wd=new Date(iso+'T12:00:00Z').getUTCDay();if(d&&((d.semana||[]).includes(wd)||(d.bloqueios||[]).some(b=>b.de&&iso>=b.de&&iso<=(b.ate||b.de))))messages.add(`${uc.docente} está indisponível nesta data.`);
  for(const [otherId,doc] of Object.entries(docs)){if(otherId===id||!otherId.startsWith('turma-')||!doc.state)continue;for(const other of blocksForDay(doc.state,iso)){if(block.inicio>=other.fim||other.inicio>=block.fim)continue;const u=doc.state.ucs?.find(u=>u.sigla===other.sigla);if(!u)continue;if(uc.docente&&uc.docente===u.docente)messages.add(`${uc.docente} já leciona na turma ${doc.state.cfg.turma} neste horário.`);const room=uc.sala||state.cfg.local;if(room&&norm(room)===norm(u.sala||doc.state.cfg.local))messages.add(`O ambiente ${room} já está ocupado pela turma ${doc.state.cfg.turma} neste horário.`)}}
 }return [...messages];
}
;return {slotsOf,blocksForDay,validateSchedule,scheduleConflicts}})();