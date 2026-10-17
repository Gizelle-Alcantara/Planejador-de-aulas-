// Intervalos sem sobreposição: atividades que atravessam turnos aparecem em ambos.
export const BOARD_SHIFTS=[
 {nome:'Matutino',inicio:0,fim:720},
 {nome:'Vespertino',inicio:720,fim:1080},
 {nome:'Noturno',inicio:1080,fim:1440}
];
export const shiftEvents=(events,environmentId,shift)=>events
 .filter(e=>e.ambienteId===environmentId&&e.inicio<shift.fim&&shift.inicio<e.fim)
 .sort((a,b)=>a.inicio-b.inicio||a.fim-b.fim);
const time=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const names={pendente:'Pendente',aprovada:'Aprovada',revisao:'Precisa de revisão',calendario:'Calendário',bloqueado:'Bloqueado'};
export function dailyProgramCSV(date,environments,events){
 const rows=[['Data','Turno','Ambiente','Tipo','Capacidade','Cadastro','Status','Início no turno','Fim no turno','Docente','Turma','Disciplina','Origem','Observações']];
 for(const shift of BOARD_SHIFTS)for(const env of environments){
  const hits=shiftEvents(events,env.id,shift),base=[date.split('-').reverse().join('/'),shift.nome,env.nome,env.tipo==='sala'?'Sala':'Laboratório',env.capacidade,env.ativo?'Habilitado':'Indisponível'];
  if(!hits.length)rows.push([...base,env.ativo?'Livre':'Indisponível','','','','','','','']);
  for(const e of hits)rows.push([...base,names[e.status]||e.status,time(Math.max(e.inicio,shift.inicio)),time(Math.min(e.fim,shift.fim)),e.docente||'',e.turma||'',e.disciplina||e.sigla||'',e.origem||'',e.motivo||'']);
 }
 const cell=value=>{let text=String(value??'');if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'};
 return '\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
