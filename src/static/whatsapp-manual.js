/* Envio assistido: apenas abre a conversa; nunca registra entrega. */
window.SENAI_WHATSAPP=(()=>{
 const drafts=new Map();
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function phone(value){
  const raw=String(value||'').trim();
  if(!/^[+\d\s().-]+$/.test(raw))return '';
  let n=raw.replace(/\D/g,'');
  if(!raw.startsWith('+')&&(n.length===10||n.length===11))n='55'+n;
  if(!/^[1-9]\d{7,14}$/.test(n))return '';
  if(n.startsWith('55')&&!/^55[1-9]\d[2-9]\d{7,8}$/.test(n))return '';
  if(!raw.startsWith('+')&&!n.startsWith('55'))return '';
  return n;
 }
 function link(number,message){const n=phone(number),m=String(message||'').trim();return n&&m&&m.length<=2000?'https://wa.me/'+n+'?text='+encodeURIComponent(m):''}
 function render(id,label,docentes,lines=[]){
  const key=String(id),d=drafts.get(key)||{phone:'',text:`Olá! Aviso da turma ${label}:\n${lines.length?lines.join('\n'):'Escreva aqui o comunicado para o docente.'}`.slice(0,2000)};drafts.set(key,d);
  return `<section class="panel" data-wa-panel="${escape(key)}"><h2>Enviar pelo WhatsApp</h2><p class="small muted">Prepare o aviso e confira o destinatário. A conversa abre no aplicativo ou no WhatsApp Web; você confirma o envio. Não exige configuração de API.</p><div class="grid2"><label class="f">Docente<select data-wa="recipient" aria-label="Destinatário do WhatsApp"><option value="">Escolher docente ou informar outro número</option>${docentes.map(x=>`<option value="${escape(x.tel||'')}" ${phone(x.tel)?'':'disabled'}>${escape(x.nome)}${phone(x.tel)?'':' — telefone ausente ou inválido'}</option>`).join('')}</select></label><label class="f">Telefone com DDD<input data-wa="phone" aria-label="Telefone do WhatsApp" type="tel" maxlength="25" placeholder="(11) 99999-9999" value="${escape(d.phone)}"><span class="small muted">Brasil: DDD e número. Exterior: +código do país e número.</span></label></div><label class="f">Mensagem para WhatsApp<textarea data-wa="text" aria-label="Mensagem para WhatsApp" maxlength="2000" rows="5">${escape(d.text)}</textarea></label><p class="small muted" data-wa-status role="status"></p><a class="btn pri" data-wa-open target="_blank" rel="noopener noreferrer">Abrir conversa no WhatsApp</a><p class="small muted">Abrir a conversa não registra o aviso como enviado nem altera o envio automático.</p></section>`;
 }
 function update(panel){
  const number=panel.querySelector('[data-wa=phone]').value,text=panel.querySelector('[data-wa=text]').value;
  drafts.set(panel.dataset.waPanel,{phone:number,text});const url=link(number,text),a=panel.querySelector('[data-wa-open]');
  if(url)a.href=url;else a.removeAttribute('href');a.setAttribute('aria-disabled',String(!url));a.tabIndex=url?0:-1;
  panel.querySelector('[data-wa-status]').textContent=url?'Pronto para abrir a conversa.':!phone(number)?'Informe um telefone válido para continuar.':'Escreva uma mensagem para continuar.';
 }
 document.addEventListener('input',e=>{const p=e.target.closest('[data-wa-panel]');if(p&&e.target.matches('[data-wa]'))update(p)});
 document.addEventListener('change',e=>{const p=e.target.closest('[data-wa-panel]');if(p&&e.target.matches('[data-wa=recipient]')){p.querySelector('[data-wa=phone]').value=e.target.value;update(p)}});
 document.addEventListener('click',e=>{const a=e.target.closest('[data-wa-open]');if(a&&!a.hasAttribute('href'))e.preventDefault()});
 new MutationObserver(()=>document.querySelectorAll('[data-wa-panel]:not([data-wa-ready])').forEach(p=>{p.dataset.waReady='1';update(p)})).observe(document.documentElement,{childList:true,subtree:true});
 return {phone,link,render};
})();
