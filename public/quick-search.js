// Filtra apenas a apresentação das listas; não recria formulários nem altera dados.
(()=>{
 const states=new Map(),bound=new WeakSet();
 function apply(group){
  const section=group.closest('section'),query=group.querySelector('[data-search-query]'),fields=[...group.querySelectorAll('[data-search-field]')];if(!section||!query)return;
  const filters=Object.fromEntries(fields.map(field=>[field.dataset.searchField,field.value]));states.set(group.dataset.quickSearch,{query:query.value,filters});
  const rows=[...section.querySelectorAll('[data-search-row]')];let count=0;
  rows.forEach(row=>{let data;try{data=JSON.parse(row.dataset.searchRow)}catch{data={text:row.textContent}}const show=SENAI_SEARCH.matchesSearch(data,query.value,filters);row.hidden=!show;if(show)count++});
  const status=group.querySelector('[data-search-status]'),message=`${count} de ${rows.length} ${rows.length===1?'resultado':'resultados'}.${rows.length&&!count?' Nenhum resultado para os filtros selecionados.':''}`;if(status.textContent!==message)status.textContent=message;
  const tbody=rows[0]?.parentElement;let empty=section.querySelector('[data-search-empty]');
  if(tbody&&!empty){const table=tbody.tagName==='TBODY';empty=document.createElement(table?'tr':'p');empty.dataset.searchEmpty='';const cell=table?document.createElement('td'):empty;if(table){cell.colSpan=section.querySelectorAll('thead th').length||1;empty.append(cell)}cell.textContent='Nenhum resultado para os filtros selecionados.';tbody.append(empty)}
  if(empty)empty.hidden=!rows.length||count>0;
 }
 function enhance(){document.querySelectorAll('[data-quick-search]').forEach(group=>{
  if(!bound.has(group)){bound.add(group);const state=states.get(group.dataset.quickSearch),query=group.querySelector('[data-search-query]');if(state){query.value=state.query;group.querySelectorAll('[data-search-field]').forEach(field=>field.value=state.filters[field.dataset.searchField]||'')}
   group.addEventListener('input',()=>apply(group));group.addEventListener('change',()=>apply(group));group.querySelector('[data-search-clear]').addEventListener('click',()=>{query.value='';group.querySelectorAll('[data-search-field]').forEach(field=>field.value='');apply(group);query.focus()});
  }apply(group);
 })}
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
