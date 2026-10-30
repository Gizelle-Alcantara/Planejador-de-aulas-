// Build the preview from saved revisions; the API applies it in one transaction.
export function sharedHolidayPlan(rows,date,name){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Informe uma data válida.');
 if(typeof name!=='string'||!name.trim()||name.trim().length>160)throw Error('Informe o nome do feriado com até 160 caracteres.');
 name=name.trim();const targets=[],skipped={outsidePeriod:0,completed:0,unchanged:0};
 for(const row of rows){
  const data=JSON.parse(String(row.data)),state=data.state;if(!state?.cfg)continue;
  if(!state.cfg.inicio||!state.cfg.termino||date<state.cfg.inicio||date>state.cfg.termino){skipped.outsidePeriod++;continue}
  if(state.reg?.[date]?.dado==='sim'){skipped.completed++;continue}
  const before=state.days?.[date];
  if(before?.t==='feriado'&&before.h===name&&!(before.s||[]).length&&!(before.grade||[]).some(Boolean)){skipped.unchanged++;continue}
  targets.push({id:String(row.id),rev:Number(row.rev),data,turma:String(state.cfg.turma||row.id),curso:String(state.cfg.curso||''),hasLessons:!!((before?.s||[]).length||(before?.grade||[]).some(Boolean)||(before?.ead||[]).length)});
 }
 return {date,name,targets,skipped};
}
