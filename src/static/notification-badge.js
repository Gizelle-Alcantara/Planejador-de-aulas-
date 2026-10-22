(()=>{
 let user=null,count=null,loading=false;
 function paint(){document.querySelectorAll('[data-notification-shortcut]').forEach(link=>{
  link.hidden=!user;if(!user)return;
  const text=count===null?'Notificações':`Notificações (${count} não lidas)`;
  const compact=!!link.closest('.brand')?.querySelector('.class-heading');
  link.setAttribute('aria-label',text);
  if(link.dataset.badgeLabel!==text||link.dataset.badgeCompact!==String(compact)){
   link.dataset.badgeLabel=text;link.dataset.badgeCompact=String(compact);
   if(compact){
    link.innerHTML='<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';
    const label=document.createElement('span');label.className='header-notification-label';label.textContent='Notificações';link.append(label);
    if(count!==null){const badge=document.createElement('span');badge.className='header-notification-count';badge.textContent=String(count);link.append(badge)}
   }else link.textContent=text;
  }
 })}
 async function refresh(){
  if(loading||document.hidden)return;loading=true;
  try{
   if(!user){const session=window.PLAN?{user:await PLAN.me()}:await(await fetch('/api',{cache:'no-store',credentials:'same-origin'})).json();if(['coord','docente','ambientes'].includes(session.user?.role))user=session.user;else{paint();return}}
   const response=await fetch('/api',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({op:'notification_list',unreadOnly:true})});
   if(response.ok)count=(await response.json()).unread;else if([401,403].includes(response.status)){user=null;count=null}
   paint();
  }catch{/* Mantém o último contador conhecido durante falhas de conexão. */}finally{loading=false}
 }
 new MutationObserver(paint).observe(document.body,{childList:true,subtree:true});
 refresh();setInterval(refresh,30000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
