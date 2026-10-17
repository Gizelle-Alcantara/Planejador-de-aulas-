window.SENAI_SEARCH=(()=>{const normalizeSearch=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
function matchesSearch(record,query='',filters={}){
 const text=normalizeSearch(Array.isArray(record.text)?record.text.join(' '):record.text);
 return normalizeSearch(query).split(/\s+/).filter(Boolean).every(term=>text.includes(term))&&Object.entries(filters).every(([key,value])=>!value||normalizeSearch(record[key])===normalizeSearch(value));
}
;return {normalizeSearch,matchesSearch}})();