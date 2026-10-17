const $=s=>document.querySelector(s),feedback=$('#notification-feedback'),list=$('#notification-list');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user,items=[],cursor=null,busy=false;
async function api(body){
 const r=await fetch('/api',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error||'Não foi possível carregar os avisos.'),{status:r.status});return data;
}
const filters=()=>({kind:$('#notification-kind').value,unreadOnly:$('#notification-state').value==='unread'});
function message(text,error=false){feedback.textContent=text;feedback.className=error?'error':''}
function controls(){
 $('#notification-center').querySelectorAll('button,select').forEach(el=>el.disabled=busy);
 $('#notification-read-visible').disabled=busy||!items.some(n=>!n.lida);list.setAttribute('aria-busy',String(busy));
}
function target(n){
 if(n.kind==='calendario')return user.role==='docente'?'/#docente':`/?aba=calendario&turma=${encodeURIComponent(String(n.docId||'').replace(/^turma-/,''))}`;
 return '/ambientes.html#reservation-'+encodeURIComponent(n.reservaId||'');
}
function render(){
 list.innerHTML=items.map(n=>`<article class="${n.lida?'read':''}" data-notification="${n.id}" aria-label="${n.lida?'Aviso lido':'Aviso não lido'}"><p class="meta">${n.kind==='calendario'?'Calendário':'Reserva'} · ${esc(new Date(n.at).toLocaleString('pt-BR'))} · ${n.lida?'Lida':'Não lida'}</p><p>${esc(n.message)}</p><div class="actions"><a href="${esc(target(n))}">${n.kind==='calendario'?'Abrir calendário':'Ver reserva'}</a>${!n.lida?`<button class="secondary" data-read="${n.id}">Marcar como lida</button>`:''}</div></article>`).join('')||'<p>Nenhum aviso para os filtros selecionados.</p>';
 $('#notification-more').hidden=!cursor;controls();
}
async function load(append=false){
 if(busy)return;busy=true;controls();message('Carregando notificações…');
 try{
  const data=await api({op:'notification_list',...filters(),...append&&cursor?{before:cursor}:{}});
  items=append?[...items,...data.items.filter(n=>!items.some(old=>old.id===n.id))]:data.items;cursor=data.nextCursor;
  $('#notification-count').textContent=`${data.unread} não lida(s)`;render();message(`${items.length} aviso(s) exibido(s).`);
 }catch(e){message(e.message,true);if(e.status===401||e.status===403){items=[];list.replaceChildren();$('#notification-center').hidden=true;$('#notification-login').hidden=false}}
 finally{busy=false;controls()}
}
async function read(ids){
 if(busy||!ids.length)return;busy=true;controls();
 try{
  // O lote contém apenas avisos exibidos, sem marcar os que chegaram depois.
  for(let start=0;start<ids.length;start+=100)await api({op:'notification_read_many',ids:ids.slice(start,start+100)});
  busy=false;await load();if(!feedback.classList.contains('error'))message('Avisos marcados como lidos.');
 }catch(e){message(e.message,true)}finally{busy=false;controls()}
}
$('#notification-filters').onsubmit=e=>{e.preventDefault();load()};
$('#notification-filters').onchange=()=>load();$('#notification-more').onclick=()=>load(true);
$('#notification-read-visible').onclick=()=>read(items.filter(n=>!n.lida).map(n=>n.id));
list.onclick=e=>{const b=e.target.closest('[data-read]');if(b)read([Number(b.dataset.read)])};
try{
 const session=await api();user=session.user;
 if(!user||!['coord','docente','ambientes'].includes(user.role)){$('#notification-login').hidden=false;message('Acesso restrito às contas da equipe.')}
 else{$('#account').textContent=user.nome;$('#notification-back').href=user.role==='ambientes'?'/ambientes.html':user.role==='docente'?'/#docente':'/';$('#notification-center').hidden=false;await load()}
}catch{message('Não foi possível conectar ao sistema. Atualize a página para tentar novamente.',true);$('#notification-login').hidden=false}
