// Regras do cadastro e projeção das aulas; não altera o calendário da coordenação.
import { blocksForDay } from "./schedule.js";
export function environmentRemovalError(docs,items,date){
 const remaining=new Set(items.map(a=>a.id)),removed=(docs.ambientes?.items||[]).filter(a=>!remaining.has(a.id));
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
 for(const env of removed){
  if((docs.reservas?.items||[]).some(r=>r.ambienteId===env.id&&r.data>=date&&['pendente','aprovada','revisao'].includes(r.status)))return `Não é possível excluir ${env.nome}: existem reservas atuais ou futuras. Cancele ou reagende as reservas antes de excluir.`;
  if((docs.bloqueios?.items||[]).some(b=>b.ambienteId===env.id&&b.ate>=date))return `Não é possível excluir ${env.nome}: existem bloqueios atuais ou futuros. Remova os bloqueios antes de excluir.`;
  for(const [id,doc] of Object.entries(docs))if(id.startsWith('turma-')&&doc.state)for(const day of Object.keys(doc.state.days||{}).filter(d=>d>=date))for(const b of blocksForDay(doc.state,day)){
   const uc=doc.state.ucs?.find(u=>u.sigla===b.sigla);
   if(!b.ead&&uc&&norm(uc.sala||doc.state.cfg?.local)===norm(env.nome))return `Não é possível excluir ${env.nome}: há aulas presenciais atuais ou futuras vinculadas. Altere a sala das disciplinas antes de excluir.`;
  }
 }
 return '';
}
export function validateEnvironments(items) {
  if (!Array.isArray(items) || items.length > 500) return { error: "Informe até 500 ambientes." };
  const names = new Set(), ids = new Set(), clean = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return { error: "Ambiente inválido." };
    const id = String(item.id || ""), nome = String(item.nome || "").trim(), tipo = item.tipo;
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || !nome || nome.length > 100 || !["sala", "laboratorio"].includes(tipo)) return { error: "Preencha identificador, nome e tipo válidos." };
    if (!Number.isInteger(item.capacidade) || item.capacidade < 1 || item.capacidade > 1000 || typeof item.ativo !== "boolean") return { error: "Capacidade deve ser de 1 a 1000; informe a disponibilidade." };
    const key = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
    if (ids.has(id) || names.has(key)) return { error: "Há identificadores ou nomes de ambientes repetidos." };
    names.add(key); ids.add(id);
    clean.push({ id, nome, tipo, capacidade: item.capacidade, ativo: item.ativo });
  }
  return { items: clean };
}
export function teacherLessons(docs, docente) {
  if (!docente) return [];
  const items = [];
  for (const [id, doc] of Object.entries(docs)) {
    if (!id.startsWith("turma-") || !doc?.state?.cfg) continue;
    const s = doc.state;
    for (const [data, day] of Object.entries(s.days || {})) {
      for (const {sigla,inicio,fim,bloco,aulas,quantidade,ead} of blocksForDay(s,data)) {
        if(ead)continue;
        const uc = (s.ucs || []).find(u => u.sigla === sigla && u.docente === docente);
        if (uc) items.push({ turmaId: id, turma: s.cfg.turma, curso: s.cfg.curso, data, sigla, disciplina: uc.nome, ambiente: uc.sala || "", inicio, fim, bloco, aulas, quantidade });
      }
    }
  }
  return items.sort((a,b) => a.data.localeCompare(b.data) || a.inicio-b.inicio);
}
