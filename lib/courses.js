export const courseNameKey=name=>String(name||'').trim().normalize('NFC').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
export const legacyCourseId=name=>'legacy-'+Array.from(courseNameKey(name),c=>c.codePointAt(0).toString(16)).join('-');
export function courseOf(state){return state?.cfg?.cursoId||legacyCourseId(state?.cfg?.curso);}
export function courseCatalog(docs){
 const items=JSON.parse(JSON.stringify(docs.cursos?.items||[]));
 for(const [id,doc] of Object.entries(docs))if(id.startsWith('turma-')&&doc.state?.cfg?.curso){
  const courseId=courseOf(doc.state);
  if(!items.some(c=>c.id===courseId))items.push({id:courseId,nome:doc.state.cfg.curso,tipo:courseNameKey(doc.state.cfg.curso).includes('tecnico')||courseNameKey(doc.state.cfg.curso).includes('técnico')?'tecnico':'rapido',ucs:[],legacy:true});
 }
 return items;
}
export function validateCourse(course,teachers=[]){
 if(!course||typeof course.nome!=='string'||!course.nome.trim()||course.nome.length>160)return 'Informe o nome do curso (até 160 caracteres).';
 if(!['tecnico','rapido'].includes(course.tipo))return 'Escolha curso técnico ou curso rápido.';
 if(!Array.isArray(course.ucs)||course.ucs.length>200)return 'Modelo de unidades curriculares inválido (até 200 unidades).';
 const siglas=new Set();
 for(const u of course.ucs){
  if(!u||typeof u.sigla!=='string'||!/^[A-Z0-9_-]{1,15}$/.test(u.sigla)||siglas.has(u.sigla))return 'Use siglas únicas, com até 15 letras maiúsculas, números, traço ou underline.';
  siglas.add(u.sigla);
  if(typeof u.nome!=='string'||!u.nome.trim()||u.nome.length>200||!Number.isFinite(u.ch)||u.ch<=0||u.ch>10000)return 'Informe nome e carga horária válida para cada unidade curricular.';
  if(u.docenteId&&(!teachers.some(t=>t.id===u.docenteId)))return 'Professor sugerido não encontrado no cadastro de docentes.';
  if(u.modulo!=null&&(typeof u.modulo!=='string'||u.modulo.length>40))return 'Módulo inválido.';
 }
 return null;
}
export function templateUnits(course,teachers=[]){
 return (course?.ucs||[]).map(u=>{const teacher=teachers.find(t=>t.id===u.docenteId);return {sigla:u.sigla,nome:u.nome,ch:u.ch,docente:teacher?.nome||'',...(teacher?{docenteId:teacher.id}:{}),sala:'',...(u.modulo?{modulo:u.modulo}:{})}});
}
export function parseCourseAccess(value){
 try{const list=typeof value==='string'?JSON.parse(value):value;return Array.isArray(list)&&list.every(id=>typeof id==='string'&&id.length<=1200)?[...new Set(list)]:[];}catch{return []}
}
export function makeCourseScope(docs,ids){
 const allowed=new Set(ids),items=courseCatalog(docs).filter(c=>allowed.has(c.id));
 const canState=state=>!!state?.cfg&&allowed.has(courseOf(state));
 const canDoc=id=>String(id).startsWith('turma-')&&canState(docs[id]?.state);
 return {items,canState,canDoc,ids:items.map(c=>c.id)};
}
