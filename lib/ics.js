import { slotsOf, blocksForDay } from "./schedule.js";
// Gera agendas .ics (assináveis) a partir dos documentos salvos.
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "turma";
const toMin = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const horaOf = (c) => (c.turno === "Matutino NEM" ? 50 : 60);
export function horarios(c) { return slotsOf(c); }
export const span = (c) => { const h = horarios(c); return [h[0].i, h[h.length - 1].f]; };
const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (l) => { const o = []; while (l.length > 74) { o.push(l.slice(0, 74)); l = " " + l.slice(74); } o.push(l); return o.join("\r\n"); };
const pad = (n) => String(n).padStart(2, "0");
const stamp = (iso, m) => iso.replace(/-/g, "") + "T" + pad(Math.floor(m / 60)) + pad(m % 60) + "00";

export function icsFor(key, docs) {
  const turmas = Object.entries(docs).filter(([k, v]) => k.startsWith("turma-") && v && v.state).map(([k, v]) => [k.slice(6), v.state]);
  let nome, file, pick;
  if (key.startsWith("turma-")) {
    const t = turmas.find(([id]) => id === key.slice(6)); if (!t) return null;
    nome = `Turma ${t[1].cfg.turma}`; file = `turma-${t[0]}.ics`; pick = (id) => id === t[0] ? () => true : null;
  } else if (key.startsWith("docente-")) {
    const dn = ((docs.geral && docs.geral.docentes) || []).find((d) => slug(d.nome) === key.slice(8)); if (!dn) return null;
    nome = `Aulas — ${dn.nome}`; file = `docente-${key.slice(8)}.ics`; pick = () => (u) => u.docente === dn.nome;
  } else return null;
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SENAI Planejador//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(nome)}`, "X-WR-TIMEZONE:America/Bahia", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const [id, s] of turmas) {
    const f = pick(id); if (!f) continue;
    for (const [iso, d] of Object.entries(s.days || {}).sort()) for (const {sigla:sg,inicio:i,fim:e,bloco} of blocksForDay(s,iso)) {
      if (s.reg && s.reg[iso] && s.reg[iso].dado === "nao") continue;
      const u = (s.ucs || []).find((x) => x.sigla === sg); if (!u || !f(u)) continue;
      L.push("BEGIN:VEVENT", `UID:${id}-${iso}-${slug(sg)}-${bloco}@planejador-senai`, `DTSTAMP:${iso.replace(/-/g, "")}T000000Z`,
        `DTSTART;TZID=America/Bahia:${stamp(iso, i)}`, `DTEND;TZID=America/Bahia:${stamp(iso, e)}`,
        fold(`SUMMARY:${esc(sg + " – " + u.nome + (key.startsWith("docente-") ? " (" + s.cfg.turma + ")" : ""))}`),
        fold(`DESCRIPTION:${esc(`Turma ${s.cfg.turma} · ${s.cfg.curso}${u.docente ? " · Docente: " + u.docente : ""}`)}`));
      if (u.sala || s.cfg.local) L.push(fold(`LOCATION:${esc(u.sala || s.cfg.local)}`));
      L.push("END:VEVENT");
    }
  }
  L.push("END:VCALENDAR");
  return { body: L.join("\r\n") + "\r\n", file };
}
