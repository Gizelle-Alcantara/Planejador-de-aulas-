// Catálogo e modelos de cursos; as autorizações são conferidas novamente pela API.
window.SENAI_COURSE_UI=(()=>{
 const teachers=()=>G.docentes||[],catalog=()=>G.cursos||[];
 const course=()=>catalog().find(c=>c.id===UI.courseId);
 const classes=c=>Object.entries(T).filter(([,s])=>SENAI_COURSES.courseOf(s)===c.id);
 const button=(label,action,extra='')=>`<button class="btn ${extra}" type="button" data-course-action="${action}">${label}</button>`;
 async function load(){
  const r=await PLAN.api({op:'course_list'});if(!r.ok)throw Error(r.error||'Não foi possível carregar os cursos.');
  G.cursos=r.items;G.coursesEnabled=r.enabled;UI.courseRev=r.rev;UI.courseLoaded=true;
  if(UI.tab==='cursos')renderView();return r;
 }
 function editor(c){
  const editable=UI.me?.master||UI.me?.courseRestricted;
  return `<form id="course-editor" data-course-id="${esc(c.id||'')}"><div class="form"><label class="f">Nome do curso<input name="nome" value="${esc(c.nome||'')}" maxlength="160" required ${c.id?'readonly':''}></label><label class="f">Tipo<select aria-label="Tipo" name="tipo" ${!UI.me?.master?'disabled':''}><option value="tecnico" ${c.tipo==='tecnico'?'selected':''}>Curso técnico</option><option value="rapido" ${c.tipo==='rapido'?'selected':''}>Curso rápido</option></select></label></div><p class="small muted">O modelo será copiado para novas turmas. Alterações em uma turma não modificam o modelo nem as outras turmas.</p><div id="course-unit-rows">${(c.ucs||[]).map(unitRow).join('')}</div><div class="row course-actions">${editable?button('Adicionar unidade curricular','add-unit'):''}${editable?'<button class="btn pri" type="submit">Salvar modelo do curso</button>':''}${c.id&&UI.me?.master?button('Usar unidades da turma atual','import-template'):''}${button('Voltar aos cursos','back')}</div><p id="course-feedback" role="status" aria-live="polite"></p></form>`;
 }
 function unitRow(u={},i=0){return `<fieldset class="course-unit"><legend>Unidade curricular ${i+1}</legend><div class="form"><label class="f">Sigla<input name="sigla" value="${esc(u.sigla||'')}" maxlength="15" pattern="[A-Z0-9_-]{1,15}" required></label><label class="f">Unidade curricular<input name="unidade" value="${esc(u.nome||'')}" maxlength="200" required></label><label class="f">Carga horária<input name="ch" type="number" min="1" max="10000" step="any" value="${esc(u.ch||'')}" required></label><label class="f">Módulo<input name="modulo" value="${esc(u.modulo||'')}" maxlength="40" placeholder="Opcional"></label><label class="f">Professor sugerido<select aria-label="Professor sugerido" name="docenteId"><option value="">Definir na turma</option>${teachers().map(t=>`<option value="${esc(t.id||'')}" ${u.docenteId===t.id?'selected':''}>${esc(t.nome)}</option>`).join('')}</select></label></div>${button('Remover unidade','remove-unit','sm bad')}</fieldset>`}
 function units(c){
  const adjusting=UI.courseDetail==='class-units',options=classes(c);
  const modes=`<div class="row course-tabs" role="group" aria-label="Edição de unidades curriculares"><button class="btn ${adjusting?'':'pri'}" type="button" data-course-action="units" aria-pressed="${!adjusting}">Modelo do curso</button><button class="btn ${adjusting?'pri':''}" type="button" data-course-action="class-units" aria-pressed="${adjusting}">Ajustes por turma</button></div>`;
  if(!adjusting)return modes+editor(c);
  if(!options.length)return modes+'<p>Nenhuma turma cadastrada neste curso. Crie uma turma para ajustar suas unidades curriculares.</p>';
  if(!options.some(([id])=>id===CUR))return modes+'<p>Escolha Ajustes por turma para abrir uma turma deste curso.</p>';
  return modes+`<label class="f course-class-picker">Turma para ajustar<select id="course-unit-class" aria-label="Turma para ajustar">${options.map(([id,s])=>`<option value="${esc(id)}" ${id===CUR?'selected':''}>${esc(s.cfg.turma)} · ${esc(s.cfg.turno)}</option>`).join('')}</select></label><p class="small muted">Ajustes exclusivos da turma ${esc(S.cfg.turma)}. As alterações são salvas automaticamente e preservam o modelo do curso e as demais turmas.</p>`+vDisc();
 }
 function render(){
  if(!UI.courseLoaded&&!UI.courseLoading){UI.courseLoading=true;load().catch(e=>{UI.courseError=e.message;UI.courseLoaded=true;if(UI.tab==='cursos')renderView()}).finally(()=>{UI.courseLoading=false})}
  const c=course(),filter=UI.courseType||'',all=catalog().filter(c=>!filter||c.tipo===filter);
  const title=`<div class="access-heading"><div><h2>${UI.me?.master?'Cursos':'Meus cursos'}</h2><p class="muted">Cursos técnicos e rápidos, modelos de ensino e turmas.</p></div><div class="row">${UI.me?.master?button('Novo curso','new','pri')+button('Acessos por curso','access'):''}</div></div>`;
  if(UI.coursePage==='access'&&UI.me?.master){
   if(!UI.courseUsers){UI.courseUsers=[];PLAN.api({op:'users'}).then(r=>{UI.courseUsers=r.users||[];if(UI.tab==='cursos')renderView()})}
   return `<section class="panel">${title}<h3>Acessos por curso</h3><p>Selecione os cursos de cada coordenador. O administrador mantém acesso a todos.</p>${UI.courseUsers.filter(u=>u.role==='coord').map(u=>`<form class="course-access-form" data-login="${esc(u.login)}"><h3>${esc(u.nome)} <span class="small muted">(${esc(u.login)})</span></h3>${catalog().map(c=>`<label class="course-check"><input type="checkbox" name="courseIds" value="${esc(c.id)}" ${(u.courseIds||[]).includes(c.id)?'checked':''}>${esc(c.nome)}</label>`).join('')}<button class="btn" type="submit">Salvar vínculos de ${esc(u.nome)}</button><p role="status"></p></form>`).join('')||'<p>Nenhuma conta de coordenação cadastrada. Crie a conta na aba Acesso.</p>'}${!G.coursesEnabled?`<div class="course-activation"><p>Primeiro salve os vínculos. Ao ativar, coordenadores sem curso vinculado não terão acesso às turmas. Cadastros e calendários existentes serão preservados.</p>${button('Ativar restrições por curso','enable','pri')}</div>`:'<p class="stat" data-k="saved">Restrições por curso ativas.</p>'}${button('Voltar aos cursos','back')}</section>`;
  }
  if(UI.coursePage==='new'&&UI.me?.master)return `<section class="panel"><h2>Novo curso</h2>${editor({nome:'',tipo:'tecnico',ucs:[]})}</section>`;
  if(c&&UI.coursePage==='detail')return `<section class="panel">${button('Voltar aos cursos','back','sm')}<p class="course-type">${c.tipo==='tecnico'?'Curso técnico':'Curso rápido'}</p><div class="access-heading"><h2>${esc(c.nome)}</h2>${button('Nova turma deste curso','new-class','pri')}</div><div class="row course-tabs"><button class="btn ${['units','class-units'].includes(UI.courseDetail)?'pri':''}" type="button" data-course-action="units" aria-pressed="${['units','class-units'].includes(UI.courseDetail)}">Unidades curriculares</button>${button('Professores','teachers')}${button('Turmas','classes')}</div>${UI.courseDetail==='teachers'?`<h3>Professores sugeridos</h3>${[...new Set(c.ucs.map(u=>u.docenteId).filter(Boolean))].map(id=>`<p class="course-person">${esc(teachers().find(t=>t.id===id)?.nome||'Docente não encontrado')}</p>`).join('')||'<p>Defina os professores no modelo de unidades curriculares.</p>'}`:UI.courseDetail==='classes'?`<h3>Turmas deste curso</h3>${classes(c).map(([id,s])=>`<article class="course-class"><div><strong>Turma ${esc(s.cfg.turma)}</strong><p class="small muted">${esc(s.cfg.turno)} · ${br(s.cfg.inicio)} a ${br(s.cfg.termino)}</p></div><button class="btn" data-course-turma="${esc(id)}">Abrir calendário</button></article>`).join('')||'<p>Nenhuma turma cadastrada para este curso.</p>'}`:units(c)}</section>`;
  return `<section class="panel">${title}${UI.courseError?`<p role="alert">${esc(UI.courseError)}</p>`:''}<div class="row course-tabs"><label class="f">Tipo de curso<select aria-label="Tipo de curso" id="course-type-filter"><option value="">Todos</option><option value="tecnico" ${filter==='tecnico'?'selected':''}>Cursos técnicos</option><option value="rapido" ${filter==='rapido'?'selected':''}>Cursos rápidos</option></select></label></div><div class="course-grid">${all.map(c=>`<article class="course-card"><span class="course-type">${c.tipo==='tecnico'?'Curso técnico':'Curso rápido'}</span><h3>${esc(c.nome)}</h3><p class="small muted">${c.ucs.length} unidades no modelo · ${classes(c).length} turmas</p>${c.legacy?'<p class="small muted">Curso identificado nas turmas existentes; modelo ainda não cadastrado.</p>':''}<button class="btn" data-course-open="${esc(c.id)}">Abrir curso</button></article>`).join('')||`<p>${UI.me?.courseRestricted?'Nenhum curso vinculado à sua conta. Solicite o vínculo ao administrador.':'Nenhum curso cadastrado.'}</p>`}</div>${UI.me?.master&&!G.coursesEnabled?'<p class="small muted">Os acessos atuais serão preservados até você configurar os vínculos e ativar as restrições em Acessos por curso.</p>':''}</section>`;
 }
 async function run(action){
  if(action==='new'){UI.coursePage='new';UI.courseId='';renderView();return}
  if(action==='access'){UI.coursePage='access';UI.courseUsers=null;renderView();return}
  if(action==='back'){UI.coursePage='';UI.courseId='';renderView();return}
  if(['units','class-units','teachers','classes'].includes(action)){if(action==='class-units'){const options=classes(course());if(options.length&&!options.some(([id])=>id===CUR)){CUR=options[0][0];normalize();persistLocal()}}UI.courseDetail=action;renderView();return}
  if(action==='new-class'){UI.newCourseId=course().id;openTurmaModal();return}
  if(action==='add-unit'){const box=document.getElementById('course-unit-rows');box.insertAdjacentHTML('beforeend',unitRow({},box.children.length));return}
  if(action==='import-template'){
   if(!S||SENAI_COURSES.courseOf(S)!==course().id){toast('Abra primeiro uma turma deste curso para importar sua estrutura.');return}
   const box=document.getElementById('course-unit-rows');box.innerHTML=S.ucs.map((u,i)=>unitRow({...u,docenteId:u.docenteId||teachers().find(t=>t.nome===u.docente)?.id||'',modulo:S.cfg.modulo||''},i)).join('');return;
  }
  if(action==='enable'){
   if(!confirm('Ativar restrições por curso? Coordenadores sem vínculo não poderão acessar turmas.'))return;
   const r=await PLAN.api({op:'course_enable',base:UI.courseRev});if(!r.ok)throw Error(r.error==='conflict'?'O catálogo mudou. Atualize antes de ativar.':r.error);await load();toast('Restrições por curso ativadas.');return;
  }
 }
 document.addEventListener('click',e=>{
  const open=e.target.closest('[data-course-open]');if(open){UI.courseId=open.dataset.courseOpen;UI.coursePage='detail';UI.courseDetail='units';renderView();return}
  const turma=e.target.closest('[data-course-turma]');if(turma){CUR=turma.dataset.courseTurma;normalize();UI.tab='calendario';UI.month=null;persistLocal();renderView();return}
  const b=e.target.closest('[data-course-action]');if(!b)return;
  if(b.dataset.courseAction==='remove-unit'){b.closest('.course-unit').remove();return}
  run(b.dataset.courseAction).catch(e=>toast(e.message||'Não foi possível concluir.'));
 });
 document.addEventListener('change',e=>{if(e.target.id==='course-unit-class'){if(dirty||UI.status==='saving'){e.target.value=CUR;toast('Aguarde a confirmação de gravação antes de trocar de turma.');return}const target=classes(course()).find(([id])=>id===e.target.value);if(target){CUR=target[0];normalize();persistLocal();renderView()}return}if(e.target.id==='course-type-filter'){UI.courseType=e.target.value;renderView()}if(e.target.id==='ntCourseCatalog'){const c=catalog().find(c=>c.id===e.target.value);document.getElementById('ntCurso').value=c?.nome||'';}});
 document.addEventListener('submit',async e=>{
  const form=e.target;if(form.id!=='course-editor'&&!form.matches('.course-access-form'))return;e.preventDefault();
  const feedback=form.querySelector('[role=status]'),b=form.querySelector('[type=submit]');b.disabled=true;feedback.textContent='Salvando…';
  try{
   let r;if(form.id==='course-editor'){
    const data=new FormData(form),prior=catalog().find(c=>c.id===form.dataset.courseId);
    const ucs=[...form.querySelectorAll('.course-unit')].map(row=>{const v=name=>row.querySelector(`[name="${name}"]`).value.trim();return {sigla:v('sigla').toUpperCase(),nome:v('unidade'),ch:Number(v('ch')),modulo:v('modulo'),docenteId:v('docenteId')}});
    r=await PLAN.api({op:'course_save',base:UI.courseRev,course:{id:prior?.id,nome:data.get('nome'),tipo:data.get('tipo')||prior?.tipo,ucs}});
    if(!r.ok)throw Error(r.error==='conflict'?'O modelo mudou em outra sessão. Atualize e confira antes de salvar.':r.error);
    UI.courseId=r.course.id;UI.coursePage='detail';await load();await PLAN.refresh();toast('Modelo do curso salvo.');
   }else{
    const ids=new FormData(form).getAll('courseIds');r=await PLAN.api({op:'user_courses',login:form.dataset.login,courseIds:ids});if(!r.ok)throw Error(r.error);UI.courseUsers.find(u=>u.login===form.dataset.login).courseIds=ids;feedback.textContent='Vínculos salvos.';
   }
  }catch(error){feedback.textContent=error.message||'Não foi possível salvar.';}finally{b.disabled=false}
 });
 return {render,load};
})();
