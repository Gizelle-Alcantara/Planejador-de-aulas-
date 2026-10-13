import { randomUUID } from 'node:crypto';
import { teacherLessons } from './environments.js';
import { span } from './ics.js';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const overlap=(a,b)=>a.inicio<b.fim&&b.inicio<a.fim;
const today=()=>new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
export function reservationChange(docs, items, body, me) {
  const fail=(error,status=400)=>({error,status});
  const when=new Date().toISOString(), by=me.nome||me.login;
  let item;
  if(body.op==='reservation_request') {
    if(me.role!=='docente'||!me.docente) return fail('Entre com uma conta de docente vinculada.',403);
    const lesson=teacherLessons(docs,me.docente).find(l=>l.turmaId===body.turmaId&&l.data===body.data&&l.sigla===body.sigla);
    if(!lesson||lesson.data<today())return fail('Selecione uma aula atual ou futura do seu calendário.');
    const ambiente=docs.ambientes?.items?.find(a=>a.id===body.ambienteId&&a.ativo);
    if(!ambiente)return fail('Ambiente inexistente ou indisponível.');
    const finalidade=String(body.finalidade||'').trim();
    if(!finalidade||finalidade.length>1000)return fail('Informe a finalidade (até 1000 caracteres).');
    if(items.some(r=>['pendente','aprovada'].includes(r.status)&&r.turmaId===lesson.turmaId&&r.data===lesson.data&&r.sigla===lesson.sigla))return fail('Esta aula já possui uma solicitação ativa.',409);
    item={...lesson,id:randomUUID(),ambienteId:ambiente.id,ambienteNome:ambiente.nome,docente:me.docente,login:me.login,finalidade,status:'pendente',criadaEm:when,historico:[{status:'pendente',em:when,por:by}]};
  }else{
    const old=items.find(r=>r.id===body.id);
    if(!old)return fail('Reserva não encontrada.',404);
    if(body.op==='reservation_cancel') {
      if(me.role!=='coord'&&old.login!==me.login)return fail('Sem permissão para cancelar esta reserva.',403);
      if(!['pendente','aprovada'].includes(old.status))return fail('Esta reserva já foi encerrada.',409);
      item={...old,status:'cancelada'};
    }else{
      if(me.role!=='coord')return fail('Somente a coordenação decide solicitações.',403);
      if(old.status!=='pendente')return fail('Esta solicitação já foi decidida.',409);
      if(!['aprovada','recusada'].includes(body.status))return fail('Decisão inválida.');
      const motivo=String(body.motivo||'').trim();
      if(motivo.length>1000||body.status==='recusada'&&!motivo)return fail('Informe o motivo da recusa (até 1000 caracteres).');
      item={...old,status:body.status,motivo};
      if(body.status==='aprovada') {
        const lesson=teacherLessons(docs,old.docente).find(l=>l.turmaId===old.turmaId&&l.data===old.data&&l.sigla===old.sigla);
        const ambiente=docs.ambientes?.items?.find(a=>a.id===old.ambienteId&&a.ativo);
        if(!lesson||lesson.data<today()||lesson.inicio!==old.inicio||lesson.fim!==old.fim)return fail('A aula mudou ou não está mais disponível. Recuse e solicite um novo pedido.',409);
        if(!ambiente)return fail('Ambiente indisponível.',409);
        item.ambienteNome=ambiente.nome;
      }
    }
    item.historico=[...old.historico,{status:item.status,em:when,por:by,motivo:item.motivo||''}];
  }
  if(['pendente','aprovada'].includes(item.status)) {
    if(items.some(r=>r.id!==item.id&&r.status==='aprovada'&&r.ambienteId===item.ambienteId&&r.data===item.data&&overlap(r,item)))return fail('O ambiente já possui uma reserva aprovada neste horário.',409);
    for(const [id,doc] of Object.entries(docs)) {
      const s=doc?.state;if(!id.startsWith('turma-')||!s?.cfg)continue;
      const day=s.days?.[item.data];if(!day||day.t||s.reg?.[item.data]?.dado==='nao')continue;
      const [inicio,fim]=span(s.cfg);if(!overlap(item,{inicio,fim}))continue;
      for(const sg of day.s||[]) {
        if(id===item.turmaId&&sg===item.sigla)continue;
        const uc=s.ucs?.find(u=>u.sigla===sg);
        const a=docs.ambientes?.items?.find(a=>a.id===item.ambienteId);
        if(norm(uc?.sala||s.cfg.local)&&norm(uc?.sala||s.cfg.local)===norm(a?.nome))return fail(`Ambiente ocupado no calendário pela turma ${s.cfg.turma}.`,409);
      }
    }
  }
  return {items:body.op==='reservation_request'?[...items,item]:items.map(r=>r.id===item.id?item:r),item};
}
