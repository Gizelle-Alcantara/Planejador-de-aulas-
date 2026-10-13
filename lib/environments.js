// Regras do cadastro e projeção das aulas; não altera o calendário da coordenação.
import { span } from "./ics.js";
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
    const s = doc.state, [inicio, fim] = span(s.cfg);
    for (const [data, day] of Object.entries(s.days || {})) {
      if (day.t || s.reg?.[data]?.dado === "nao") continue;
      for (const sigla of day.s || []) {
        const uc = (s.ucs || []).find(u => u.sigla === sigla && u.docente === docente);
        if (uc) items.push({ turmaId: id, turma: s.cfg.turma, curso: s.cfg.curso, data, sigla, disciplina: uc.nome, ambiente: uc.sala || "", inicio, fim });
      }
    }
  }
  return items.sort((a,b) => a.data.localeCompare(b.data) || a.inicio-b.inicio);
}
