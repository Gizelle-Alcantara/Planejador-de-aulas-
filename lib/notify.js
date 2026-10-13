// Avisos por e-mail (Resend) e WhatsApp (API oficial da Meta). Sem as chaves configuradas, o envio é apenas simulado.
import { blocksForDay } from "./schedule.js";

const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const br = (iso) => iso.split("-").reverse().join("/");
const dow = (iso) => new Date(iso + "T12:00:00Z").getUTCDay();
const hm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const lab = (iso) => `${WD[dow(iso)]}, ${br(iso)}`;
export const todayBR = (now = new Date()) => new Date(now.getTime() - 3 * 3600e3).toISOString().slice(0, 10); // America/Bahia = UTC-3
export const addDay = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ---------- foto do calendário e diferenças ---------- */
export function snapshot(state) {
  const out = {};
  for (const [iso, d] of Object.entries((state && state.days) || {})) {
    if (d.t === "feriado" || d.t === "sem") { out[iso] = "x:" + (d.h || (d.t === "sem" ? "Sem aula" : "Feriado")); continue; }
    const sg = Array.isArray(d.grade)?blocksForDay(state,iso,true).map(b=>`${b.sigla} (${hm(b.inicio)}–${hm(b.fim)})`).join(" + "):(d.s || [])[0]; if (!sg) continue;
    const reg = ((state.reg || {})[iso]) || {};
    out[iso] = reg.dado === "nao" ? "nao:" + sg : (String(d.h || "").startsWith("Reposição") ? "rep:" : "aula:") + sg;
  }
  return out;
}
export function diffLines(base, cur, state, today) {
  const nome = (sg) => { const u = ((state && state.ucs) || []).find((x) => x.sigla === sg); return u ? `${sg} – ${u.nome}` : sg; };
  const L = [];
  for (const iso of [...new Set([...Object.keys(base || {}), ...Object.keys(cur)])].sort()) {
    if (iso < today) continue;
    const a = (base || {})[iso], b = cur[iso]; if (a === b) continue;
    const [ka, sa] = a ? a.split(/:(.*)/s) : [null, null], [kb, sb] = b ? b.split(/:(.*)/s) : [null, null];
    if (kb === "nao") L.push(`${lab(iso)}: a aula de ${nome(sb)} não será dada.`);
    else if (kb === "rep") L.push(`${lab(iso)}: reposição da aula de ${nome(sb)}.`);
    else if (kb === "aula" && (ka === null || ka === "x")) L.push(`${lab(iso)}: nova aula de ${nome(sb)}.`);
    else if (kb === "aula" && ka === "nao" && sa === sb) L.push(`${lab(iso)}: a aula de ${nome(sb)} foi mantida.`);
    else if (kb === "aula" && (ka === "aula" || ka === "rep" || ka === "nao")) L.push(`${lab(iso)}: a aula de ${nome(sa)} foi trocada por ${nome(sb)}.`);
    else if (kb === "x") L.push(`${lab(iso)}: sem aula (${sb}).`);
    else if (kb === null && (ka === "aula" || ka === "rep")) L.push(`${lab(iso)}: a aula de ${nome(sa)} foi cancelada.`);
    else if (kb === null && ka === "nao") L.push(`${lab(iso)}: registro de aula não dada removido.`);
    else if (kb === null && ka === "x") L.push(`${lab(iso)}: voltou a ser dia letivo.`);
  }
  return L;
}
export function digest(state, lines, url) {
  const c = state.cfg || {};
  return {
    subject: `Alterações no calendário – Turma ${c.turma}`,
    text: `Olá! Houve alterações no calendário da turma ${c.turma} (${c.curso}):\n\n${lines.map((l) => "• " + l).join("\n")}\n\n${url ? "Calendário atualizado: " + url : ""}`.trim(),
  };
}
export function reminder(state, iso, url) {
 const c=state.cfg||{},blocks=blocksForDay(state,iso),teachers=[...new Set(blocks.map(b=>state.ucs?.find(u=>u.sigla===b.sigla)?.docente).filter(Boolean))];
 const text=blocks.map(b=>{const u=state.ucs?.find(u=>u.sigla===b.sigla)||{};return `${b.sigla}${u.nome?" – "+u.nome:""}, das ${hm(b.inicio)} às ${hm(b.fim)}${u.sala||c.local?", em "+(u.sala||c.local):""}`}).join("; ");
 return {subject:`Lembrete: aula amanhã – Turma ${c.turma}`,text:`Lembrete: amanhã (${lab(iso)}) ${text?"tem aula de "+text:"não há aulas programadas"}.${url?"\nCalendário: "+url:""}`,docente:teachers.length===1?teachers[0]:teachers};
}

/* ---------- destinatários ---------- */
const isMail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const normPhone = (s) => { const d = String(s || "").replace(/\D/g, ""); if (d.length < 10) return ""; return d.startsWith("55") && d.length >= 12 ? d : "55" + d; };
export function recipients(state, geral, alvo, onlyDocente) {
  const e = new Set(), p = new Set(), docs = (geral && geral.docentes) || [];
  const add = (mail, tel) => { if (mail && isMail(String(mail).trim())) e.add(String(mail).trim().toLowerCase()); const n = normPhone(tel); if (n) p.add(n); };
  if (alvo.alunos) for (const a of state.alunos || []) add(a.email, a.tel);
  if (alvo.docentes) {
    const nomes = Array.isArray(onlyDocente)?onlyDocente:onlyDocente ? [onlyDocente] : [...new Set((state.ucs || []).map((u) => u.docente).filter(Boolean))];
    for (const n of nomes) { const d = docs.find((x) => x.nome === n); if (d) add(d.email, d.tel); }
  }
  if (alvo.lista) for (const m of String((state.cfg || {}).destinatarios || "").split(/[\s,;]+/)) add(m, "");
  return { emails: [...e], phones: [...p] };
}

/* ---------- envio ---------- */
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
export const providers = () => ({ email: !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM), whatsapp: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TEMPLATE) });

export async function sendMail(to, subject, text) {
  if (!to.length) return { sent: 0, failed: 0 };
  if (!providers().email) return { sent: 0, failed: 0, simulated: to.length };
  let sent = 0, failed = 0, error = "";
  for (const part of chunk(to, 100)) {
    try {
      const r = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify(part.map((a) => ({ from: process.env.MAIL_FROM, to: [a], subject, text }))) });
      if (r.ok) sent += part.length; else { failed += part.length; error = `Resend ${r.status}: ${(await r.text()).slice(0, 160)}`; }
    } catch (e) { failed += part.length; error = String(e.message || e); }
  }
  return { sent, failed, ...(error ? { error } : {}) };
}
export async function sendWhats(phones, text) {
  if (!phones.length) return { sent: 0, failed: 0 };
  if (!providers().whatsapp) return { sent: 0, failed: 0, simulated: phones.length };
  const one = String(text).replace(/\s*\n+\s*/g, " • ").replace(/ {2,}/g, " ").slice(0, 900); // variável de modelo não aceita quebras de linha
  let sent = 0, failed = 0, error = "";
  for (const to of phones) {
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, { method: "POST", headers: { authorization: "Bearer " + process.env.WHATSAPP_TOKEN, "content-type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: process.env.WHATSAPP_TEMPLATE, language: { code: process.env.WHATSAPP_LANG || "pt_BR" }, components: [{ type: "body", parameters: [{ type: "text", text: one }] }] } }) });
      if (r.ok) sent++; else { failed++; error = `WhatsApp ${r.status}: ${(await r.text()).slice(0, 160)}`; }
    } catch (e) { failed++; error = String(e.message || e); }
  }
  return { sent, failed, ...(error ? { error } : {}) };
}
export async function deliver(rc, canal, subject, text) {
  const out = {};
  if (canal === "email" || canal === "ambos") out.email = await sendMail(rc.emails, subject, text);
  if (canal === "whatsapp" || canal === "ambos") out.whatsapp = await sendWhats(rc.phones, text);
  return out;
}
export const summary = (d) => { const parts = Object.entries(d).map(([k, v]) => `${k}: ${v.simulated ? v.simulated + " simulado(s)" : v.sent + " enviado(s)" + (v.failed ? ", " + v.failed + " falha(s)" : "")}`); return parts.join(" · ") || "sem destinatários"; };
export const okOf = (d) => Object.values(d).every((v) => !v.failed);

// Cópia do backup por e-mail (anexo .json). BACKUP_EMAIL aceita vários endereços separados por vírgula.
export async function sendBackupMail(payload, dateIso) {
  const to = String(process.env.BACKUP_EMAIL || "").split(/[\s,;]+/).filter(isMail);
  if (!to.length) return { skipped: "BACKUP_EMAIL não configurado" };
  if (!providers().email) return { skipped: "serviço de e-mail não configurado" };
  let body = payload;
  if (process.env.BACKUP_EMAIL_SEM_ALUNOS) {
    const o = JSON.parse(payload);
    for (const [k, d] of Object.entries(o.docs)) if (k.startsWith("turma-") && d.state) { delete d.state.alunos; if (d.state.reg) d.state.reg = Object.fromEntries(Object.entries(d.state.reg).map(([x, r]) => [x, { dado: r.dado, rep: r.rep }])); delete d.state.aviso; }
    body = JSON.stringify(o);
  }
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject: `Backup do Planejador de Turmas – ${dateIso}`, text: `Cópia de segurança do Planejador de Turmas (${dateIso}).\n\nGuarde este arquivo em local seguro: ele pode conter dados pessoais de alunos. Para restaurar, use a aba Dados do sistema ou o script scripts/restore-backup.js.`, attachments: [{ filename: `backup-planejador-${dateIso}.json`, content: Buffer.from(body).toString("base64") }] }) });
    return r.ok ? { sent: to.length, failed: 0 } : { sent: 0, failed: to.length, error: `Resend ${r.status}: ${(await r.text()).slice(0, 160)}` };
  } catch (e) { return { sent: 0, failed: to.length, error: String(e.message || e) }; }
}
