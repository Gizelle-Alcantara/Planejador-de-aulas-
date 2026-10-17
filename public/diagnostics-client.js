// Telemetria local da equipe: somente categorias fixas, sem mensagens, URLs ou conteúdo.
(()=>{
 const original=window.fetch.bind(window),pending=new Map();let enabled=null,busy=false,sent=0,start=Date.now(),retryAt=0;
 const operations=new Set(['load','api','ui','xlsx','docente-xlsx','turma-preview','docente-preview','ics','cron','set','set_many','delete','restore','environment_save','reservation_request','reservation_decide','reservation_cancel','reservation_reschedule','planning_preview','planning_apply','management_report','backup_now','backup_download','backup_restore','notify_send','notify_preview','email','whatsapp','recovery_email','password_reset_request','password_reset_confirm']);
 function enqueue(event,operation='ui'){
  if(enabled===false)return;
  const safe=operations.has(operation)?operation:'api',key=event+':'+safe;
  if(pending.size<10||pending.has(key))pending.set(key,{op:'diagnostics_client',event,operation:safe});
  flush();
 }
 async function flush(){
  if(!enabled||busy||!navigator.onLine||Date.now()<retryAt)return;
  if(Date.now()-start>10*60*1000){sent=0;start=Date.now()}
  if(sent>=10)return;busy=true;
  try{
   for(const [key,payload] of pending){
    if(sent>=10)break;
    const response=await original('/api',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if([401,403].includes(response.status)){enabled=false;pending.clear();break}
    if(response.status===429){retryAt=Date.now()+10*60*1000;break}
    if(response.status>=500)break;
    pending.delete(key);sent++;
   }
  }catch{/* A fila fica somente na memória e será tentada quando a conexão voltar. */}finally{busy=false}
 }
 async function authorize(useSession=true){try{
  const user=useSession&&window.PLAN?await PLAN.me():(await(await original('/api',{credentials:'same-origin',cache:'no-store'})).json()).user;
  enabled=['coord','docente','ambientes'].includes(user?.role);if(enabled)flush();else pending.clear();
 }catch{enabled=false;pending.clear()}}
 function operationOf(args){
  const input=args[0],url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.origin);
  if(url.origin!==location.origin||url.pathname!=='/api')return null;
  if(typeof args[1]?.body==='string')return JSON.parse(args[1].body)?.op||'api';
  return url.searchParams.get('export')||(url.searchParams.has('ics')?'ics':'load');
 }
 window.fetch=async(...args)=>{
  let operation;try{operation=operationOf(args)}catch{}
  try{
   const response=await original(...args);
   if(response.ok&&['login','student_login'].includes(operation)){enabled=null;authorize(false)}
   if(response.ok&&operation==='logout'){enabled=false;pending.clear()}
   return response;
  }catch(error){
   try{
    if(operation&&!String(operation).startsWith('diagnostics_'))enqueue('network',operation);
   }catch{}
   throw error;
  }
 };
 window.addEventListener('error',event=>{if(event.error)enqueue('script')});
 window.addEventListener('unhandledrejection',()=>enqueue('promise'));
 window.addEventListener('online',flush);setInterval(flush,30000);
 authorize();
})();
