// Interface mobile compartilhada. Os destinos vêm dos controles autorizados.
(()=>{
 const small=matchMedia('(max-width:620px)'),$=s=>document.querySelector(s);
 const element=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 let installEvent=null,installed=false;
 const bar=element('aside',null,'mobile-app-bar');bar.setAttribute('aria-label','Aplicativo SENAI');
 const title=element('span','Agenda SENAI','mobile-app-title'),install=element('button','Instalar app');install.type='button';bar.append(title,install);document.body.prepend(bar);
 const connection=element('p',null,'mobile-connection');connection.setAttribute('role','status');connection.hidden=true;bar.after(connection);
 const dialog=element('dialog',null,'mobile-app-dialog');dialog.setAttribute('aria-labelledby','mobile-menu-title');
 const heading=element('h2','Menu do sistema');heading.id='mobile-menu-title';const close=element('button','Fechar menu','mobile-menu-close');close.type='button';close.onclick=()=>dialog.close();const content=element('div',null,'mobile-menu-content');dialog.append(heading,close,content);document.body.append(dialog);
 function open(title){heading.textContent=title;content.replaceChildren();if(!dialog.open)dialog.showModal()}
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});
 function menu(){
  open('Menu do sistema');
  for(const tab of document.querySelectorAll('#tabs [role=tab]')){const b=element('button',tab.textContent);b.type='button';b.onclick=()=>{dialog.close();tab.click();$('#view')?.focus({preventScroll:true})};content.append(b)}
  const actions=[...document.querySelectorAll('#hdr .hbar [data-act=turmanew],#hdr .hbar>a')];
  if(actions.length){content.append(element('h3','Ações da turma'));for(const source of actions){const b=element('button',source.textContent);b.type='button';b.onclick=()=>{dialog.close();source.click()};content.append(b)}}
  if($('#module-main'))for(const section of document.querySelectorAll('#content > section[id]')){const h=section.querySelector('h2');if(!h)continue;const a=element('a',h.textContent);a.href='#'+section.id;a.onclick=()=>dialog.close();content.append(a)}
 }
 install.onclick=async()=>{
  if(installEvent){const event=installEvent;installEvent=null;try{await event.prompt();const result=await event.userChoice;if(result.outcome==='accepted'){installed=true;install.hidden=true}}catch{instructions()}return}instructions();
 };
 function instructions(){open('Instalar no celular');content.append(element('p','No Android, abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. No iPhone, use Compartilhar e “Adicionar à Tela de Início”.'),element('p','A instalação mantém os mesmos acessos do sistema. Consultar dados atualizados, reservar ambientes e registrar chaves exige conexão com a internet.'))}
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e});window.addEventListener('appinstalled',()=>{installed=true;install.hidden=true});
 function online(){connection.hidden=navigator.onLine;connection.textContent=navigator.onLine?'':'Sem conexão. Novas consultas e alterações exigem internet.'}
 window.addEventListener('online',online);window.addEventListener('offline',online);online();
 function enhance(){
  install.hidden=installed||matchMedia('(display-mode:standalone)').matches||navigator.standalone===true;
  const shortcuts=$('#mobile-shortcuts');if(shortcuts&&$('#tabs [role=tab]')&&!shortcuts.querySelector('[data-mobile-menu]')){const more=element('button','Mais');more.type='button';more.dataset.mobileMenu='';more.setAttribute('aria-haspopup','dialog');more.onclick=menu;shortcuts.append(more)}
  const module=$('#module-main'),nav=module?.querySelector('.module-nav');
  if(nav&&!$('#mobile-module-nav')){
   const dock=element('nav',null,'mobile-shortcuts');dock.id='mobile-module-nav';dock.setAttribute('aria-label','Atalhos no celular');
   for(const [hash,label] of [['#board','Ocupação'],['#reservations','Reservas'],['#keys','Chaves']]){if(!$(hash))continue;const a=element('a',label);a.href=hash;dock.append(a)}
   const more=element('button','Mais');more.type='button';more.setAttribute('aria-haspopup','dialog');more.onclick=menu;dock.append(more);document.body.append(dock);
  }
  document.body.classList.toggle('has-mobile-module',!!$('#mobile-module-nav'));
  for(const a of document.querySelectorAll('#mobile-module-nav a')){if(a.hash===(location.hash||'#board'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  if(!nav)$('#mobile-module-nav')?.remove();
 }
 let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('hashchange',enhance);small.addEventListener('change',()=>{if(!small.matches&&dialog.open)dialog.close();enhance()});enhance();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
