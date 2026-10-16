const labels = {state:'Turma',cfg:'Configuração',curso:'Curso',turma:'Código',turno:'Turno',inicio:'Início',termino:'Término',ucs:'Disciplinas',days:'Calendário',reg:'Registros de aula',alunos:'Alunos',docentes:'Docentes',nome:'Nome',docente:'Docente',sala:'Sala',ch:'Carga horária',s:'Disciplinas do dia',h:'Observação',t:'Tipo de dia',items:'Itens',email:'E-mail'};
const sensitive = /senha|password|token|secret|salt|hash|access|acesso|codigo|code/i;
export function historyDiff(before, after, limit=200) {
 const changes=[];let total=0;
 const value=(v,hidden)=>hidden?'[protegido]':v===undefined?'Não informado':JSON.stringify(v,(k,item)=>sensitive.test(k)?'[protegido]':item);
 function walk(a,b,path=[],hidden=false){
  if(JSON.stringify(a)===JSON.stringify(b))return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
   for(const k of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[k],b[k],[...path,k],hidden||sensitive.test(k));
   return;
  }
  // Expande inclusões e remoções para evitar expor campos protegidos dentro de objetos.
  if((a===undefined&&b&&typeof b==='object')||(b===undefined&&a&&typeof a==='object')){
   for(const k of Object.keys(a||b))walk(a?.[k],b?.[k],[...path,k],hidden||sensitive.test(k));
   return;
  }
  total++;if(changes.length>=limit)return;
  changes.push({field:path.map(k=>/^\d+$/.test(k)?`Item ${Number(k)+1}`:labels[k]||k).join(' › '),before:value(a,hidden),after:value(b,hidden),kind:a===undefined?'incluído':b===undefined?'removido':'alterado'});
 }
 walk(before,after);return {changes,total,truncated:total>changes.length};
}
