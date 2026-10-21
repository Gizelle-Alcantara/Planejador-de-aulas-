import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {teacherLessons} from './environments.js';
import {manager,today,overlap,reservationChange} from './reservations.js';

const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const own=(a,me)=>!!me.docenteId&&a.docenteId===me.docenteId;
const summary=e=>{const {signature,...rest}=e;return rest};
export function checkedSignature(value){
 if(!Array.isArray(value)||!value.length||value.length>80)fail('Desenhe sua assinatura antes de confirmar.');
 let count=0;const points=[];
 const strokes=value.map(stroke=>{if(!Array.isArray(stroke)||stroke.length<2||stroke.length>1000)fail('Assinatura inválida.');return stroke.map(p=>{if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))fail('Assinatura inválida.');if(++count>4000)fail('Assinatura muito extensa. Limpe e assine novamente.');const clean=p.map(n=>Math.round(n*10000)/10000);points.push(clean);return clean})});
 if(count<8||Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))<.08||Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))<.03)fail('Desenhe uma assinatura completa.');
 return strokes;
}
export async function keyControl(body,me,{q,docs,saveReservation,notify}){
 if(!manager(me)&&me.role!=='docente')fail('Sem acesso ao controle de chaves.',403);
 const state=JSON.parse(String((await q("SELECT data FROM key_control WHERE id=1")).rows[0]?.data||'{"keys":[],"assignments":[],"events":[]}'));
 const save=async()=>{await q('INSERT INTO key_control(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[JSON.stringify(state)])};
 const visible=a=>manager(me)||own(a,me);
 const present=a=>({...a,docente:docs.geral?.docentes?.find(d=>d.id===a.docenteId)?.nome||a.docente});
 const keyOf=token=>{if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail('QR code de chave inválido.');const key=state.keys.find(k=>k.token===token);if(!key)fail('Chave não encontrada. Confira o QR code.',404);return key};
 if(body.op==='key_list'){
  const date=body.date||today();if(!/^\d{4}-\d{2}-\d{2}$/.test(date))fail('Data inválida.');
  const items=state.assignments.filter(a=>visible(a)&&(a.data===date||a.status==='retirada'||!manager(me)&&body.upcoming===true&&a.status==='alocada'&&a.data>=today())).map(a=>({...present(a),events:state.events.filter(e=>e.assignmentId===a.id).map(summary)}));
  return {items,keys:manager(me)?state.keys.map(k=>({...k,holder:state.assignments.find(a=>a.keyId===k.id&&a.status==='retirada')?.docente||null})):[],date};
 }
 if(body.op==='key_create'){
  if(!manager(me))fail('Somente a gestão cadastra chaves.',403);
  const code=String(body.code||'').trim(),env=docs.ambientes?.items?.find(a=>a.id===body.ambienteId&&a.ativo);
  if(!code||code.length>60||!env)fail('Informe uma identificação de até 60 caracteres e um ambiente habilitado.');
  if(state.keys.some(k=>k.code.toLocaleLowerCase('pt-BR')===code.toLocaleLowerCase('pt-BR')))fail('Esta identificação de chave já existe.',409);
  if(state.keys.length>=500)fail('Limite de 500 chaves atingido.');
  const key={id:randomUUID(),code,ambienteId:env.id,ambienteNome:env.nome,token:randomBytes(32).toString('hex'),active:true,createdAt:new Date().toISOString(),createdBy:me.login};
  state.keys.push(key);await save();return {key};
 }
 if(body.op==='key_toggle'){
  if(!manager(me))fail('Somente a gestão altera chaves.',403);const key=state.keys.find(k=>k.id===body.id);if(!key)fail('Chave não encontrada.',404);
  if(state.assignments.some(a=>a.keyId===key.id&&['alocada','retirada'].includes(a.status)))fail('Encerre as alocações e devoluções pendentes antes de alterar a chave.',409);
  key.active=!key.active;await save();return {ok:true};
 }
 if(body.op==='key_allocate'){
  if(!manager(me))fail('Somente a gestão aloca docentes aos ambientes.',403);
  const key=state.keys.find(k=>k.id===body.keyId&&k.active),teacher=docs.geral?.docentes?.find(d=>d.nome===body.docente);
  if(!key||!teacher?.id)fail('Selecione uma chave ativa e um docente cadastrado.');
  const account=(await q("SELECT login FROM users WHERE role='docente' AND docente_id=? ORDER BY login LIMIT 1",[teacher.id])).rows[0];
  if(!account)fail('Vincule uma conta de acesso a este docente na aba Acesso antes de alocar a chave.');
  const lesson=teacherLessons(docs,teacher.nome).find(l=>l.turmaId===body.turmaId&&l.data===body.data&&l.sigla===body.sigla&&l.bloco===body.bloco);
  if(!lesson||lesson.data<today())fail('Selecione uma aula presencial atual ou futura.');
  if(state.assignments.some(a=>['alocada','retirada'].includes(a.status)&&a.data===lesson.data&&((a.keyId===key.id&&overlap(a,lesson))||(a.turmaId===lesson.turmaId&&a.sigla===lesson.sigla&&a.bloco===lesson.bloco))))fail('A chave ou a aula já possui uma alocação ativa neste período.',409);
  const reservations=docs.reservas?.items||[],existing=reservations.find(r=>r.status==='aprovada'&&r.docente===teacher.nome&&r.turmaId===lesson.turmaId&&r.data===lesson.data&&r.sigla===lesson.sigla&&r.bloco===lesson.bloco&&r.ambienteId===key.ambienteId);
  let reservation=existing;
  if(!reservation){const change=reservationChange(docs,reservations,{...lesson,op:'key_assignment',docente:teacher.nome,ambienteId:key.ambienteId,finalidade:'Alocação de ambiente e controle de chaves'}, {...me,reservationLogin:String(account.login)});if(change.error)fail(change.error,change.status);await saveReservation(change);reservation=change.item}
  if(state.assignments.length>=10000)fail('Limite de alocações atingido.');
  const item={...lesson,id:randomUUID(),keyId:key.id,keyCode:key.code,ambienteId:key.ambienteId,ambienteNome:key.ambienteNome,docente:teacher.nome,docenteId:teacher.id,reservationId:reservation.id,status:'alocada',createdAt:new Date().toISOString(),createdBy:me.login};
  state.assignments.push(item);await save();await notify(item);return {item};
 }
 if(body.op==='key_cancel'){
  if(!manager(me))fail('Somente a gestão cancela alocações.',403);const item=state.assignments.find(a=>a.id===body.id);if(!item)fail('Alocação não encontrada.',404);
  if(item.status!=='alocada')fail('Somente uma alocação ainda não retirada pode ser cancelada.',409);
  item.status='cancelada';item.cancelledAt=new Date().toISOString();item.cancelledBy=me.login;await save();return {ok:true};
 }
 if(body.op==='key_terminal_prepare'){
  if(!me.kiosk||me.role!=='docente'||!me.docenteId)fail('Identifique-se no terminal com sua conta docente.',403);
  const item=state.assignments.find(a=>a.id===body.id);
  if(!item||!own(item,me))fail('Alocação não encontrada para este docente.',403);
  if(!(item.status==='retirada'||item.status==='alocada'&&item.data===today()))fail('Movimentação indisponível para esta alocação.',409);
  const key=state.keys.find(k=>k.id===item.keyId);
  if(!key||item.status==='alocada'&&!key.active)fail('Chave indisponível.',409);
  return {key:{id:key.id,code:key.code,ambienteNome:key.ambienteNome,token:key.token}};
 }
 if(body.op==='key_scan'){
  const key=keyOf(body.token);return {key:{id:key.id,code:key.code,ambienteNome:key.ambienteNome},items:state.assignments.filter(a=>a.keyId===key.id&&visible(a)&&((a.data===today()&&a.status==='alocada')||a.status==='retirada')).map(present)};
 }
 if(body.op==='key_sign'){
  if(me.role!=='docente'||!me.docenteId)fail('Entre com uma conta vinculada ao docente para assinar.',403);
  const item=state.assignments.find(a=>a.id===body.id);if(!item||!own(item,me))fail('Alocação não encontrada para este docente.',403);
  const key=keyOf(body.token);if(key.id!==item.keyId)fail('O QR code pertence a outra chave.',409);
  const action=body.action;if(!['retirada','devolucao'].includes(action))fail('Movimentação inválida.');
  if(action==='retirada'){
   if(item.status!=='alocada'||item.data!==today())fail('A retirada está disponível somente no dia da aula e para alocações pendentes.',409);
   if(!key.active||state.assignments.some(a=>a.keyId===key.id&&a.status==='retirada'))fail('Esta chave já foi retirada ou está indisponível.',409);
   const current=teacherLessons(docs,me.docente).find(l=>l.turmaId===item.turmaId&&l.data===item.data&&l.sigla===item.sigla&&l.bloco===item.bloco);
   const reservation=docs.reservas?.items?.find(r=>r.id===item.reservationId&&r.status==='aprovada'&&r.ambienteId===item.ambienteId);
   if(!current||current.inicio!==item.inicio||current.fim!==item.fim||!reservation||!docs.ambientes?.items?.some(e=>e.id===item.ambienteId&&e.ativo))fail('A aula ou a reserva mudou. Procure a gestão para atualizar a alocação.',409);
  }else if(item.status!=='retirada')fail('Esta chave não possui retirada pendente de devolução.',409);
  if(body.consent!==true||String(body.name||'').trim()!==me.docente)fail('Confirme seu nome e o aceite da movimentação.');
  const signature=checkedSignature(body.signature),event={id:randomUUID(),assignmentId:item.id,keyId:key.id,keyCode:key.code,ambienteNome:item.ambienteNome,turma:item.turma,disciplina:item.disciplina,turmaId:item.turmaId,sigla:item.sigla,bloco:item.bloco,inicio:item.inicio,fim:item.fim,reservationId:item.reservationId,data:item.data,action,login:me.login,docenteId:me.docenteId,name:me.docente,at:new Date().toISOString(),consent:'chaves-v1',signature,previousHash:state.events.at(-1)?.hash||null};
  event.method=me.kiosk?'terminal':'qr';
  event.hash=hash(event);state.events.push(event);item.status=action==='retirada'?'retirada':'devolvida';item[action==='retirada'?'checkedOutAt':'returnedAt']=event.at;await save();return {receipt:event};
 }
 if(body.op==='key_receipt'){
  const event=state.events.find(e=>e.id===body.id),item=event&&state.assignments.find(a=>a.id===event.assignmentId);
  if(!item||!visible(item))fail('Comprovante não encontrado.',404);return {receipt:event};
 }
 fail('Operação de chaves inválida.');
}
