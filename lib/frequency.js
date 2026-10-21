import {randomUUID} from 'node:crypto';

const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
const localDate=at=>new Date(Date.parse(at)-3*3600000).toISOString().slice(0,10);
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const hm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const minutes=at=>{const d=new Date(Date.parse(at)-3*3600000);return d.getUTCHours()*60+d.getUTCMinutes()+d.getUTCSeconds()/60};
const stamp=()=>new Date().toISOString();
const teachers=docs=>docs.geral?.docentes||[];
export const hourly=d=>String(d?.vinculo||'').toLowerCase()==='horista';
export function unionPeriods(periods){
 const out=[];for(const [start,end] of periods.filter(p=>p[1]>p[0]).sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&start<=last[1])last[1]=Math.max(last[1],end);else out.push([start,end])}return out;
}
function review(sheet,action,by,detail){sheet.audit.push({id:randomUUID(),at:stamp(),by,action,detail});}
function reopen(sheet,by,detail){if(['submitted','validated'].includes(sheet.status)){sheet.status='draft';sheet.validation=null;sheet.submission=null;review(sheet,'reaberta',by,detail)}}
async function load(q,id){const row=(await q('SELECT data,rev FROM frequency_sheets WHERE id=?',[id])).rows[0];return row?{sheet:JSON.parse(String(row.data)),rev:Number(row.rev)}:null;}
async function store(q,sheet,rev){
 const data=JSON.stringify(sheet);if(data.length>2_000_000)fail('Limite de registros deste mês atingido.',409);
 if(rev===0){await q('INSERT INTO frequency_sheets(id,data,rev) VALUES(?,?,1)',[sheet.id,data]);return 1}
 const changed=await q('UPDATE frequency_sheets SET data=?,rev=rev+1 WHERE id=? AND rev=?',[data,sheet.id,rev]);if(!changed.rowsAffected)fail('A frequência mudou. Atualize antes de continuar.',409);return rev+1;
}
function blank(teacher,month){return {id:teacher.id+'/'+month,teacherId:teacher.id,month,teacher:{nome:teacher.nome,matricula:teacher.matricula||'',unidade:teacher.unidade||'',vinculo:teacher.vinculo},coordinator:teacher.coordenadorFrequencia||'',status:'draft',sources:[],adjustments:{},audit:[],submission:null,validation:null};}
export function frequencyDays(sheet){
 const dates=[...new Set([...sheet.sources.map(s=>s.date),...Object.keys(sheet.adjustments)])].sort();
 return dates.map(date=>{
  const sources=sheet.sources.filter(s=>s.date===date),adjustment=sheet.adjustments[date];
  const raw=unionPeriods(sources.filter(s=>s.end!=null).map(s=>[s.start,s.end]));
  const periods=adjustment?adjustment.periods:raw;
  const open=sources.some(s=>s.end==null&&(!adjustment||!s.returnAt)),tooMany=periods.length>2,staleAdjustment=!!adjustment?.stale;
  return {date,sources,periods,raw,open,tooMany,staleAdjustment,adjustment:adjustment||null,minutes:periods.reduce((n,p)=>n+p[1]-p[0],0),note:adjustment?.note||[...new Set(sources.map(s=>s.disciplina+' · '+s.turma))].join('; ')};
 });
}
function present(sheet,rev){const days=frequencyDays(sheet);return {...sheet,rev,days,totalMinutes:days.reduce((n,d)=>n+d.minutes,0),pending:days.filter(d=>d.open||d.tooMany||d.staleAdjustment).length};}

// Called inside the same transaction as key_sign. Signed source events stay immutable.
export async function recordKeyFrequency(event,item,{q,docs}){
 const teacher=teachers(docs).find(d=>d.id===event.docenteId);if(!teacher)return;
 const key=JSON.parse(String((await q('SELECT data FROM key_control WHERE id=1')).rows[0]?.data||'{}'));
 const pickup=key.events?.find(e=>e.assignmentId===item.id&&e.action==='retirada');
 if(!pickup)return;
 const initialDate=localDate(pickup.at),initial=await load(q,teacher.id+'/'+initialDate.slice(0,7));
 if(!hourly(teacher)&&!initial?.sheet.sources.some(s=>s.assignmentId===item.id))return;
 const endAt=event.action==='devolucao'?event.at:null;
 if(endAt&&Date.parse(endAt)<Date.parse(pickup.at))fail('Horário de devolução anterior à retirada.',409);
 // Very long returns are retained as evidence, with an unresolved day for human review.
 const duration=endAt?(Date.parse(endAt)-Date.parse(pickup.at))/3600000:0;
 const endDate=endAt&&duration<=48?localDate(endAt):initialDate;
 let date=initialDate;
 for(let index=0;index<4&&date<=endDate;index++){
  const id=teacher.id+'/'+date.slice(0,7),loaded=await load(q,id),sheet=loaded?.sheet||blank(teacher,date.slice(0,7));
  reopen(sheet,event.login,'Nova movimentação de chave após envio ou validação.');
  const sourceId=item.id+'/'+date;
  const source={id:sourceId,assignmentId:item.id,keyCode:item.keyCode,turma:item.turma,disciplina:item.disciplina,date,start:date===initialDate?minutes(pickup.at):0,end:endAt&&duration<=48?(date===endDate?minutes(endAt):1440):null,pickupEventId:pickup.id,returnEventId:endAt?event.id:null,pickupAt:pickup.at,returnAt:endAt,pickupHash:pickup.hash,returnHash:endAt?event.hash:null};
  const previous=sheet.sources.findIndex(s=>s.id===sourceId);if(previous>=0)sheet.sources[previous]=source;else sheet.sources.push(source);
  if(sheet.adjustments[date])sheet.adjustments[date].stale=true;
  // A correction is never silently replaced by a new source event.
  review(sheet,event.action,event.login,{eventId:event.id,assignmentId:item.id,date,requiresReview:duration>48});
  await store(q,sheet,loaded?.rev||0);
  date=new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
 }
}
function authorized(me,teacher,sheet){return me.master||me.role==='docente'&&me.docenteId===teacher?.id||me.role==='coord'&&((sheet&&['submitted','validated'].includes(sheet.status)?sheet.coordinator:teacher?.coordenadorFrequencia)===me.login);}
export async function frequencyOperation(body,me,{q,docs,notify=async()=>{},now=new Date()}){
 if(!me||!['coord','docente'].includes(me.role)||me.kiosk)fail('Sem acesso à frequência de horistas.',403);
 const month=String(body.month||localDate(now.toISOString()).slice(0,7));if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))fail('Mês inválido.');
 const all=teachers(docs),accounts=(await q("SELECT login,nome,role,docente_id FROM users WHERE role IN ('coord','docente')")).rows;
 if(body.op==='frequency_config'){
  const history=(await q('SELECT data FROM frequency_sheets')).rows.map(r=>JSON.parse(String(r.data)));
  for(const old of history)if(!all.some(t=>t.id===old.teacherId))all.push({...old.teacher,id:old.teacherId,coordenadorFrequencia:old.coordinator});
  return {teachers:all.filter(t=>(hourly(t)||history.some(s=>s.teacherId===t.id))&&(authorized(me,t,null)||history.some(s=>s.teacherId===t.id&&authorized(me,t,s)))).map(t=>({id:t.id,nome:t.nome,matricula:t.matricula||'',coordinator:t.coordenadorFrequencia||''})),coordinators:me.master?[{login:'admin',nome:'Coordenação (senha mestre)'},...accounts.filter(a=>a.role==='coord').map(a=>({login:String(a.login),nome:String(a.nome)}))]:[],master:!!me.master};
 }
 const teacherId=String(body.teacherId||me.docenteId||''),id=teacherId+'/'+month,loaded=await load(q,id),teacher=all.find(t=>t.id===teacherId)||(loaded?{...loaded.sheet.teacher,id:teacherId,coordenadorFrequencia:loaded.sheet.coordinator}:null);
 if(!teacher||!authorized(me,teacher,loaded?.sheet))fail('Frequência não autorizada para esta conta.',403);
 if(!hourly(teacher)&&!loaded)fail('Esta frequência está disponível para docentes horistas.',403);
 const sheet=loaded?.sheet||blank(teacher,month),rev=loaded?.rev||0;
 if(!['submitted','validated'].includes(sheet.status))sheet.coordinator=teacher.coordenadorFrequencia||'';
 if(body.op==='frequency_month')return {sheet:present(sheet,rev),canReview:me.role==='coord',isOwner:me.role==='docente'&&me.docenteId===teacherId};
 if(body.op==='frequency_export')return {sheet:present(sheet,rev),export:true};
 if(!Number.isInteger(body.rev)||body.rev!==rev)fail('A frequência mudou. Atualize antes de continuar.',409);
 if(body.op==='frequency_day_edit'){
  if(sheet.status==='validated')fail('Reabra a frequência validada antes de ajustar.',409);
  if(me.role==='docente'&&sheet.status==='submitted')fail('Aguarde a análise da coordenação.',409);
  const date=String(body.date||''),note=String(body.note||'').trim();
  if(!validDate(date)||date.slice(0,7)!==month||date>localDate(now.toISOString()))fail('Informe um dia válido deste mês que já ocorreu.');
  if(note.length<5||note.length>1000)fail('Informe uma justificativa de 5 a 1000 caracteres.');
  if(!Array.isArray(body.periods)||body.periods.length>2||body.periods.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)||n<0||n>1440)||p[1]<=p[0]))fail('Informe até dois períodos de entrada e saída válidos.');
  const periods=body.periods.slice().sort((a,b)=>a[0]-b[0]);if(periods.length===2&&periods[0][1]>periods[1][0])fail('Os períodos não podem se sobrepor.');
  const before=sheet.adjustments[date]||null;sheet.adjustments[date]={periods,note,by:me.login,at:stamp()};
  if(me.role==='coord'){sheet.status='returned';sheet.validation=null;sheet.submission=null;}
  review(sheet,'ajuste',me.login,{date,before,after:sheet.adjustments[date]});
 }else if(body.op==='frequency_submit'){
  if(me.role!=='docente'||me.docenteId!==teacherId)fail('Somente o próprio docente envia sua frequência.',403);
  if(!['draft','returned'].includes(sheet.status))fail('Esta frequência já foi enviada.',409);
  if(month>=localDate(now.toISOString()).slice(0,7))fail('Envie a frequência após o encerramento do mês.',409);
  if(!sheet.coordinator||sheet.coordinator!=='admin'&&!accounts.some(a=>a.role==='coord'&&a.login===sheet.coordinator))fail('Cadastre um coordenador responsável antes de enviar.',409);
  const days=frequencyDays(sheet);if(!days.length||days.some(d=>d.open||d.tooMany||d.staleAdjustment))fail('Resolva devoluções pendentes, ajustes desatualizados e dias com mais de dois períodos antes de enviar.',409);
  if(!teacher.matricula||!teacher.unidade)fail('Complete matrícula e unidade no cadastro docente antes de enviar.',409);
  sheet.teacher={nome:teacher.nome,matricula:teacher.matricula,unidade:teacher.unidade,vinculo:teacher.vinculo};
  sheet.status='submitted';sheet.submission={by:me.login,at:stamp(),consent:'frequencia-v1'};sheet.validation=null;
  if(body.consent!==true)fail('Confirme a conferência dos horários antes de enviar.');
  review(sheet,'enviada',me.login,{coordinator:sheet.coordinator});await notify(sheet.coordinator,'Frequência de '+teacher.nome+' — '+month+' enviada para validação.',sheet.id);
 }else if(body.op==='frequency_review'){
  if(me.role!=='coord')fail('Somente a coordenação responsável valida frequências.',403);
  const note=String(body.note||'').trim();if(note.length<5||note.length>1000)fail('Informe o parecer de 5 a 1000 caracteres.');
  if(body.decision==='reopen'){
   if(sheet.status!=='validated')fail('Somente frequências validadas podem ser reabertas.',409);
   sheet.status='returned';sheet.validation=null;sheet.submission=null;
  }else{
   if(sheet.status!=='submitted')fail('Aguarde o envio do docente para analisar.',409);
   if(!['validate','return'].includes(body.decision))fail('Decisão inválida.');
   if(body.decision==='validate'&&(!sheet.submission||frequencyDays(sheet).some(d=>d.open||d.tooMany||d.staleAdjustment)))fail('Existem registros pendentes.',409);
   sheet.status=body.decision==='validate'?'validated':'returned';sheet.validation=body.decision==='validate'?{by:me.login,name:me.nome,at:stamp(),note}:null;
  }
  review(sheet,body.decision,me.login,{note});
  for(const account of accounts.filter(a=>a.role==='docente'&&a.docente_id===teacherId))await notify(String(account.login),'Frequência '+month+': '+(sheet.status==='validated'?'validada':'devolvida para ajustes')+'. '+note,sheet.id);
 }else fail('Operação de frequência inválida.');
 return {sheet:present(sheet,await store(q,sheet,rev))};
}
