window.SENAI_TURMAS=(()=>{// A cópia começa com um calendário vazio e reaproveita apenas campos selecionados.
function duplicateTurma(source,values,choices={}){
 if(!source?.cfg||!Array.isArray(source.ucs))throw new Error('A turma de origem não está disponível.');
 const turma=String(values.turma||'').trim(),curso=String(values.curso||'').trim();
 if(!turma||turma.length>60||!/[a-z0-9]/i.test(turma.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))throw new Error('Informe um código de turma válido, com até 60 caracteres.');
 if(!curso)throw new Error('Informe o nome do curso.');
 const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 if(!date(values.inicio)||!date(values.termino)||values.termino<values.inicio)throw new Error('Informe um período válido: o término deve ser igual ou posterior ao início.');
 const options={configuracoes:true,disciplinas:true,docentes:true,ambientes:true,feriados:false,...choices},c=source.cfg;
 const cfg={turma,curso,turno:options.configuracoes?c.turno||'Matutino':'Matutino',aulasDia:options.configuracoes?c.aulasDia||4:4,modulo:options.configuracoes?c.modulo||'I':'I',coord:options.configuracoes?c.coord||'':'',email:options.configuracoes?c.email||'':'',local:options.ambientes?c.local||'':'',inicio:values.inicio,termino:values.termino,destinatarios:''};
 if(c.cursoId&&curso===c.curso)cfg.cursoId=c.cursoId;
 const ucs=options.disciplinas?source.ucs.map(u=>({sigla:u.sigla,nome:u.nome,ch:u.ch,docente:options.docentes?u.docente||'':'',sala:options.ambientes?u.sala||'':''})):[];
 const days={};if(options.feriados)for(const [iso,day] of Object.entries(source.days||{}))if(date(iso)&&iso>=values.inicio&&iso<=values.termino&&['feriado','sem'].includes(day.t))days[iso]={s:[],t:day.t,h:String(day.h||'')};
 return {cfg,ucs,days,alunos:[],reg:{},envios:[],aviso:{auto:false,lembrete:false,canal:'email',alunos:true,docentes:true,lista:true}};
}
;return {duplicateTurma}})();