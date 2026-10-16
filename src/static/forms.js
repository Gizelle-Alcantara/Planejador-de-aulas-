/* Feedback compartilhado para campos com restrições nativas de HTML. */
(()=>{
 let sequence=0;
 const controls='input,select,textarea';
 function errorFor(field){
  const label=field.labels?.[0];if(label&&!field.hasAttribute('aria-label')&&!field.hasAttribute('aria-labelledby'))field.setAttribute('aria-label',(label.querySelector('.field-caption')?.textContent||[...label.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ')).trim());
  if(!field.dataset.errorId)field.dataset.errorId='field-error-'+(++sequence);
  let error=document.getElementById(field.dataset.errorId);
  if(!error){error=document.createElement('span');error.id=field.dataset.errorId;error.className='field-error';error.setAttribute('aria-hidden','true');field.after(error)}
  const descriptions=new Set((field.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));descriptions.add(error.id);field.setAttribute('aria-describedby',[...descriptions].join(' '));return error;
 }
 function explain(field){
  const v=field.validity;
  if(v.customError)return field.validationMessage;
  if(v.valueMissing)return 'Preencha este campo.';
  if(v.typeMismatch)return field.type==='email'?'Informe um e-mail válido.':'Confira o formato informado.';
  if(v.tooShort)return `Use pelo menos ${field.minLength} caracteres.`;
  if(v.rangeUnderflow)return `Informe um valor igual ou maior que ${field.min}.`;
  if(v.rangeOverflow)return `Informe um valor igual ou menor que ${field.max}.`;
  if(v.patternMismatch)return field.title||'Confira o formato informado.';
  return 'Confira o valor informado.';
 }
 function show(field){field.setAttribute('aria-invalid','true');errorFor(field).textContent=explain(field)}
 function clear(field){field.removeAttribute('aria-invalid');const error=document.getElementById(field.dataset.errorId);if(error)error.remove();const ids=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==field.dataset.errorId);if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby')}
 function enhance(){
  document.querySelectorAll('input[required],select[required],textarea[required]').forEach(field=>{
   const label=field.closest('label');
   if(label&&!label.querySelector('.required-marker')){const text=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(!text)return;const caption=document.createElement('span');caption.className='field-caption';text.replaceWith(caption);caption.append(text);const marker=document.createElement('span');marker.className='required-marker';marker.setAttribute('aria-hidden','true');caption.append(marker)}
  });
  document.querySelectorAll('form').forEach(form=>{if(!form.querySelector('[required]')||form.querySelector('.form-hint'))return;const hint=document.createElement('p');hint.className='form-hint';hint.textContent='Campos com * são obrigatórios.';form.prepend(hint)});
 }
 document.addEventListener('invalid',e=>{if(e.target.matches(controls))show(e.target)},true);
 document.addEventListener('input',e=>{const field=e.target;if(!field.matches(controls)||!field.hasAttribute('aria-invalid'))return;if(field.validity.valid)clear(field);else show(field)});
 document.addEventListener('change',e=>{const field=e.target;if(field.matches(controls)&&field.hasAttribute('aria-invalid')){if(field.validity.valid)clear(field);else show(field)}});
 document.addEventListener('reset',e=>{e.target.querySelectorAll('[aria-invalid]').forEach(clear)});
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
