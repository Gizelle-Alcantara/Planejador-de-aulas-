// Catálogo e modelos de cursos; as autorizações são conferidas novamente pela API.
window.SENAI_COURSE_UI=(()=>{
 const teachers=()=>G.docentes||[],catalog=()=>G.cursos||[];
 const course=()=>catalog().find(c=>c.id===UI.courseId);
 const classes=c=>Object.entries(T).filter(([,s])=>SENAI_COURSES.courseOf(s)===c.id);
 const canEdit=()=>!!(UI.me?.master||UI.me?.courseRestricted);
 const draftKey=c=>c.id||'_new';
 function formCourse(form){
  const data=new FormData(form),prior=catalog().find(c=>c.id===form.dataset.courseId);
  return {id:prior?.id,nome:String(data.get('nome')||'').trim(),tipo:data.get('tipo')||prior?.tipo,
   ucs:[...form.querySelectorAll('.course-unit')].map(row=>{const v=name=>row.querySelector(`[name="${name}"]`).value.trim();return {sigla:v('sigla').toUpperCase(),nome:v('unidade'),ch:Number(v('ch')),modulo:v('modulo'),docenteId:v('docenteId')}})};
 }
 function stash(form=document.getElementById('course-editor')){
  if(!form||!canEdit())return;
  const data=formCourse(form),key=draftKey(data),saved=catalog().find(c=>c.id===data.id)||{nome:'',tipo:'tecnico',ucs:[]};
  const original={id:saved.id,nome:saved.nome,tipo:saved.tipo,ucs:saved.ucs.map(u=>({sigla:u.sigla,nome:u.nome,ch:u.ch,modulo:u.modulo||'',docenteId:u.docenteId||''}))};
  UI.courseDrafts||={};if(JSON.stringify(data)===JSON.stringify(original))delete UI.courseDrafts[key];else UI.courseDrafts[key]=data;
  const counter=form.querySelector('[data-course-unit-count]');if(counter)counter.textContent=data.ucs.length+' unidade(s)';
  const status=document.getElementById('course-feedback');if(status)status.textContent=UI.courseDrafts[key]?'Alterações não salvas. Clique em Salvar modelo do curso.':'';
 }
 const button=(label,action,extra='')=>`<button class="btn ${extra}" type="button" data-course-action="${action}">${label}</button>`;
 async function load(){
  const r=await PLAN.api({op:'course_list'});if(!r.ok)throw Error(r.error||'Não foi possível carregar os cursos.');
  G.cursos=r.items;G.coursesEnabled=r.enabled;UI.courseRev=r.rev;UI.courseLoaded=true;
  if(UI.tab==='cursos')renderView();return r;
 }
 function editor(c){
  const editable=canEdit(),draft=UI.courseDrafts?.[draftKey(c)],value=draft||c,options=classes(c);
  return `<form id="course-editor" data-course-id="${esc(c.id||'')}"><div class="course-section-heading"><div><h3>Modelo de unidades curriculares</h3><p class="small muted">Prepare a estrutura usada ao criar novas turmas. As turmas existentes mantêm seus próprios ajustes.</p></div><span class="course-badge" data-course-unit-count>${value.ucs.length} unidade(s)</span></div>${!editable?'<p class="course-notice">Consulta do modelo. A edição exige acesso de administrador ou vínculo ao curso após a ativação das restrições. Os ajustes das suas turmas continuam na opção Ajustes por turma.</p>':''}<div class="form course-metadata"><label class="f">Nome do curso<input type="text" name="nome" value="${esc(value.nome||'')}" maxlength="160" required ${c.id||!editable?'readonly':''}></label><label class="f">Tipo<select aria-label="Tipo" name="tipo" ${!UI.me?.master?'disabled':''}><option value="tecnico" ${value.tipo==='tecnico'?'selected':''}>Curso técnico</option><option value="rapido" ${value.tipo==='rapido'?'selected':''}>Curso rápido</option></select></label></div>${editable&&options.length?`<div class="course-import"><div><strong>Começar a partir de uma turma</strong><p class="small muted">Importe somente unidades e professores. O calendário da turma permanece como está.</p></div><label class="f">Turma de origem<select id="course-import-source" aria-label="Turma de origem">${options.map(([id,s])=>`<option value="${esc(id)}" ${id===CUR?'selected':''}>${esc(s.cfg.turma)} · ${esc(s.cfg.turno)}</option>`).join('')}</select></label>${button('Importar unidades da turma','import-template')}</div>`:''}<div id="course-unit-rows">${value.ucs.length?value.ucs.map((u,i)=>unitRow(u,i,!editable)).join(''):`<div class="course-empty" data-course-empty><strong>O modelo ainda não tem unidades curriculares</strong><p>Adicione a primeira unidade${options.length?' ou importe a estrutura de uma turma deste curso':''}.</p></div>`}</div>${editable?`<div class="course-actions row">${button('Adicionar unidade curricular','add-unit')}<button class="btn pri" type="submit">Salvar modelo do curso</button>${button('Descartar alterações','discard')}</div>`:''}<p id="course-feedback" role="status" aria-live="polite">${draft?'Alterações não salvas. Clique em Salvar modelo do curso.':''}</p></form>`;
 }
 function unitRow(u={},i=0,readonly=false){return `<fieldset class="course-unit" ${readonly?'disabled':''}><legend>Unidade curricular ${i+1}</legend><div class="form"><label class="f">Sigla<input type="text" name="sigla" value="${esc(u.sigla||'')}" maxlength="15" pattern="[A-Z0-9_-]{1,15}" required></label><label class="f">Unidade curricular<input type="text" name="unidade" value="${esc(u.nome||'')}" maxlength="200" required></label><label class="f">Carga horária<input name="ch" type="number" min="0.01" max="10000" step="any" value="${esc(u.ch||'')}" required></label><label class="f">Módulo<input type="text" name="modulo" value="${esc(u.modulo||'')}" maxlength="40" placeholder="Opcional"></label><label class="f">Professor sugerido<select aria-label="Professor sugerido" name="docenteId"><option value="">Definir na turma</option>${u.docenteId&&!teachers().some(t=>t.id===u.docenteId)?`<option value="${esc(u.docenteId)}" selected disabled>Professor removido — selecione outro</option>`:""}${teachers().map(t=>`<option value="${esc(t.id||'')}" ${u.docenteId===t.id?'selected':''}>${esc(t.nome)}</option>`).join('')}</select></label></div>${readonly?'':button('Remover unidade','remove-unit','sm bad')}</fieldset>`}
 function teacherView(c){
  const people=new Map();
  const add=(u,source,code)=>{if(!u.docenteId&&!u.docente)return;const t=teachers().find(t=>u.docenteId?t.id===u.docenteId:t.nome===u.docente),key=t?.id||u.docenteId||u.docente;const person=people.get(key)||{nome:t?.nome||u.docente||'Docente não encontrado',model:new Set(),units:new Set(),turmas:new Set()};if(source==='model')person.model.add(u.sigla);else{person.units.add(code+'/'+u.sigla);person.turmas.add(code)}people.set(key,person)};
  c.ucs.forEach(u=>add(u,'model'));classes(c).forEach(([,s])=>s.ucs.forEach(u=>add(u,'class',s.cfg.turma)));
  return `<div class="course-section-heading"><div><h3>Professores do curso</h3><p class="small muted">Sugestões do modelo e vínculos nas turmas deste curso.</p></div></div><div class="course-people">${[...people.values()].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(p=>`<article class="course-person-card"><span class="course-avatar" aria-hidden="true">${esc(p.nome.split(/\s+/).slice(0,2).map(n=>n[0]).join(''))}</span><div><h4>${esc(p.nome)}</h4><p>${p.model.size} unidade(s) no modelo · ${p.units.size} nas turmas</p><p class="small muted">${p.turmas.size?'Turmas: '+[...p.turmas].map(esc).join(', '):'Professor sugerido; ainda sem turma vinculada neste curso.'}</p></div></article>`).join('')||'<div class="course-empty"><strong>Nenhum professor vinculado</strong><p>Escolha os professores nas unidades do modelo ou nos ajustes por turma.</p></div>'}</div>`;
 }
 function classView(c){return `<div class="course-section-heading"><div><h3>Turmas deste curso</h3><p class="small muted">Abra o calendário ou ajuste as unidades de cada turma.</p></div></div><label class="f course-class-picker">Buscar turma<input type="search" id="course-class-search" placeholder="Código, turno ou módulo" value="${esc(UI.courseClassQuery||'')}"></label><div class="course-classes">${classes(c).map(([id,s])=>`<article class="course-class" ${[s.cfg.turma,s.cfg.turno,s.cfg.modulo].join(" ").toLocaleLowerCase("pt-BR").includes((UI.courseClassQuery||"").trim().toLocaleLowerCase("pt-BR"))?"":"hidden"} data-course-class-text="${esc([s.cfg.turma,s.cfg.turno,s.cfg.modulo].join(' ').toLocaleLowerCase('pt-BR'))}"><div><strong>Turma ${esc(s.cfg.turma)}</strong><p class="small muted">${esc(s.cfg.turno)} · ${br(s.cfg.inicio)} a ${br(s.cfg.termino)}</p><span class="course-badge">${s.ucs.length} unidade(s) · ${s.ucs.reduce((n,u)=>n+(Number(u.ch)||0),0)} h</span></div><div class="row"><button class="btn" type="button" data-course-adjust="${esc(id)}">Ajustar unidades</button><button class="btn pri" type="button" data-course-turma="${esc(id)}">Abrir calendário</button></div></article>`).join('')||'<div class="course-empty"><strong>Nenhuma turma cadastrada</strong><p>Use Nova turma deste curso para começar com o modelo.</p></div>'}</div><p id="course-class-results" class="small muted" role="status"></p>`}
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
  if(UI.coursePage==='new'&&UI.me?.master)return `<section class="panel course-workspace">${button("Voltar aos cursos","back","sm")}<h2>Novo curso</h2>${editor({nome:'',tipo:'tecnico',ucs:[]})}</section>`;
  if(c&&UI.coursePage==='detail'){
   const sections=[['units','Unidades curriculares'],['teachers','Professores'],['classes','Turmas']],active=UI.courseDetail==='class-units'?'units':UI.courseDetail||'units';
   return `<section class="panel course-workspace"><div class="course-topline">${button('Voltar aos cursos','back','sm')}<span class="course-type">${c.tipo==='tecnico'?'Curso técnico':'Curso rápido'}</span></div><div class="course-workspace-heading"><div><p class="class-eyebrow">Organização acadêmica</p><h2>${esc(c.nome)}</h2><p class="muted">Organize o modelo de ensino e acompanhe as turmas do curso.</p></div>${button('Nova turma deste curso','new-class','pri')}</div><dl class="course-metrics"><div><dt>Unidades no modelo</dt><dd>${c.ucs.length}</dd></div><div><dt>Carga horária do modelo</dt><dd>${c.ucs.reduce((n,u)=>n+(Number(u.ch)||0),0)} <small>h</small></dd></div><div><dt>Turmas do curso</dt><dd>${classes(c).length}</dd></div></dl><nav class="course-primary-nav" aria-label="Áreas do curso">${sections.map(([key,label])=>`<button class="btn" type="button" data-course-action="${key}" aria-pressed="${active===key}">${label}</button>`).join('')}</nav><div class="course-content">${active==='teachers'?teacherView(c):active==='classes'?classView(c):units(c)}</div></section>`;
  }
  return `<section class="panel">${title}${UI.courseError?`<p role="alert">${esc(UI.courseError)}</p>`:''}<div class="row course-tabs"><label class="f">Tipo de curso<select aria-label="Tipo de curso" id="course-type-filter"><option value="">Todos</option><option value="tecnico" ${filter==='tecnico'?'selected':''}>Cursos técnicos</option><option value="rapido" ${filter==='rapido'?'selected':''}>Cursos rápidos</option></select></label></div><div class="course-grid">${all.map(c=>`<article class="course-card"><span class="course-type">${c.tipo==='tecnico'?'Curso técnico':'Curso rápido'}</span><h3>${esc(c.nome)}</h3><p class="small muted">${c.ucs.length} unidades no modelo · ${classes(c).length} turmas</p>${c.legacy?'<p class="small muted">Curso identificado nas turmas existentes; modelo ainda não cadastrado.</p>':''}<button class="btn" data-course-open="${esc(c.id)}">Abrir curso</button></article>`).join('')||`<p>${UI.me?.courseRestricted?'Nenhum curso vinculado à sua conta. Solicite o vínculo ao administrador.':'Nenhum curso cadastrado.'}</p>`}</div>${UI.me?.master&&!G.coursesEnabled?'<p class="small muted">Os acessos atuais serão preservados até você configurar os vínculos e ativar as restrições em Acessos por curso.</p>':''}</section>`;
 }
 async function run(action){
  if(action==='new'){UI.coursePage='new';UI.courseId='';renderView();return}
  if(action==='access'){UI.coursePage='access';UI.courseUsers=null;renderView();return}
  if(action==='back'){UI.coursePage='';UI.courseId='';renderView();return}
  if(['units','class-units','teachers','classes'].includes(action)){if(action==='class-units'){const options=classes(course());if(options.length&&!options.some(([id])=>id===CUR)){CUR=options[0][0];normalize();persistLocal()}}UI.courseDetail=action;renderView();return}
  if(action==='new-class'){UI.newCourseId=course().id;openTurmaModal();return}
  if(action==='add-unit'){if(!canEdit())return;const box=document.getElementById('course-unit-rows');if(box.querySelectorAll('.course-unit').length>=200){toast('O modelo permite até 200 unidades.');return}box.querySelector('[data-course-empty]')?.remove();box.insertAdjacentHTML('beforeend',unitRow({},box.querySelectorAll('.course-unit').length));stash();box.lastElementChild.querySelector('input')?.focus();return}
  if(action==='discard'){delete UI.courseDrafts?.[course()?.id||'_new'];renderView();return}
  if(action==='import-template'){
   if(!canEdit())return;const sourceId=document.getElementById('course-import-source')?.value,source=classes(course()).find(([id])=>id===sourceId)?.[1];
   if(!source){toast('Selecione uma turma deste curso.');return}
   if(!source.ucs.length){toast('A turma selecionada não possui unidades curriculares.');return}
   const box=document.getElementById('course-unit-rows');if(box.querySelector('.course-unit')&&!confirm('Substituir as unidades deste rascunho pelas unidades da turma selecionada? O modelo só muda depois de salvar.'))return;
   box.innerHTML=source.ucs.map((u,i)=>unitRow({...u,docenteId:u.docenteId||teachers().find(t=>t.nome===u.docente)?.id||'',modulo:u.modulo||source.cfg.modulo||''},i)).join('');stash();return;
  }
  if(action==='enable'){
   if(!confirm('Ativar restrições por curso? Coordenadores sem vínculo não poderão acessar turmas.'))return;
   const r=await PLAN.api({op:'course_enable',base:UI.courseRev});if(!r.ok)throw Error(r.error==='conflict'?'O catálogo mudou. Atualize antes de ativar.':r.error);await load();toast('Restrições por curso ativadas.');return;
  }
 }
 document.addEventListener('click',e=>{
  const open=e.target.closest('[data-course-open]');if(open){UI.courseClassQuery='';UI.courseId=open.dataset.courseOpen;UI.coursePage='detail';UI.courseDetail='units';renderView();return}
  const adjust=e.target.closest('[data-course-adjust]');if(adjust&&classes(course()).some(([id])=>id===adjust.dataset.courseAdjust)){CUR=adjust.dataset.courseAdjust;normalize();persistLocal();UI.courseDetail='class-units';renderView();return}
  const turma=e.target.closest('[data-course-turma]');if(turma){CUR=turma.dataset.courseTurma;normalize();UI.tab='calendario';UI.month=null;persistLocal();renderView();return}
  const b=e.target.closest('[data-course-action]');if(!b)return;
  if(b.dataset.courseAction==='remove-unit'&&canEdit()){b.closest('.course-unit').remove();stash();renderView();return}
  run(b.dataset.courseAction).catch(e=>toast(e.message||'Não foi possível concluir.'));
 });
 document.addEventListener('input',e=>{if(e.target.closest('#course-editor')){if(e.target.name==='sigla')e.target.value=e.target.value.toUpperCase();stash()}if(e.target.id==='course-class-search'){UI.courseClassQuery=e.target.value;const query=e.target.value.trim().toLocaleLowerCase('pt-BR');let found=0;document.querySelectorAll('[data-course-class-text]').forEach(row=>{row.hidden=!row.dataset.courseClassText.includes(query);if(!row.hidden)found++});document.getElementById('course-class-results').textContent=found?found+' turma(s) encontrada(s).':'Nenhuma turma corresponde à busca.'}});
 window.addEventListener('beforeunload',e=>{if(Object.keys(UI.courseDrafts||{}).length){e.preventDefault();e.returnValue=''}});
 document.addEventListener('change',e=>{if(e.target.closest('#course-editor'))stash();if(e.target.id==='course-unit-class'){if(dirty||UI.status==='saving'){e.target.value=CUR;toast('Aguarde a confirmação de gravação antes de trocar de turma.');return}const target=classes(course()).find(([id])=>id===e.target.value);if(target){CUR=target[0];normalize();persistLocal();renderView()}return}if(e.target.id==='course-type-filter'){UI.courseType=e.target.value;renderView()}if(e.target.id==='ntCourseCatalog'){const c=catalog().find(c=>c.id===e.target.value);document.getElementById('ntCurso').value=c?.nome||'';}});
 document.addEventListener('submit',async e=>{
  const form=e.target;if(form.id!=='course-editor'&&!form.matches('.course-access-form'))return;e.preventDefault();
  const feedback=form.querySelector('[role=status]'),b=form.querySelector('[type=submit]');b.disabled=true;feedback.textContent='Salvando…';
  try{
   let r;if(form.id==='course-editor'){
    const data=formCourse(form),key=draftKey(data);
    r=await PLAN.api({op:'course_save',base:UI.courseRev,course:data});
    if(!r.ok)throw Error(r.error==='conflict'?'O modelo mudou em outra sessão. Atualize e confira antes de salvar.':r.error);
    delete UI.courseDrafts?.[key];UI.courseId=r.course.id;UI.coursePage='detail';await load();await PLAN.refresh();toast('Modelo do curso salvo.');
   }else{
    const ids=new FormData(form).getAll('courseIds');r=await PLAN.api({op:'user_courses',login:form.dataset.login,courseIds:ids});if(!r.ok)throw Error(r.error);UI.courseUsers.find(u=>u.login===form.dataset.login).courseIds=ids;feedback.textContent='Vínculos salvos.';
   }
  }catch(error){feedback.textContent=error.message||'Não foi possível salvar.';}finally{b.disabled=false}
 });
 return {render,load};
})();
