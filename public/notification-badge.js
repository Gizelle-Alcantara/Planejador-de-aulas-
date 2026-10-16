(()=>{
 let user=null,count=null,loading=false;
 function paint(){document.querySelectorAll('[data-notification-shortcut]').forEach(link=>{
  link.hidden=!user;if(!user)return;
  const text=count===null?'Notificações':`Notificações (${count} não lidas)`;
  if(link.textContent!==text)link.textContent=text;
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
