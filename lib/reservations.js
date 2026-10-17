import { randomUUID } from 'node:crypto';
import { teacherLessons } from './environments.js';
import { blocksForDay } from './schedule.js';
export const manager = me => ['coord','ambientes'].includes(me?.role);
export const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export const overlap = (a,b) => a.inicio<b.fim&&b.inicio<a.fim;
export const today = () => new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
export const active = r => ['pendente','aprovada','revisao'].includes(r.status);
const lessonOf = (docs,r) => teacherLessons(docs,r.docente).find(l=>l.turmaId===r.turmaId&&l.data===r.data&&l.sigla===r.sigla&&(l.bloco===(r.bloco||'dia')||r.bloco==null||r.bloco==='dia'));
export function calendarEntries(docs, date) {
  const entries=[];
  for(const [id,doc] of Object.entries(docs)) {
    const s=doc?.state;if(!id.startsWith('turma-')||!s?.cfg)continue;
    for(const [data,day] of Object.entries(s.days||{})) {
      if(date&&data!==date)continue;
      for(const {sigla:sg,inicio,fim,bloco,aulas,quantidade,ead} of blocksForDay(s,data)) {
        if(ead)continue;
        const u=s.ucs?.find(u=>u.sigla===sg);if(!u)continue;
        const a=docs.ambientes?.items?.find(a=>norm(a.nome)===norm(u.sala||s.cfg.local));
        if(a)entries.push({id:`${id}:${data}:${sg}:${bloco}`,turmaId:id,turma:s.cfg.turma,curso:s.cfg.curso,docente:u.docente||'',sigla:sg,disciplina:u.nome,data,inicio,fim,bloco,aulas,quantidade,ambienteId:a.id,ambienteNome:a.nome,status:'calendario',origem:'Calendário'});
      }
    }
  }
  return entries;
}
export function conflictReason(docs,items,item) {
  const a=docs.ambientes?.items?.find(a=>a.id===item.ambienteId);
  if(!a?.ativo)return 'Ambiente inexistente ou indisponível.';
  if((docs.bloqueios?.items||[]).some(b=>b.ambienteId===item.ambienteId&&b.de<=item.data&&b.ate>=item.data&&overlap(item,b)))return 'Ambiente bloqueado por manutenção ou indisponibilidade neste horário.';
  if(items.some(r=>r.id!==item.id&&r.status==='aprovada'&&r.ambienteId===item.ambienteId&&r.data===item.data&&overlap(r,item)))return 'O ambiente já possui uma reserva aprovada neste horário.';
  if(calendarEntries(docs,item.data).some(e=>e.ambienteId===item.ambienteId&&!(e.turmaId===item.turmaId&&e.sigla===item.sigla)&&overlap(e,item)))return 'Ambiente ocupado por outra aula do calendário.';
  return '';
}
export function synchronize(docs,items,by='Sincronização do calendário') {
  return items.map(r=>{
    if(!['pendente','aprovada'].includes(r.status)||r.data<today())return r;
    const lesson=lessonOf(docs,r);
    let reason=!lesson?'A aula foi removida, cancelada ou teve o docente alterado.':lesson.inicio!==r.inicio||lesson.fim!==r.fim||lesson.ambiente!==r.ambiente||lesson.disciplina!==r.disciplina||lesson.turma!==r.turma||lesson.curso!==r.curso?'Dados da aula foram alterados.':conflictReason(docs,items,r);
    if(!reason)return r;
    return {...r,status:'revisao',motivo:reason,historico:[...(r.historico||[]),{status:'revisao',em:new Date().toISOString(),por:by,motivo:reason}]};
  });
}
export function reservationChange(docs, items, body, me) {
  const fail=(error,status=400)=>({error,status});
  const when=new Date().toISOString(),by=me.nome||me.login;
  let item,old=items.find(r=>r.id===body.id);
  if(['reservation_request','reservation_reschedule','reservation_book'].includes(body.op)) {
    const booking=body.op==='reservation_book';if(booking&&!manager(me))return fail('Somente a gestão de ambientes agenda salas de aula.',403);
    const docente=booking?String(body.docente||''):me.docente;
    if(!booking&&(me.role!=='docente'||!me.docente))return fail('Entre com uma conta de docente vinculada.',403);
    if(body.op==='reservation_reschedule'&&old&&(old.ambienteTipo==='sala'||docs.ambientes?.items?.some(a=>a.id===old.ambienteId&&a.tipo==='sala')))return fail('Somente a gestão de ambientes reagenda salas de aula.',403);
    if(body.op==='reservation_reschedule'&&(!old||old.login!==me.login||!active(old)))return fail('Sem permissão para reagendar esta reserva.',403);
    if(booking&&body.id&&(!old||!active(old)))return fail('Reserva não encontrada ou encerrada.',409);
    const matches=teacherLessons(docs,docente).filter(l=>l.turmaId===body.turmaId&&l.data===body.data&&l.sigla===body.sigla);
    if(matches.length>1&&!body.bloco)return fail('Selecione o bloco de horários da aula.');
    const lesson=matches.find(l=>!body.bloco||l.bloco===body.bloco);
    if(!lesson||lesson.data<today())return fail('Selecione uma aula atual ou futura do seu calendário.');
    const ambiente=docs.ambientes?.items?.find(a=>a.id===body.ambienteId&&a.ativo);
    if(!ambiente)return fail('Ambiente inexistente ou indisponível.');
    if(!booking&&ambiente.tipo==='sala')return fail('Salas de aula são agendadas somente pela gestão de ambientes. Solicite um laboratório ou procure o coordenador de ambientes.',403);
    if(booking&&ambiente.tipo!=='sala')return fail('Selecione uma sala de aula para o agendamento da gestão.');
    const finalidade=String(body.finalidade||'').trim();
    if(!finalidade||finalidade.length>1000)return fail('Informe a finalidade (até 1000 caracteres).');
    if(items.some(r=>r.id!==old?.id&&active(r)&&r.turmaId===lesson.turmaId&&r.data===lesson.data&&r.sigla===lesson.sigla&&overlap(r,lesson)))return fail('Esta aula já possui uma solicitação ativa.',409);
    item={...lesson,id:old?.id||randomUUID(),ambienteId:ambiente.id,ambienteNome:ambiente.nome,docente,docenteId:booking?null:me.docenteId||null,login:booking?(me.reservationLogin||me.login):me.login,ambienteTipo:ambiente.tipo,criadaPelaGestao:booking,finalidade,status:booking?'aprovada':'pendente',motivo:'',criadaEm:old?.criadaEm||when,historico:[...(old?.historico||[]),{status:booking?'aprovada':'pendente',em:when,por:by,motivo:booking?'Agendamento realizado pela gestão de ambientes.':old?'Reagendamento solicitado.':'',anterior:old?{data:old.data,inicio:old.inicio,fim:old.fim,ambienteNome:old.ambienteNome,status:old.status}:undefined}]};
  } else {
    if(!old)return fail('Reserva não encontrada.',404);
    if(!manager(me)&&(old.ambienteTipo==='sala'||docs.ambientes?.items?.some(a=>a.id===old.ambienteId&&a.tipo==='sala')))return fail('Somente a gestão de ambientes altera agendamentos de salas de aula.',403);
    if(body.op==='reservation_cancel') {
      if(!manager(me)&&old.login!==me.login)return fail('Sem permissão para cancelar esta reserva.',403);
      if(!active(old))return fail('Esta reserva já foi encerrada.',409);
      item={...old,status:'cancelada'};
    } else {
      if(!manager(me))return fail('Somente a gestão de ambientes decide solicitações.',403);
      if(old.status!=='pendente'&&!(old.status==='revisao'&&body.status==='recusada'))return fail('Esta solicitação já foi decidida ou precisa de reagendamento.',409);
      if(!['aprovada','recusada'].includes(body.status))return fail('Decisão inválida.');
      const motivo=String(body.motivo||'').trim();
      if(motivo.length>1000||body.status==='recusada'&&!motivo)return fail('Informe o motivo da recusa (até 1000 caracteres).');
      item={...old,status:body.status,motivo};
      if(body.status==='aprovada') {
        const lesson=lessonOf(docs,old);
        if(!lesson||lesson.data<today()||lesson.inicio!==old.inicio||lesson.fim!==old.fim)return fail('A aula mudou ou não está mais disponível. Solicite um reagendamento.',409);
        item.ambienteNome=docs.ambientes?.items?.find(a=>a.id===old.ambienteId)?.nome||old.ambienteNome;
      }
    }
    item.historico=[...(old.historico||[]),{status:item.status,em:when,por:by,motivo:item.motivo||''}];
  }
  if(['pendente','aprovada'].includes(item.status)) {
    const error=conflictReason(docs,items,item);if(error)return fail(error,409);
  }
  return {items:!old?[...items,item]:items.map(r=>r.id===item.id?item:r),item};
}
export function validateBlock(docs,body) {
  const a=docs.ambientes?.items?.find(a=>a.id===body.ambienteId);
  const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  const motivo=String(body.motivo||'').trim();
  if(!a||!date(body.de)||!date(body.ate)||body.de>body.ate||!Number.isInteger(body.inicio)||!Number.isInteger(body.fim)||body.inicio<0||body.fim>1440||body.inicio>=body.fim||!motivo||motivo.length>500)return {error:'Informe ambiente, período, horários e motivo válidos.'};
  return {item:{id:randomUUID(),ambienteId:a.id,ambienteNome:a.nome,de:body.de,ate:body.ate,inicio:body.inicio,fim:body.fim,motivo}};
}
export function dailyBoard(docs,date) {
  const reservations=(docs.reservas?.items||[]).filter(r=>r.data===date&&active(r)).map(r=>({...r,origem:'Reserva'}));
  const calendar=calendarEntries(docs,date).filter(e=>!reservations.some(r=>r.status==='aprovada'&&r.turmaId===e.turmaId&&r.sigla===e.sigla&&r.inicio===e.inicio&&r.fim===e.fim));
  const blocks=(docs.bloqueios?.items||[]).filter(b=>b.de<=date&&b.ate>=date).map(b=>({...b,data:date,status:'bloqueado',origem:'Bloqueio'}));
  return [...reservations,...calendar,...blocks].sort((a,b)=>a.inicio-b.inicio);
}
