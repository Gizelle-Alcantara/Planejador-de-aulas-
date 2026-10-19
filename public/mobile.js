// Navegação e agenda usam somente controles e aulas já autorizados pela tela atual.
(()=>{
 const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)];
 const small=matchMedia('(max-width:620px)');let layout=small.matches?'agenda':'month';
 try{const saved=sessionStorage.getItem('senai-calendar-layout');if(['month','agenda'].includes(saved))layout=saved}catch{}
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
 function navigation(){
  $('#mobile-section-picker')?.remove();$('#mobile-shortcuts')?.remove();
  const tabs=all('#tabs [role=tab]'),view=$('#view'),team=typeof UI!=='undefined'&&['coord','docente','ambientes'].includes(UI.me?.role);
  if(tabs.length){
   const box=node('div',undefined,'mobile-section-picker');box.id='mobile-section-picker';
   const label=node('label','Seções do sistema');label.htmlFor='mobile-section';const select=node('select');select.id='mobile-section';
   for(const group of all('#tabs .nav-group')){
    const options=node('optgroup');options.label=$('.nav-group-title',group)?.textContent||'Seções';
    for(const tab of all('[role=tab]',group)){const option=node('option',tab.textContent);option.value=tab.dataset.k;option.selected=tab.getAttribute('aria-selected')==='true';options.append(option)}select.append(options);
   }
   select.onchange=()=>{tabs.find(t=>t.dataset.k===select.value)?.click();queueMicrotask(()=>$('#mobile-section')?.focus({preventScroll:true}))};box.append(label,select);$('#tabs').after(box);
   const active=tabs.find(t=>t.getAttribute('aria-selected')==='true');
   if(small.matches){view.setAttribute('role','region');view.setAttribute('aria-label',active?.textContent||'Seção atual');view.removeAttribute('aria-labelledby')}
   else{view.setAttribute('role','tabpanel');view.setAttribute('aria-labelledby',active?.id||tabs[0].id);view.removeAttribute('aria-label')}
  }
  if(team&&typeof MODE!=='undefined'&&MODE!=='landing'&&MODE!=='aluno'){
   const bar=node('nav',undefined,'mobile-shortcuts');bar.id='mobile-shortcuts';bar.setAttribute('aria-label','Atalhos no celular');
   for(const key of ['painel','calendario']){const tab=tabs.find(t=>t.dataset.k===key);if(!tab)continue;const button=node('button',tab.textContent);button.type='button';button.id='mobile-quick-'+key;button.setAttribute('aria-current',tab.getAttribute('aria-selected')==='true'?'page':'false');button.onclick=()=>tab.click();bar.append(button)}
   if(!tabs.length){const a=node('a','Calendário');a.href='/#docente';bar.append(a);const rooms=node('a','Reservas');rooms.href='/ambientes.html#reservations';bar.append(rooms)}
   const notices=node('a','Notificações');notices.href='/notificacoes.html';bar.append(notices);$('.wrap')?.append(bar);
  }
  document.body.classList.toggle('has-mobile-shortcuts',!!$('#mobile-shortcuts'));
 }
 function calendar(){
  all('.calendar-scroll').forEach((shell,index)=>{
   const cal=$('.cal',shell);if(!cal||shell.dataset.mobileEnhanced)return;shell.dataset.mobileEnhanced='true';
   const controls=node('div',undefined,'calendar-view-switch');controls.setAttribute('role','group');controls.setAttribute('aria-label','Visualização do calendário');
   const month=node('button','Mês','btn'),agendaButton=node('button','Agenda','btn');month.type=agendaButton.type='button';
   const agenda=node('div',undefined,'calendar-agenda');agenda.id='calendar-agenda-'+index;agenda.tabIndex=0;agenda.setAttribute('role','region');agenda.setAttribute('aria-label','Agenda do mês');shell.id='calendar-month-'+index;
   month.setAttribute('aria-controls',shell.id);agendaButton.setAttribute('aria-controls',agenda.id);
   const editable=typeof MODE!=='undefined'&&MODE==='planner'&&UI.me?.role==='coord';
   if(editable){
    const form=node('form',undefined,'calendar-agenda-edit'),label=node('label','Data para editar'),input=node('input'),button=node('button','Editar data','btn');input.type='date';input.id='agenda-edit-date-'+index;input.required=true;label.htmlFor=input.id;input.min=S.cfg.inicio||'';input.max=S.cfg.termino||'';
    input.value=UI.mobileAgendaDate||[input.min,UI.month+'-01'].sort().at(-1);if(input.min&&input.value<input.min)input.value=input.min;if(input.max&&input.value>input.max)input.value=input.max;
    input.onchange=()=>{UI.mobileAgendaDate=input.value};button.type='submit';form.append(label,input,button);form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())openDayModal(input.value)};agenda.append(form);
   }
   let count=0;
   for(const day of all('.day[data-iso]',cal)){
    const chips=all('.chip',day).filter(c=>c.style.display!=='none'),note=$('.lb',day)?.textContent;
    if(!chips.length&&!note)continue;count++;
    const article=node('article',undefined,'agenda-day');article.dataset.date=day.dataset.iso;
    article.append(node('h3',new Date(day.dataset.iso+'T12:00:00Z').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',timeZone:'UTC'})));
    if(note)article.append(node('p',note,'small muted'));
    for(const chip of chips){
     const item=node('div',undefined,'agenda-lesson');if(chip.classList.contains('ead-note'))item.classList.add('agenda-ead');
     item.append(node('h4',chip.dataset.agendaSubject||chip.textContent));
     const info=[chip.dataset.agendaTeacher,chip.dataset.agendaRoom,chip.dataset.agendaTime].filter(Boolean);if(info.length)item.append(node('p',info.join(' · ')));
     if(chip.dataset.agendaCancelled==='true')item.append(node('p','Aula cancelada / não dada','agenda-cancelled'));
     if(chip.classList.contains('bad'))item.append(node('p',chip.title||'Conflito de horário. Confira o lançamento.','agenda-conflict'));
     article.append(item);
    }
    if(editable){const edit=node('button','Editar dia','btn');edit.type='button';edit.setAttribute('aria-label','Editar dia '+day.dataset.iso.split('-').reverse().join('/'));edit.onclick=()=>openDayModal(day.dataset.iso);article.append(edit)}
    agenda.append(article);
   }
   if(!count)agenda.append(node('p','Nenhuma aula ou observação neste mês para os filtros selecionados.','small muted'));
   function show(value){layout=value;shell.hidden=value==='agenda';agenda.hidden=value!=='agenda';month.setAttribute('aria-pressed',String(value==='month'));agendaButton.setAttribute('aria-pressed',String(value==='agenda'));try{sessionStorage.setItem('senai-calendar-layout',value)}catch{}}
   month.onclick=()=>show('month');agendaButton.onclick=()=>show('agenda');controls.append(month,agendaButton);shell.before(controls);shell.after(agenda);
   shell.hidden=layout==='agenda';agenda.hidden=layout!=='agenda';month.setAttribute('aria-pressed',String(layout==='month'));agendaButton.setAttribute('aria-pressed',String(layout==='agenda'));
  });
 }
 function enhance(){navigation();calendar()}
 if(typeof renderView==='function'){
  const original=renderView;renderView=function(){const active=document.activeElement,id=active?.id;original();enhance();if(id&&active&&!active.isConnected)document.getElementById(id)?.focus({preventScroll:true})};enhance();
 }
 small.addEventListener('change',navigation);
})();
