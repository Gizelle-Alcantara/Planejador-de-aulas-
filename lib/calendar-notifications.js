import { blocksForDay } from './schedule.js';

// Compara apenas aulas e dados acadêmicos; alunos e observações privadas não entram nos avisos.
function lessons(state, date, teacher) {
 if(!state?.cfg)return [];
 return blocksForDay(state,date,true).flatMap(block=>{
  const uc=(state.ucs||[]).find(u=>u.sigla===block.sigla);
  if(!uc||(teacher&&uc.docente!==teacher))return [];
  return [{sigla:uc.sigla,nome:uc.nome||'',docente:uc.docente||'',sala:uc.sala||state.cfg.local||'',
   inicio:block.inicio,fim:block.fim,curso:state.cfg.curso||'',turma:state.cfg.turma||'',
   cancelada:state.reg?.[date]?.dado==='nao'}];
 }).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
export function calendarNotifications(before,after,accounts,fromDate) {
 const dates=[...new Set([...Object.keys(before?.days||{}),...Object.keys(after?.days||{})])].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>=fromDate).sort();
 const changed=teacher=>dates.filter(d=>JSON.stringify(lessons(before,d,teacher))!==JSON.stringify(lessons(after,d,teacher)));
 const all=changed();if(!all.length)return [];
 const turma=after?.cfg?.turma||before?.cfg?.turma||'',format=d=>d.split('-').reverse().join('/');
 const message=ds=>`${after?'Calendário atualizado':'Calendário removido'} · Turma ${turma} · ${ds.length} dia(s): ${ds.slice(0,3).map(format).join(', ')}${ds.length>3?'…':''}. Confira suas aulas.`;
 const result=[{target:'@coordenacao',message:message(all)}];
 for(const account of accounts){
  if(account.role!=='docente'||!account.docente)continue;
  const own=changed(account.docente);if(own.length)result.push({target:account.login,message:message(own)});
 }
 return result;
}
