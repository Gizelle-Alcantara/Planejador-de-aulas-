// Aplica o tema antes da primeira pintura e compartilha a preferência do calendário.
(()=>{
 const key='planejador-turma-v1-theme',labels={light:'Claro',dark:'Escuro',auto:'Automático'},next={light:'dark',dark:'auto',auto:'light'},system=matchMedia('(prefers-color-scheme: dark)');
 let mode='light';try{const saved=localStorage.getItem(key);if(labels[saved])mode=saved}catch{}
 function apply(){
  document.documentElement.dataset.theme=mode==='auto'?(system.matches?'dark':'light'):mode;
  const button=document.getElementById('module-theme');if(button){button.textContent='Tema: '+labels[mode];button.setAttribute('aria-label','Alternar tema. Atual: '+labels[mode])}
 }
 apply();
 document.addEventListener('DOMContentLoaded',()=>{apply();document.getElementById('module-theme')?.addEventListener('click',()=>{mode=next[mode];try{localStorage.setItem(key,mode)}catch{}apply()})});
 system.addEventListener('change',()=>{if(mode==='auto')apply()});
 addEventListener('storage',event=>{if(event.key===key||event.key===null){mode=labels[event.newValue]?event.newValue:'light';apply()}});
})();
