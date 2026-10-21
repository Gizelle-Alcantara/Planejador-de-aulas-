import {attachKeyControl} from './key-control.js';

const root=document.querySelector('#kiosk-content'),notice=document.querySelector('#kiosk-message');
const IDLE_MS=90_000,MAX_MS=5*60_000;
let cleanup=null,generation=0,active=false,ending=false,busy=false,started=0,touched=0,completionTimer=null,loginTimer=null;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const message=(value,error=false)=>{notice.textContent=value;notice.className=error?'kiosk-error':''};
async function request(body){
 const response=await fetch('/api?kiosk=1',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const data=await response.json();if(!response.ok){const error=Error(data.error||'Não foi possível concluir.');error.status=response.status;throw error}return data;
}
function clear(){generation++;active=false;cleanup?.();cleanup=null;clearTimeout(completionTimer);clearTimeout(loginTimer);root.replaceChildren();message('')}
function focus(){document.querySelector('#kiosk-main').focus();window.scrollTo(0,0)}
function home(){
 root.innerHTML=`<div class="kiosk-welcome"><span class="kiosk-eyebrow">Chaves liberadas para sua aula</span><h1>O que você deseja fazer?</h1><p>Escolha uma opção e entre com sua conta de docente para continuar.</p></div><div class="kiosk-choices"><button type="button" class="kiosk-choice" data-action="retirada"><span class="kiosk-symbol" aria-hidden="true">↗</span><strong>Retirar chave</strong><small>Confira o QR da sua chave e assine aqui, mesmo sem celular.</small></button><button type="button" class="kiosk-choice" data-action="devolucao"><span class="kiosk-symbol" aria-hidden="true">↙</span><strong>Devolver chave</strong><small>Guarde a chave na posição correta e registre a devolução.</small></button></div><p class="kiosk-note">Atendimento realizado por você, sem intermediário. Sua sessão será encerrada ao concluir ou após 90 segundos sem interação. O painel não abre o armário automaticamente.</p>`;
 root.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>login(button.dataset.action));focus();
}
async function reset(reason=''){
 if(ending)return;ending=true;clear();root.innerHTML='<p role="status">Encerrando o atendimento…</p>';
 try{await request({op:'logout'});home();if(reason)message(reason)}catch{root.innerHTML='<div class="kiosk-login"><h1>Painel temporariamente indisponível</h1><p>Não foi possível confirmar o encerramento da sessão anterior. Verifique a conexão e tente novamente.</p><button type="button" id="kiosk-retry">Preparar painel novamente</button></div>';root.querySelector('button').onclick=()=>reset()}finally{ending=false}
}
function login(action){
 clear();const version=generation;
 root.innerHTML=`<form class="kiosk-login" autocomplete="off"><span class="kiosk-eyebrow">${action==='retirada'?'Retirada':'Devolução'} · Identificação</span><h1>Entre com sua conta docente</h1><p class="small">Somente suas chaves serão exibidas. Não use conta de coordenação ou senha mestre neste painel.</p><label>Usuário<input name="login" required autocapitalize="none" spellcheck="false" autocomplete="off" maxlength="40"></label><label>Senha<input name="password" type="password" required autocomplete="off"></label><button type="submit">Entrar e continuar</button><button type="button" class="secondary" data-cancel>Voltar ao início</button></form>`;
 const form=root.querySelector('form');form.querySelector('[data-cancel]').onclick=()=>reset();
 form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;message('');
  try{const values=Object.fromEntries(new FormData(form));const result=await request({op:'login',...values});values.password='';if(version!==generation){await request({op:'logout'});return}form.reset();clearTimeout(loginTimer);await session(action,result.user,version)}catch(error){if(version===generation){message(error.status?error.message:'Sem conexão. Verifique a rede e tente novamente.',true);form.elements.password.value='';form.elements.password.focus()}}finally{busy=false;if(button.isConnected)button.disabled=false}
 };
 loginTimer=setTimeout(()=>reset('Identificação cancelada por inatividade.'),IDLE_MS);
 root.querySelector('input').focus();
}
async function session(action,user,version){
 if(version!==generation)return;active=true;started=touched=Date.now();
 root.innerHTML=`<div class="kiosk-session"><div><span class="kiosk-eyebrow">Autoatendimento · ${esc(user.nome)}</span><h1>${action==='retirada'?'Retirar chave':'Devolver chave'}</h1><p id="kiosk-session-time" role="status">Sua sessão será encerrada após 90 segundos sem interação.</p></div><button type="button" class="secondary" id="kiosk-end">Encerrar atendimento</button></div><div id="key-content"></div>`;
 root.querySelector('#kiosk-end').onclick=()=>reset('Atendimento encerrado.');
 const api=async body=>{try{return await request(body)}catch(error){if(error.status===401)void reset('Sessão encerrada. Identifique-se novamente.');throw error}};
 const stop=await attachKeyControl({api,manage:false,esc,environments:[],workflow:action,terminal:true,message,onSigned:complete});
 if(version!==generation){stop();return}cleanup=stop;
 const empty=root.querySelector('.key-empty');if(empty)empty.textContent=action==='retirada'?'Nenhuma chave liberada para retirada hoje. Confira sua alocação com a gestão.':'Você não possui chave pendente de devolução.';
 root.querySelector('.key-list-heading h3').textContent=action==='retirada'?'Chaves liberadas para hoje':'Suas chaves em uso';focus();
}
async function complete(receipt){
 clear();ending=true;root.innerHTML='<p role="status">Movimentação registrada. Encerrando sua sessão…</p>';
 try{
  await request({op:'logout'});
  root.innerHTML=`<div class="kiosk-complete"><span class="kiosk-symbol" aria-hidden="true">✓</span><h1>${receipt.action==='retirada'?'Retirada registrada':'Devolução registrada'}</h1><p><strong>${esc(receipt.keyCode)} · ${esc(receipt.ambienteNome)}</strong></p><p>${receipt.action==='retirada'?'Agora retire a chave conferida e mantenha-a sob sua responsabilidade até a devolução.':'Confira se a chave ficou na posição correta antes de sair.'}</p><p class="small">Sua sessão foi encerrada. O painel voltará ao início em 10 segundos.</p><button type="button" id="kiosk-finish">Concluir e voltar ao início</button></div>`;
  root.querySelector('button').onclick=()=>{clear();home()};completionTimer=setTimeout(()=>{clear();home()},10_000);focus();
 }catch{root.innerHTML='<div class="kiosk-complete"><h1>Movimentação já registrada</h1><p>Não repita a assinatura. Não foi possível confirmar o encerramento da sessão. Verifique a conexão e tente encerrar novamente.</p><button type="button" id="kiosk-retry">Encerrar sessão e preparar painel</button></div>';root.querySelector('button').onclick=()=>reset()}finally{ending=false}
}
const touch=event=>{if(!event.isTrusted)return;if(active)touched=Date.now();else if(root.querySelector('form.kiosk-login')){clearTimeout(loginTimer);loginTimer=setTimeout(()=>reset('Identificação cancelada por inatividade.'),IDLE_MS)}};for(const name of ['pointerdown','keydown','input'])document.addEventListener(name,touch,{passive:true});
setInterval(()=>{
 if(!active||ending)return;const remaining=Math.min(IDLE_MS-(Date.now()-touched),MAX_MS-(Date.now()-started));
 if(remaining<=0){void reset('Sessão encerrada por tempo de uso. Identifique-se novamente.');return}
 const label=root.querySelector('#kiosk-session-time');if(label){label.classList.toggle('kiosk-session-warning',remaining<=20_000);label.textContent=remaining<=20_000?`Sessão encerra em ${Math.ceil(remaining/1000)} segundos. Toque para continuar.`:'Encerramento após 90 segundos sem interação; duração máxima de 5 minutos.'}
},1000);
document.querySelector('#kiosk-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{message('Use a opção de tela cheia do navegador.',true)}};
window.addEventListener('pagehide',()=>{cleanup?.();navigator.sendBeacon('/api?kiosk=1',new Blob([JSON.stringify({op:'logout'})],{type:'application/json'}))});
void reset();
