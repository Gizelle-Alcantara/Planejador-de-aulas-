export function attachEnvironmentImport({api,load,message,esc}){
 const form=document.querySelector('#environment-import-form');if(!form)return;
 const file=form.querySelector('[type=file]'),preview=document.querySelector('#environment-import-preview'),feedback=document.querySelector('#environment-import-feedback'),apply=document.querySelector('#environment-import-apply');
 let ready=null,busy=false;
 const setBusy=value=>{busy=value;form.querySelectorAll('button,input').forEach(e=>e.disabled=value);apply.disabled=value||!ready||ready.errors.length>0};
 file.onchange=()=>{ready=null;preview.replaceChildren();feedback.textContent='';setBusy(false)};
 form.onsubmit=async e=>{e.preventDefault();if(busy)return;ready=null;preview.replaceChildren();const selected=file.files[0];
  if(!selected||!selected.name.toLowerCase().endsWith('.xlsx')||selected.size>2*1024*1024){feedback.textContent='Selecione um arquivo .xlsx de até 2 MB.';setBusy(false);return}
  setBusy(true);feedback.textContent='Conferindo a planilha…';
  try{const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Não foi possível ler o arquivo.'));reader.readAsDataURL(selected)}),result=await api({op:'environment_import_preview',file:encoded});ready={...result,file:encoded};
   feedback.textContent=`Aba ${result.sheet}: ${result.created} novo(s), ${result.updated} para atualizar e ${result.unchanged} sem alteração.${result.errors.length?' Corrija os erros no Excel e envie novamente.':' Confira a prévia e confirme para gravar.'}`;
   preview.innerHTML=`${result.errors.length?`<ul class="import-errors">${result.errors.map(error=>`<li>${esc(error)}</li>`).join('')}</ul>`:''}<div class="scroll import-scroll"><table><thead><tr><th>Linha</th><th>Nome</th><th>Tipo</th><th>Capacidade</th><th>Disponibilidade</th><th>Resultado</th></tr></thead><tbody>${result.rows.map(row=>`<tr><td>${row.line}</td><td>${esc(row.nome)}</td><td>${esc(row.tipo)}</td><td>${esc(row.capacidade)}</td><td>${row.ativo?'Disponível':'Indisponível'}</td><td>${row.errors.length?esc(row.errors.join(' ')):esc(row.action)}</td></tr>`).join('')}</tbody></table></div>`;
  }catch(error){feedback.textContent=error.message;ready=null}finally{setBusy(false)}
 };
 apply.onclick=async()=>{if(busy||!ready||ready.errors.length)return;setBusy(true);feedback.textContent='Importando ambientes…';
  try{const result=await api({op:'environment_import_apply',file:ready.file,base:ready.base});ready=null;await load();const section=document.querySelector('#environments');section?.scrollIntoView({behavior:'instant',block:'start'});message(`Importação concluída: ${result.created} ambiente(s) criado(s), ${result.updated} atualizado(s) e ${result.unchanged} sem alteração.`)}
  catch(error){feedback.textContent=error.message;ready=null}finally{setBusy(false)}
 };
}
