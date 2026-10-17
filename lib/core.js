import {previewEnvironmentImport,environmentImportTemplate} from './environment-import.js';
import {dailyDisplayData,dailyDisplayHTML,dailyDisplayXlsx} from './daily-display.js';
import {senaiLogo} from './senai-logo.js';
import { validateDocentes } from "./docentes.js";
import { historyDiff } from './history-diff.js';
import { calendarNotifications } from './calendar-notifications.js';
import { suggestPlanning } from './planning.js';
import { managementReport,managementCsv } from './management-report.js';
import {diagnosticCodes,safeOperation,failureCode,responseIncident,clientIncident,incidentKey} from './diagnostics.js';
import {publicationConfig,inspectPublicationBackup,publicationManualChecks} from './publication.js';
// Núcleo da API (padrão Web Request/Response). Usado pela Vercel, Netlify e pelo servidor local.
import { createHmac, timingSafeEqual, scryptSync, randomBytes, createHash, randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { validateSchedule, scheduleConflicts } from "./schedule.js";
import { excelPreview, workbookVersion } from "./excel-preview.js";
import { calendarXlsx } from "./calendar-export.js";
import { teacherCalendarXlsx } from "./teacher-calendar-export.js";
import { icsFor } from "./ics.js";
import * as N from "./notify.js";
import { reservationChange, manager, synchronize, validateBlock, dailyBoard, calendarEntries, today } from "./reservations.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { validateEnvironments, teacherLessons, environmentRemovalError } from "./environments.js";

let _db, _ready;
const context = new AsyncLocalStorage();
const diagnosticContext=new AsyncLocalStorage();let diagnosticsReady=false;
let writeQueue = Promise.resolve();
// Remoto (Turso) usa o cliente "web" (sem módulos nativos, ideal para Vercel/Netlify); arquivo local usa o cliente completo.
async function init() {
  SECRET();
  if(!process.env.ADMIN_PASSWORD)throw new Error("Configure ADMIN_PASSWORD antes de iniciar o sistema.");
  const url = process.env.TURSO_DATABASE_URL || "file:./data/planejador.db";
  const { createClient } = await import(url.startsWith("file:") ? "@libsql/client" : "@libsql/client/web");
  _db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  const x = (sql) => _db.execute(sql);
  const addColumn=async(sql,table,name)=>{try{await x(sql)}catch(error){if(!(await x(`PRAGMA table_info(${table})`)).rows.some(r=>r.name===name))throw error}};
  await x("CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)");
  const cols = (await x("PRAGMA table_info(docs)")).rows.map((r) => String(r.name));
  if (!cols.includes("rev")) await x("ALTER TABLE docs ADD COLUMN rev INTEGER NOT NULL DEFAULT 1");
  if (!cols.includes("updated_by")) await x("ALTER TABLE docs ADD COLUMN updated_by TEXT");
  await x("CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, doc_id TEXT NOT NULL, data TEXT NOT NULL, at TEXT NOT NULL, by TEXT, rev INTEGER, note TEXT)");
  await x("CREATE INDEX IF NOT EXISTS history_doc ON history(doc_id, id)");
  await x("CREATE TABLE IF NOT EXISTS users (login TEXT PRIMARY KEY, nome TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL)");
  await x("CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, kind TEXT NOT NULL, by TEXT, size INTEGER, hash TEXT, docs_n INTEGER, data TEXT NOT NULL)");
  await x("CREATE TABLE IF NOT EXISTS notify_state (turma_id TEXT PRIMARY KEY, base TEXT NOT NULL, lembrete_last TEXT)");
  await x("CREATE TABLE IF NOT EXISTS notify_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, turma_id TEXT, canal TEXT, kind TEXT, by TEXT, resumo TEXT, ok INTEGER, erro TEXT)");
  await x("CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, target TEXT NOT NULL, message TEXT NOT NULL, reservation_id TEXT, at TEXT NOT NULL, seen TEXT NOT NULL DEFAULT '[]')");
  await x("CREATE TABLE IF NOT EXISTS system_events (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL UNIQUE, source TEXT NOT NULL, category TEXT NOT NULL, severity TEXT NOT NULL, operation TEXT NOT NULL, status INTEGER NOT NULL, code TEXT NOT NULL, reference TEXT NOT NULL, first_at TEXT NOT NULL, last_at TEXT NOT NULL, occurrences INTEGER NOT NULL DEFAULT 1, resolved_at TEXT)");
  await x("CREATE INDEX IF NOT EXISTS system_events_recent ON system_events(last_at)");
  await x("CREATE TABLE IF NOT EXISTS diagnostic_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL)");
  diagnosticsReady=true;
  await addColumn("ALTER TABLE notifications ADD COLUMN kind TEXT NOT NULL DEFAULT 'reserva'",'notifications','kind');
  await addColumn("ALTER TABLE notifications ADD COLUMN doc_id TEXT",'notifications','doc_id');
  await addColumn("ALTER TABLE notifications ADD COLUMN dismissed TEXT NOT NULL DEFAULT '[]'",'notifications','dismissed');
  await x("CREATE INDEX IF NOT EXISTS notifications_target ON notifications(target,id)");
  // Grupos usam prefixo inválido em logins para evitar colisão com contas pessoais.
  await x("UPDATE notifications SET target='@gestores' WHERE target='gestores' AND message LIKE 'Reserva pendente:%'");
  await x("CREATE TABLE IF NOT EXISTS student_access (turma_id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE, session_key TEXT NOT NULL)");
  const ucols = (await x("PRAGMA table_info(users)")).rows.map((r) => String(r.name));
  if(!ucols.includes('session_key'))await addColumn("ALTER TABLE users ADD COLUMN session_key TEXT",'users','session_key');
  for(const user of (await x("SELECT login FROM users WHERE session_key IS NULL OR session_key='' ")).rows)await _db.execute({sql:"UPDATE users SET session_key=? WHERE login=? AND (session_key IS NULL OR session_key='')",args:[randomUUID(),user.login]});
  if (!ucols.includes("docente")) await x("ALTER TABLE users ADD COLUMN docente TEXT");
  if (!ucols.includes("docente_id")) await addColumn("ALTER TABLE users ADD COLUMN docente_id TEXT",'users','docente_id');
  if (!ucols.includes("role")) await x("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'coord'");
  if(!ucols.includes('recovery_email'))await addColumn("ALTER TABLE users ADD COLUMN recovery_email TEXT NOT NULL DEFAULT ''",'users','recovery_email');
  await x("CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, login TEXT NOT NULL UNIQUE, session_key TEXT NOT NULL, expires_at INTEGER NOT NULL)");
  await x("CREATE TABLE IF NOT EXISTS password_reset_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL)");
  const geral=(await x("SELECT data,rev FROM docs WHERE id='geral'")).rows[0];
  if(geral){const data=JSON.parse(String(geral.data));if(data.docentes?.some(d=>!d.id))await writeDoc('geral',{...data,docentes:data.docentes.map(d=>({...d,id:d.id||randomUUID()}))},'Migração de identificadores',Number(geral.rev),'Identificadores permanentes de docentes');await syncTeacherIds('Migração de identificadores');}
}
const db = () => context.getStore() || _db;
async function ready() { if (!_ready) _ready = init(); await _ready; }
const q = (sql, args = []) => db().execute({ sql, args });

async function storeIncident(event,reference=randomUUID(),count=1){
 const now=new Date().toISOString();
 await q('DELETE FROM system_events WHERE last_at<?',[new Date(Date.now()-30*86400000).toISOString()]);
 await q(`INSERT INTO system_events(id,fingerprint,source,category,severity,operation,status,code,reference,first_at,last_at,occurrences) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(fingerprint) DO UPDATE SET last_at=excluded.last_at,reference=excluded.reference,occurrences=system_events.occurrences+excluded.occurrences,resolved_at=NULL,severity=excluded.severity`,[randomUUID(),incidentKey(event),event.source,event.category,event.severity,event.operation,event.status,event.code,reference,now,now,count]);
 await q('DELETE FROM system_events WHERE id NOT IN (SELECT id FROM system_events ORDER BY last_at DESC,id DESC LIMIT 500)');
}
async function queueIncident(event){
 const state=diagnosticContext.getStore();
 if(state){const key=incidentKey(event),previous=state.pending.get(key);state.pending.set(key,{event,count:(previous?.count||0)+1});return}
 if(diagnosticsReady)try{await inWriteTransaction(()=>storeIncident(event))}catch{console.warn('Diagnóstico indisponível. Código: '+event.code)}
 else console.warn('Diagnóstico indisponível. Código: '+event.code);
}
function markFailure(error){const state=diagnosticContext.getStore();if(state)state.code=failureCode(error)}

/* ---------- sessão ---------- */
const SECRET = () => {if(!process.env.SESSION_SECRET)throw new Error("Configure SESSION_SECRET antes de iniciar o sistema.");return process.env.SESSION_SECRET;};
const sign = (v) => createHmac("sha256", SECRET()).update(v).digest("hex");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const makeToken = (u) => { const p = b64({ l: u.login, n: u.nome, t:u.turmaId||null, m: !!u.master, r: u.role || "coord", v:u.master?createHash("sha256").update(String(process.env.ADMIN_PASSWORD)).digest("hex"):u.sessionVersion||null, e: Date.now() + 1000 * 60 * 60 * 12 }); return p + "." + sign(p); };
function readToken(t) {
  if (!t) return null;
  const [p, sig] = t.split(".");
  if (!p || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(sign(p));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(p, "base64url").toString()); return o.e > Date.now() ? { login: o.l, nome: o.n, turmaId:o.t, master: !!o.m, role: o.r || "coord", sessionVersion:o.v } : null; } catch { return null; }
}
function cookieOf(req, name) {
  const m = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(name + "="));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : "";
}
const who = (req) => readToken(cookieOf(req, "plan_sess"));
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const hashPw = (pw, salt) => scryptSync(pw, salt, 32).toString("hex");
const normLogin = (s) => String(s || "").trim().toLowerCase();
const recoveryEmail=value=>String(value||'').trim().toLowerCase();
const validRecoveryEmail=value=>!value||(value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

/* ---------- privacidade e papéis ---------- */
const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v));
// Visitantes (sem login) nunca recebem nomes de alunos nem faltas: só se a aula foi dada e a reposição.
function publicDoc(id, data) {
  if (id === "geral" && data && Array.isArray(data.docentes)) return { ...data, docentes: data.docentes.map(d => ({id:d.id,nome:d.nome,semana:d.semana||[],bloqueios:d.bloqueios||[]})) };
  if (!id.startsWith("turma-") || !data || !data.state) return data;
  const s = { ...data.state }; delete s.alunos; delete s.docentes; delete s.aviso; delete s.envios;
  if (s.cfg) { const { destinatarios, email, ...c } = s.cfg; s.cfg = c; }
  if (s.reg) s.reg = Object.fromEntries(Object.entries(s.reg).map(([d, r]) => [d, { dado: r.dado, rep: r.rep }]));
  return { ...data, state: s };
}
function teacherDoc(id,data,me){
 const pub=publicDoc(id,data);
 if(id==='geral')return {docentes:(data.docentes||[]).filter(d=>d.id===me.docenteId),base:pub.base};
 if(!id.startsWith('turma-')||!data?.state)return pub;
 const state=pub.state,ucs=(state.ucs||[]).filter(u=>me.docente&&u.docente===me.docente),own=new Set(ucs.map(u=>u.sigla));
 const days=Object.fromEntries(Object.entries(state.days||{}).flatMap(([iso,d])=>{
   const siglas=(d.s||[]).filter(sg=>own.has(sg));
   if(!siglas.length&&!['feriado','sem'].includes(d.t))return [];
   return [[iso,{...d,s:siglas,...(Array.isArray(d.grade)?{grade:d.grade.map(sg=>own.has(sg)?sg:null)}:{})}]];
 }));
 const reg=Object.fromEntries(Object.entries(state.reg||{}).filter(([iso])=>days[iso]?.s?.length).map(([iso,r])=>[iso,(data.state.days[iso].s||[]).every(sg=>own.has(sg))?r:{dado:r.dado,rep:r.rep}]));
 return {state:{cfg:state.cfg,ucs,days,reg}};
}
function teacherUpdate(oldData,newData,me){
 if(!me.docente)return null;
 const view=teacherDoc('turma-check',oldData,me);
 if(!onlyAttendance(view,newData)||canon(view.state.alunos)!==canon(newData.state?.alunos))return null;
 const oldReg=view.state.reg||{},newReg=newData.state?.reg||{},merged={...(oldData.state.reg||{})};
 for(const iso of new Set([...Object.keys(oldReg),...Object.keys(newReg)])){
  if(canon(oldReg[iso])===canon(newReg[iso]))continue;
  const siglas=oldData.state.days?.[iso]?.s||[];
  if(!siglas.length||!siglas.every(sg=>oldData.state.ucs?.find(u=>u.sigla===sg)?.docente===me.docente))return null;
  if(newReg[iso])merged[iso]=newReg[iso];else delete merged[iso];
 }
 return {...oldData,state:{...oldData.state,reg:merged}};
}
// Comparação dos campos imutáveis; teacherUpdate restringe registros às aulas do vínculo.
function onlyAttendance(oldData, newData) {
  const strip = (d) => { const s = { ...((d && d.state) || {}) }; delete s.reg; delete s.alunos; return canon({ ...d, state: s }); };
  return strip(oldData) === strip(newData);
}

/* ---------- histórico ---------- */
const KEEP = 60;
async function pushHistory(id, data, by, rev, note) {
  await q("INSERT INTO history(doc_id,data,at,by,rev,note) VALUES(?,?,?,?,?,?)", [id, data, new Date().toISOString(), by, rev, note || null]);
  await q("DELETE FROM history WHERE doc_id=? AND id NOT IN (SELECT id FROM history WHERE doc_id=? ORDER BY id DESC LIMIT ?)", [id, id, KEEP]);
}
function labelOf(id, js) {
  try {
    const d = JSON.parse(js);
    if (id === "ambientes") return `Ambientes (${(d.items || []).length} cadastrados)`;
    if (id === "geral") return `Docentes e configurações (${(d.docentes || []).length} docentes)`;
    const s = d.state || {}, c = s.cfg || {};
    return `Turma ${c.turma || id} · ${Object.keys(s.days || {}).length} dias · ${(s.ucs || []).length} disciplinas`;
  } catch { return id; }
}
async function teacherList(){const row=(await q("SELECT data FROM docs WHERE id='geral'")).rows[0];return row?JSON.parse(String(row.data)).docentes||[]:[];}
async function syncTeacherIds(by){
 const docs=await snapshotAll(),teachers=docs.geral?.docentes||[],ids=new Map(teachers.map(d=>[d.nome,d.id]));
 for(const account of (await q('SELECT login,docente,docente_id FROM users')).rows){const id=ids.get(account.docente)||null;if(id!==(account.docente_id||null))await q('UPDATE users SET docente_id=? WHERE login=?',[id,account.login]);}
 for(const [id,doc] of Object.entries(docs))if(id.startsWith('turma-')&&doc.state?.ucs){const ucs=doc.state.ucs.map(u=>({...u,docenteId:ids.get(u.docente)||null}));if(canon(ucs)!==canon(doc.state.ucs))await writeDoc(id,{...doc,state:{...doc.state,ucs}},by,undefined,'Identificadores de docentes sincronizados');}
 if(docs.reservas?.items){const items=docs.reservas.items.map(r=>({...r,docenteId:ids.get(r.docente)||r.docenteId||null}));if(canon(items)!==canon(docs.reservas.items))await writeDoc('reservas',{...docs.reservas,items},by,undefined,'Identificadores de docentes sincronizados');}
}
async function writeDoc(id, data, by, base, note) {
  const cur = (await q("SELECT data, rev FROM docs WHERE id=?", [id])).rows[0];
  if(id==="geral"&&Array.isArray(data.docentes)){const previous=cur?JSON.parse(String(cur.data)).docentes||[]:[];data={...data,docentes:data.docentes.map(d=>({...d,id:d.id||previous.find(x=>x.nome===d.nome)?.id||randomUUID()}))};}
  if(id.startsWith("turma-")&&data.state?.ucs){const docentes=await teacherList();data={...data,state:{...data.state,ucs:data.state.ucs.map(u=>({...u,docenteId:docentes.find(d=>d.nome===u.docente)?.id||null}))}};}
  const js = JSON.stringify(data);
  if (cur) {
    if (base !== undefined && Number(base) !== Number(cur.rev)) return { conflict: { rev: Number(cur.rev), data: JSON.parse(String(cur.data)) } };
    if (String(cur.data) === js) return { rev: Number(cur.rev), same: true };
    const rev = Number(cur.rev) + 1;
    const updated = await q("UPDATE docs SET data=?, updated_at=?, rev=?, updated_by=? WHERE id=? AND rev=?", [js, new Date().toISOString(), rev, by, id, Number(cur.rev)]);
    if (!updated.rowsAffected) {
      const latest = (await q("SELECT data, rev FROM docs WHERE id=?", [id])).rows[0];
      return { conflict: latest ? { rev: Number(latest.rev), data: JSON.parse(String(latest.data)) } : { rev: 0, data: null, gone: true } };
    }
    await pushHistory(id, js, by, rev, note);
    if(id.startsWith('turma-'))await calendarNotification(id,JSON.parse(String(cur.data)).state,data.state);
    return { rev };
  }
  if (base !== undefined && Number(base) > 0) return { conflict: { rev: 0, data: null, gone: true } };
  const inserted = await q("INSERT INTO docs(id,data,updated_at,rev,updated_by) VALUES(?,?,?,1,?) ON CONFLICT(id) DO NOTHING", [id, js, new Date().toISOString(), by]);
  if (!inserted.rowsAffected) {
    const latest = (await q("SELECT data, rev FROM docs WHERE id=?", [id])).rows[0];
    return { conflict: latest ? { rev: Number(latest.rev), data: JSON.parse(String(latest.data)) } : { rev: 0, data: null, gone: true } };
  }
  await pushHistory(id, js, by, 1, note || "criado");
  if(id.startsWith('turma-'))await calendarNotification(id,undefined,data.state);
  return { rev: 1 };
}

/* ---------- backups ---------- */
const BK_KEEP = 30, BK_MONTHS = 12;
async function snapshotAll() { const r = await q("SELECT id, data FROM docs"); return Object.fromEntries(r.rows.map((x) => [String(x.id), JSON.parse(String(x.data))])); }
async function backupState() {
  const docs = await snapshotAll();
  const users = (await q("SELECT login,nome,salt,hash,role,docente,docente_id,created_at,recovery_email FROM users ORDER BY login")).rows.map(r => ({ ...r }));
  const notifications = (await q("SELECT * FROM notifications ORDER BY id")).rows.map(r => ({ ...r, id: Number(r.id) }));
  return { versao: 2, docs, users, notifications };
}
const payloadOf = (state) => JSON.stringify({ ...state, em: new Date().toISOString() });
async function pruneBackups() {
  const rows = (await q("SELECT id, at FROM backups ORDER BY id DESC")).rows.map((r) => ({ id: Number(r.id), month: String(r.at).slice(0, 7) }));
  const keep = new Set(rows.slice(0, BK_KEEP).map((r) => r.id)), seen = new Map();
  for (const r of [...rows].reverse()) if (!seen.has(r.month)) seen.set(r.month, r.id); // primeiro de cada mês
  [...seen.entries()].sort().slice(-BK_MONTHS).forEach(([, id]) => keep.add(id));
  const drop = rows.filter((r) => !keep.has(r.id)).map((r) => r.id);
  for (const id of drop) await q("DELETE FROM backups WHERE id=?", [id]);
}
export async function runBackup(kind = "agendado", by = "Sistema", force = false) {
  await ready();
  const state = await backupState(), docs = state.docs; if (!Object.keys(docs).length && !state.users.length) return { skipped: "banco vazio" };
  const hash = createHash("sha256").update(canon(state)).digest("hex");
  const last = (await q("SELECT hash FROM backups ORDER BY id DESC LIMIT 1")).rows[0];
  if (!force && last && String(last.hash) === hash) return { skipped: "sem alterações desde o último backup" };
  const payload = payloadOf(state);
  const r = await q("INSERT INTO backups(at,kind,by,size,hash,docs_n,data) VALUES(?,?,?,?,?,?,?)", [new Date().toISOString(), kind, by, payload.length, hash, Object.keys(docs).length, gzipSync(payload).toString("base64")]);
  await pruneBackups();
  return { saved: true, id: Number(r.lastInsertRowid), size: payload.length, docs: Object.keys(docs).length };
}
// Rotina diária: backup no banco + (aos domingos) cópia por e-mail + avisos
export async function runDaily(now = new Date()) {
  const failure=async(error,operation)=>{const code=failureCode(error);await queueIncident({source:'servidor',category:operation==='backup_now'?'salvamento':'servidor',severity:'erro',operation,status:500,code});return {error:'Falha na rotina agendada. Código: '+code}};
  try{
  await ready();
  const out = { backup: await runBackup("agendado", "Sistema (agendado)").catch(e=>failure(e,'backup_now')) };
  if (new Date(now.getTime() - 3 * 3600e3).getUTCDay() === 0 || process.env.BACKUP_EMAIL_DIARIO) {
    const res = await N.sendBackupMail(payloadOf({ versao: 1, docs: await snapshotAll() }), N.todayBR(now));
    out.email = res; if (!res.skipped) await logNotify("-", "email", "backup", "Sistema (agendado)", { email: res });
  }
  out.avisos = await runCron(now).catch(e=>failure(e,'cron'));
  return out;
  }catch(error){if(!diagnosticContext.getStore())await failure(error,'cron');else markFailure(error);throw error}
}

/* ---------- avisos ---------- */
const AV0 = { auto: false, lembrete: false, canal: "email", alunos: true, docentes: true, lista: true };
async function loadTurmas() {
  const rows = (await q("SELECT id, data FROM docs")).rows.map((r) => [String(r.id), JSON.parse(String(r.data))]);
  const geral = (rows.find(([k]) => k === "geral") || [0, {}])[1];
  return { geral, turmas: rows.filter(([k, v]) => k.startsWith("turma-") && v.state).map(([k, v]) => [k.slice(6), v.state]) };
}
const siteUrl = (geral) => process.env.PUBLIC_URL || (geral && geral.base) || "";
const alunoLink = (geral, id) => (siteUrl(geral) ? siteUrl(geral).replace(/\/$/, "") + "/#aluno-" + id : "");
async function logNotify(turma, canal, kind, by, res) {
  const failures=Object.entries(res).filter(([,v])=>v?.failed||v?.error);
  const errors=failures.map(([channel,v])=>String(v.error||'').match(/^(Resend|WhatsApp) [1-5]\d{2}\b/)?.[0]||'Falha no canal '+(channel==='whatsapp'?'WhatsApp':'e-mail'));
  await q("INSERT INTO notify_log(at,turma_id,canal,kind,by,resumo,ok,erro) VALUES(?,?,?,?,?,?,?,?)", [new Date().toISOString(), turma, canal, kind, by, N.summary(res), N.okOf(res) ? 1 : 0, errors.join(' | ')||null]);
  for(const [channel,v] of failures)await queueIncident({source:'servico',category:'servicos',severity:'erro',operation:channel==='whatsapp'?'whatsapp':'email',status:Number(String(v.error||'').match(/^(?:Resend|WhatsApp) ([1-5]\d{2})\b/)?.[1]||0),code:'SERVICE_FAILURE'});
  await q("DELETE FROM notify_log WHERE id NOT IN (SELECT id FROM notify_log ORDER BY id DESC LIMIT 300)");
}
const getBase = async (id) => { const r = (await q("SELECT base, lembrete_last FROM notify_state WHERE turma_id=?", [id])).rows[0]; return r ? { base: JSON.parse(String(r.base)), last: r.lembrete_last ? String(r.lembrete_last) : null } : null; };
const setBase = (id, snap, last) => q("INSERT INTO notify_state(turma_id,base,lembrete_last) VALUES(?,?,?) ON CONFLICT(turma_id) DO UPDATE SET base=excluded.base, lembrete_last=COALESCE(?, notify_state.lembrete_last)", [id, JSON.stringify(snap), last || null, last || null]);

export async function runCron(now = new Date()) {
  await ready();
  const { geral, turmas } = await loadTurmas(), today = N.todayBR(now), tomorrow = N.addDay(today, 1), out = [];
  for (const [id, st] of turmas) {
    const av = { ...AV0, ...(st.aviso || {}) }, snap = N.snapshot(st), row = await getBase(id);
    if (!av.auto && !av.lembrete) { await setBase(id, snap); continue; }
    if (!row) { await setBase(id, snap); out.push({ turma: id, baseline: true }); continue; }
    let keep = av.auto ? row.base : snap;
    if (av.auto) {
      const lines = N.diffLines(row.base, snap, st, today);
      if (lines.length) {
        const m = N.digest(st, lines, alunoLink(geral, id)), res = await N.deliver(N.recipients(st, geral, av), av.canal, m.subject, m.text);
        await logNotify(id, av.canal, "alterações", "Sistema (agendado)", res);
        if (N.okOf(res)) keep = snap;
        out.push({ turma: id, kind: "alterações", lines: lines.length, res });
      } else keep = snap;
    }
    let last = null;
    if (av.lembrete && row.last !== tomorrow) {
      const d = (st.days || {})[tomorrow], sg = d && !d.t && (d.s || [])[0], reg = (st.reg || {})[tomorrow];
      if (sg && !(reg && reg.dado === "nao")) {
        const m = N.reminder(st, tomorrow, alunoLink(geral, id)), res = await N.deliver(N.recipients(st, geral, av, m.docente || undefined), av.canal, m.subject, m.text);
        await logNotify(id, av.canal, "lembrete", "Sistema (agendado)", res);
        if (N.okOf(res)) last = tomorrow;
        out.push({ turma: id, kind: "lembrete", res });
      } else last = tomorrow;
    }
    await setBase(id, keep, last);
  }
  return out;
}

async function handleImpl(req, batchSnapshot=null) {
  try {
    await ready();
    const url = new URL(req.url);
    const me = who(req);
    const expiredSession=message=>json({error:message},401,{"set-cookie":"plan_sess=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"+(url.protocol==='https:'?'; Secure':'')});
    if(me?.master&&me.sessionVersion!==createHash("sha256").update(String(process.env.ADMIN_PASSWORD)).digest("hex"))return expiredSession("Sessão encerrada. Entre novamente.");
    if(me?.role==='aluno'){
      const access=(await q("SELECT session_key FROM student_access WHERE turma_id=?",[me.turmaId])).rows[0];
      const turma=(await q("SELECT id FROM docs WHERE id=?",[me.turmaId])).rows[0];
      if(!access||!turma||access.session_key!==me.sessionVersion)return expiredSession("Código da turma alterado ou desativado. Entre novamente.");
    }
    if (me && !me.master && me.role!=='aluno') {
      const account = (await q("SELECT docente, docente_id, nome, role, session_key FROM users WHERE login=?", [me.login])).rows[0];
      if (!account) return expiredSession("Conta removida. Entre novamente.");
      if(me.sessionVersion!==account.session_key)return expiredSession("Sessão encerrada. Entre novamente.");
      const teachers=await teacherList();const linked=account.docente_id?teachers.find(d=>d.id===account.docente_id):teachers.find(d=>d.nome===account.docente);
      me.docente = linked?.nome || null;me.docenteId=linked?.id||null;
      me.role = String(account.role); me.nome = String(account.nome);
    }

    if (req.method === "GET" && me?.role==='aluno') {
      if([...url.searchParams.keys()].length)return json({error:"O acesso de aluno permite somente consultar o calendário da sua turma."},403);
      const row=(await q("SELECT data,rev FROM docs WHERE id=?",[me.turmaId])).rows[0];
      const source=publicDoc(me.turmaId,JSON.parse(String(row.data))).state;
      const state={cfg:source.cfg,ucs:(source.ucs||[]).map(u=>({sigla:u.sigla,nome:u.nome,docente:u.docente,sala:u.sala,ch:u.ch})),days:source.days||{},reg:source.reg||{}};
      const rooms=JSON.parse(String((await q("SELECT data FROM docs WHERE id='reservas'")).rows[0]?.data||'{}'));
      return json({admin:false,user:{role:'aluno',nome:'Aluno',turmaId:me.turmaId},docs:[{id:'geral',data:{docentes:[]},rev:0},{id:me.turmaId,data:{state},rev:Number(row.rev)},{id:'reservas',data:{items:[],calendario:(rooms.items||[]).filter(r=>r.status==='aprovada'&&r.turmaId===me.turmaId).map(r=>({status:r.status,turmaId:r.turmaId,data:r.data,sigla:r.sigla,bloco:r.bloco,ambienteNome:r.ambienteNome}))},rev:0}]});
    }
    if (req.method === "GET") {
      if(url.searchParams.get('export')==='modelo-ambientes'){
        if(!me)return json({error:'Entre como administrador para baixar o modelo.'},401);
        if(!me.master)return json({error:'Importação de ambientes exclusiva do administrador.'},403);
        return new Response(environmentImportTemplate(),{headers:{'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':'attachment; filename="modelo-ambientes.xlsx"','cache-control':'no-store'}});
      }
      if(url.searchParams.get('export')==='programacao-diaria'){
        if(!me)return json({error:'Entre com sua conta para exportar a programação.'},401);
        if(!manager(me))return json({error:'Somente a gestão de ambientes exporta a programação externa e o Excel diário.'},403);
        const format=url.searchParams.get('formato');if(!['html','xlsx'].includes(format))return json({error:'Escolha HTML ou Excel.'},400);
        await syncReservations(me.nome||me.login);
        let data;try{data=dailyDisplayData(await snapshotAll(),url.searchParams.get('data'),url.searchParams.get('ambiente')||'')}catch(e){return json({error:e.message},400)}
        const html=format==='html';return new Response(html?dailyDisplayHTML(data,senaiLogo):dailyDisplayXlsx(data),{headers:{'content-type':html?'text/html; charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':'attachment; filename="programacao-diaria-'+data.date+'.'+format+'"','cache-control':'no-store','x-content-type-options':'nosniff'}});
      }
      if (["docente-xlsx","docente-preview"].includes(url.searchParams.get("export"))) {
        if (!me) return json({error:"Entre com sua conta para exportar a agenda do docente."},401);
        if (me.role === "ambientes") return json({error:"Esta exportação está disponível à coordenação e ao docente."},403);
        const nome=String(url.searchParams.get("docente")||"");
        if (me.role === "docente" && me.docente !== nome) return json({error:"Exporte somente o calendário do docente vinculado à sua conta."},403);
        await syncReservations(me.nome||me.login);
        try {
          const bytes=teacherCalendarXlsx(await snapshotAll(),nome,url.searchParams.get("ano"),url.searchParams.get("vinculo")||"");
          const name=nome.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"-");
          const filename=`calendario-docente-${name.toLowerCase()}-${url.searchParams.get("ano")}.xlsx`;
          if(url.searchParams.get("export")==="docente-preview")return json(excelPreview(bytes,`Agenda de ${nome} · ${url.searchParams.get("ano")}`,filename));
          if(url.searchParams.has("versao")&&url.searchParams.get("versao")!==workbookVersion(bytes))return json({error:"O calendário mudou depois da prévia. Atualize a prévia antes de baixar."},409);
          return new Response(bytes,{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":`attachment; filename="calendario-docente-${name}-${url.searchParams.get("ano")}.xlsx"`,"cache-control":"no-store"}});
        } catch(e){markFailure(e);return json({error:e.message||"Não foi possível exportar a agenda do docente."},400)}
      }
      if (["xlsx","turma-preview"].includes(url.searchParams.get("export"))) {
        if (!me) return json({ error: "Entre com sua conta para exportar o calendário em Excel." }, 401);
        await syncReservations(me.nome || me.login);
        const docs = await snapshotAll(), id = String(url.searchParams.get("turma") || "");
        const state = docs[id]?.state;
        if (!id.startsWith("turma-") || !state) return json({ error: "Turma não encontrada." }, 404);
        if(me.role==='ambientes'||me.role==='docente')return json({error:"Sem permissão para exportar esta turma."},403);
        try {
          const bytes = calendarXlsx(state, (docs.reservas?.items || []).filter(r => r.turmaId === id), url.searchParams.get("incluir") === "1");
          const name = String(state.cfg.turma || id).replace(/[^a-zA-Z0-9._-]/g, "-");
          const filename=`calendario-senai-${name}.xlsx`;
          if(url.searchParams.get("export")==="turma-preview")return json(excelPreview(bytes,`Calendário da turma ${state.cfg.turma}`,filename));
          if(url.searchParams.has("versao")&&url.searchParams.get("versao")!==workbookVersion(bytes))return json({error:"O calendário mudou depois da prévia. Atualize a prévia antes de baixar."},409);
          return new Response(bytes, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="calendario-senai-${name}.xlsx"`, "cache-control": "no-store" } });
        } catch (e) { markFailure(e);return json({ error: e.message || "Não foi possível exportar." }, 400); }
      }
      if (url.searchParams.get("cron")) {
        const sec = process.env.CRON_SECRET;
        if (!sec || !eq(req.headers.get("authorization") || "", "Bearer " + sec)) return json({ error: "unauthorized" }, 401);
        return json({ ok: true, result: await runDaily() });
      }
      const ics = url.searchParams.get("ics");
      if (ics) {
        const r = await q("SELECT id, data FROM docs");
        const docs = Object.fromEntries(r.rows.map((x) => [String(x.id), JSON.parse(String(x.data))]));
        if(!me)return json({error:"Entre para acessar sua agenda."},401);
        if(me.role==='docente'&&(!me.docenteId||ics!=='docente-'+me.docenteId))return json({error:"Acesso restrito à sua agenda."},403);
        if(me.role==='ambientes')return json({error:"Sem permissão para exportar agendas."},403);
        const out = icsFor(ics, docs);
        if (!out) return new Response("Agenda não encontrada", { status: 404 });
        return new Response(out.body, { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-store", "content-disposition": `inline; filename="${out.file}"` } });
      }
      if(!me)return json({admin:false,user:null,docs:[]});
      const r = await q("SELECT id, data, rev, updated_at, updated_by FROM docs");
      const docs = r.rows.filter(x=>me.role!=='docente'||x.id==='geral'||x.id==='reservas'||String(x.id).startsWith('turma-')&&me.docente&&JSON.parse(String(x.data)).state?.ucs?.some(u=>u.docente===me.docente)).map((x) => { const id = String(x.id), d = JSON.parse(String(x.data)); return { id, data: id === "reservas" ? { items: (d.items || []).filter(r => me && (manager(me) || r.login === me.login || r.criadaPelaGestao&&r.docente===me.docente)),calendario:(d.items||[]).filter(r=>r.status==='aprovada'&&(me.role!=='docente'||r.docente===me.docente)).map(r=>({status:r.status,turmaId:r.turmaId,data:r.data,sigla:r.sigla,bloco:r.bloco,ambienteNome:r.ambienteNome})) } : me?.role === "docente" ? teacherDoc(id,d,me) : me && me.role !== "ambientes" ? d : publicDoc(id, d), rev: Number(x.rev), by: me.role==='docente'?null:x.updated_by || null }; });
      return json({ admin: !!me, user: me, docs });
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const body = await req.json().catch(() => ({}));

    if(body.op==='student_login'){
      const code=String(body.code||'').toUpperCase().replace(/[\s-]/g,'');
      if(!/^[A-F0-9]{20}$/.test(code))return json({error:"Código inválido ou desativado."},401);
      const row=(await q("SELECT a.turma_id,a.session_key FROM student_access a JOIN docs d ON d.id=a.turma_id WHERE a.code_hash=?",[createHash('sha256').update(code).digest('hex')])).rows[0];
      if(!row)return json({error:"Código inválido ou desativado."},401);
      const user={login:'aluno',nome:'Aluno',role:'aluno',turmaId:String(row.turma_id),sessionVersion:String(row.session_key)};
      return json({ok:true},200,{'set-cookie':`plan_sess=${encodeURIComponent(makeToken(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${url.protocol==='https:'?'; Secure':''}`});
    }
    if (body.op === "login") {
      const login = normLogin(body.login), pw = String(body.password || "");
      let user = null;
      if (login && login !== "admin") {
        const u = (await q("SELECT * FROM users WHERE login=?", [login])).rows[0];
        if (u && eq(hashPw(pw, String(u.salt)), String(u.hash))) user = { login, nome: String(u.nome), master: false, role: String(u.role || "coord"),sessionVersion:String(u.session_key) };
      } else {
        const mp = process.env.ADMIN_PASSWORD;
        if (!mp) return json({ error: "ADMIN_PASSWORD não configurada no servidor." }, 500);
        if (eq(pw, mp)) user = { login: "admin", nome: "Coordenação (senha mestre)", master: true, role: "coord" };
      }
      if (!user) { await new Promise((r) => setTimeout(r, 600)); return json({ error: "Usuário ou senha incorretos." }, 401); }
      const secure = url.protocol === "https:" ? "; Secure" : "";
      return json({ ok: true, user }, 200, { "set-cookie": `plan_sess=${encodeURIComponent(makeToken(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}` });
    }
    if (body.op === "logout") return json({ ok: true }, 200, { "set-cookie": "plan_sess=; Path=/; HttpOnly; Max-Age=0" });

    if (!me) return json({ error: "Somente coordenadores podem alterar os dados." }, 401);
    if(me.role==='aluno')return json({error:"Alunos têm acesso somente à consulta do calendário."},403);
    const by = me.nome || me.login;
    if(body.op==='diagnostics_client'){
      let event;try{event=clientIncident(body.event,body.operation)}catch(e){return json({error:e.message},400)}
      const now=Date.now(),window=10*60*1000,key=createHmac('sha256',SECRET()).update('diagnostics:'+me.login).digest('hex');
      await q('DELETE FROM diagnostic_limits WHERE window_start<?',[now-window]);
      const limit=(await q('SELECT attempts FROM diagnostic_limits WHERE key=?',[key])).rows[0];
      if(Number(limit?.attempts||0)>=10)return json({error:'Limite de registros temporariamente atingido.'},429);
      await q('INSERT INTO diagnostic_limits(key,window_start,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1',[key,now]);
      await storeIncident(event,diagnosticContext.getStore()?.reference||randomUUID());return json({ok:true});
    }
    if(['diagnostics_list','diagnostics_resolve'].includes(body.op)){
      if(!me.master)return json({error:'Somente a senha mestre consulta o diagnóstico.'},403);
      if(body.op==='diagnostics_resolve'){
        if(!Number.isSafeInteger(body.count)||body.count<1)return json({error:'Ocorrência inválida.'},400);
        const result=await q('UPDATE system_events SET resolved_at=? WHERE id=? AND occurrences=?',[new Date().toISOString(),String(body.id||''),body.count]);
        if(!result.rowsAffected)return json({error:'A ocorrência mudou. Atualize o diagnóstico antes de marcar como tratada.'},409);
        return json({ok:true});
      }
      const category=body.category||'',state=body.state||'open';
      if(category&&!['exportacao','salvamento','servicos','servidor','interface','conexao'].includes(category)||!['open','resolved','all'].includes(state))return json({error:'Filtro de diagnóstico inválido.'},400);
      await q('DELETE FROM system_events WHERE last_at<?',[new Date(Date.now()-30*86400000).toISOString()]);
      const rows=(await q('SELECT * FROM system_events ORDER BY last_at DESC,id DESC')).rows;
      const filtered=rows.filter(r=>(!category||r.category===category)&&(state==='all'||(state==='resolved'?!!r.resolved_at:!r.resolved_at)));
      return json({ok:true,checkedAt:new Date().toISOString(),retentionDays:30,maxGroups:500,matching:filtered.length,
        summary:{open:rows.filter(r=>!r.resolved_at).length,resolved:rows.filter(r=>r.resolved_at).length,occurrences:rows.reduce((n,r)=>n+Number(r.occurrences),0)},
        items:filtered.slice(0,100).map(r=>({id:r.id,source:r.source,category:r.category,severity:r.severity,operation:r.operation,status:Number(r.status),code:r.code,reference:r.reference,firstAt:r.first_at,lastAt:r.last_at,count:Number(r.occurrences),resolvedAt:r.resolved_at,...diagnosticCodes[r.code]}))});
    }
    if(body.op==='publication_status'){
      if(!me.master)return json({error:'Somente a senha mestre consulta a preparação para publicação.'},403);
      const backup=(await q('SELECT at,hash,data FROM backups ORDER BY id DESC LIMIT 1')).rows[0],current=createHash('sha256').update(canon(await backupState())).digest('hex');
      const checks=[...publicationConfig(process.env),{id:'db-connection',status:'ok',title:'Conexão com o banco',detail:'Consulta ao banco concluída.'},...inspectPublicationBackup(backup,current)];
      return json({checkedAt:new Date().toISOString(),checks,errors:checks.filter(c=>c.status==='error').length,warnings:checks.filter(c=>c.status==='warn').length,manual:publicationManualChecks});
    }
    if(['student_code_generate','student_code_revoke'].includes(body.op)){
      if(me.role!=='coord')return json({error:"Somente a coordenação gerencia códigos de turma."},403);
      const id=String(body.turmaId||'');
      if(!id.startsWith('turma-')||!(await q("SELECT id FROM docs WHERE id=?",[id])).rows.length)return json({error:"Turma não encontrada."},404);
      if(body.op==='student_code_revoke'){await q("DELETE FROM student_access WHERE turma_id=?",[id]);return json({ok:true});}
      const code=randomBytes(10).toString('hex').toUpperCase();
      await q("INSERT INTO student_access(turma_id,code_hash,session_key) VALUES(?,?,?) ON CONFLICT(turma_id) DO UPDATE SET code_hash=excluded.code_hash,session_key=excluded.session_key",[id,createHash('sha256').update(code).digest('hex'),randomUUID()]);
      return json({ok:true,code:code.match(/.{1,4}/g).join('-')});
    }

    if (["reservation_list", "reservation_request", "reservation_decide", "reservation_cancel", "reservation_reschedule", "reservation_book"].includes(body.op)) {
      await syncReservations(by);
      const docs = await snapshotAll();
      const row = (await q("SELECT rev FROM docs WHERE id='reservas'")).rows[0];
      const rev = row ? Number(row.rev) : 0, items = docs.reservas?.items || [];
      if (body.op === "reservation_list") return json({ rev, items: items.filter(r => manager(me) || r.login === me.login || r.criadaPelaGestao&&r.docente===me.docente) });
      let actor=me;if(body.op==='reservation_book'){if(!manager(me))return json({error:'Somente a gestão de ambientes agenda salas de aula.'},403);const owner=(await q("SELECT login FROM users WHERE role='docente' AND docente=? ORDER BY login LIMIT 1",[String(body.docente||'')])).rows[0];actor={...me,reservationLogin:owner?String(owner.login):me.login}}
      const change = reservationChange(docs, items, body, actor);
      if (change.error) return json({ error: change.error }, change.status);
      const result = await writeDoc("reservas", { items: change.items }, by, rev, "reserva: " + change.item.status);
      if (result.conflict) return json({ error: "Outra solicitação foi atualizada. Recarregue e tente novamente." }, 409);
      await reservationNotification(change.item);
      return json({ ok: true, item: change.item, rev: result.rev });
    }
    if (["notification_list","notification_read","notification_read_many","notification_delete"].includes(body.op)) {
      const target = manager(me) ? "@gestores" : me.login;
      const targets=[...new Set([target,me.login,...me.role==='coord'?['@coordenacao']:[]])];
      const where=`target IN (${targets.map(()=>'?').join(',')}) AND NOT EXISTS (SELECT 1 FROM json_each(notifications.dismissed) WHERE value=?)`,visibilityArgs=[...targets,me.login];
      if(body.op!=='notification_list'){
        const ids=['notification_read','notification_delete'].includes(body.op)?[body.id]:body.ids;
        if(!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(id=>!Number.isSafeInteger(id)||id<1))return json({error:'Selecione até 100 notificações válidas.'},400);
        for(const id of new Set(ids)){
          const r=(await q('SELECT target,seen FROM notifications WHERE id=?',[id])).rows[0];
          if(!r||!targets.includes(r.target))return json({error:'Notificação não encontrada.'},404);
          if(body.op==='notification_delete'){await q("UPDATE notifications SET dismissed=json_insert(dismissed,'$[#]',?) WHERE id=? AND NOT EXISTS (SELECT 1 FROM json_each(dismissed) WHERE value=?)",[me.login,id,me.login]);continue}
          const seen=new Set(JSON.parse(String(r.seen)));seen.add(me.login);
          await q('UPDATE notifications SET seen=? WHERE id=?',[JSON.stringify([...seen]),id]);
        }
      }
      if(body.kind&&!['reserva','calendario'].includes(body.kind))return json({error:'Tipo de notificação inválido.'},400);
      if(body.before!==undefined&&(!Number.isSafeInteger(body.before)||body.before<1))return json({error:'Página inválida.'},400);
      const unreadSQL='NOT EXISTS (SELECT 1 FROM json_each(notifications.seen) WHERE value=?)';
      const unread=Number((await q(`SELECT COUNT(*) n FROM notifications WHERE ${where} AND ${unreadSQL}`,[...visibilityArgs,me.login])).rows[0].n);
      const latestId=Number((await q(`SELECT MAX(id) latest FROM notifications WHERE ${where}`,visibilityArgs)).rows[0].latest||0);
      const clauses=[where],args=[...visibilityArgs];
      if(body.kind){clauses.push('kind=?');args.push(body.kind)}
      if(body.unreadOnly){clauses.push(unreadSQL);args.push(me.login)}
      if(body.before){clauses.push('id<?');args.push(body.before)}
      const rows=(await q(`SELECT * FROM notifications WHERE ${clauses.join(' AND ')} ORDER BY id DESC LIMIT 101`,args)).rows;
      const items=rows.slice(0,100).map(r=>({id:Number(r.id),message:String(r.message),reservaId:r.reservation_id,docId:r.doc_id,kind:r.kind,at:r.at,lida:JSON.parse(String(r.seen)).includes(me.login)}));
      return json({ok:true,items,unread,latestId,nextCursor:rows.length>100?items.at(-1).id:null});
    }
    if (body.op === "block_list") {
      if (!manager(me)) return json({ error: "Bloqueios são restritos à gestão de ambientes." }, 403);
      return json({ items: (await snapshotAll()).bloqueios?.items || [] });
    }
    if (body.op === "block_add" || body.op === "block_remove") {
      if (!manager(me)) return json({ error: "Somente a gestão de ambientes altera bloqueios." }, 403);
      const docs = await snapshotAll(), items = docs.bloqueios?.items || [];
      let next;
      if (body.op === "block_add") {
        const result = validateBlock(docs, body);
        if (result.error) return json({ error: result.error }, 400);
        next = [...items, { ...result.item, por: by, em: new Date().toISOString() }];
      } else {
        if (!items.some(b => b.id === body.id)) return json({ error: "Bloqueio não encontrado." }, 404);
        next = items.filter(b => b.id !== body.id);
      }
      await writeDoc("bloqueios", { items: next }, by, undefined, "bloqueio de ambiente");
      await syncReservations(by);
      return json({ ok: true });
    }
    if (body.op === "daily_board" || body.op === "reservation_report") {
      await syncReservations(by);
      const docs = await snapshotAll();
      if (body.op === "daily_board") {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(body.data || "") ? body.data : today();
        // Grade compartilhada somente com usuários autenticados, sem finalidade nem identidade de login.
        return json({ data: date, ambientes: docs.ambientes?.items || [], items: dailyBoard(docs, date).map(r => {
          const { login, finalidade, historico, ...safe } = r;
          if(me.role==='docente'&&r.docente!==me.docente)return {data:r.data,inicio:r.inicio,fim:r.fim,ambienteId:r.ambienteId,ambienteNome:r.ambienteNome,status:r.status,docente:'Ocupado',disciplina:'Horário indisponível'};
          return safe;
        }) });
      }
      if (!manager(me)) return json({ error: "Relatórios de utilização são restritos à gestão de ambientes." }, 403);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.de || "") || !/^\d{4}-\d{2}-\d{2}$/.test(body.ate || "") || body.de > body.ate) return json({ error: "Período inválido." }, 400);
      const items = (docs.reservas?.items || []).filter(r => r.data >= body.de && r.data <= body.ate);
      const totals = {};
      for (const r of items) {
        const key = r.ambienteId;
        totals[key] ||= { ambiente: r.ambienteNome, pedidos: 0, aprovadas: 0, horas: 0 };
        totals[key].pedidos++;
        if (r.status === "aprovada") { totals[key].aprovadas++; totals[key].horas += (r.fim-r.inicio)/60; }
      }
      const calendar = calendarEntries(docs).filter(e => e.data >= body.de && e.data <= body.ate && !(docs.reservas?.items || []).some(r => r.status === "aprovada" && r.turmaId === e.turmaId && r.data === e.data && r.sigla === e.sigla && r.inicio === e.inicio && r.fim === e.fim));
      for (const row of Object.values(totals)) { row.horasReservadas = row.horas; row.horasCalendario = 0; }
      for (const e of calendar) {
        totals[e.ambienteId] ||= { ambiente: e.ambienteNome, pedidos: 0, aprovadas: 0, horas: 0, horasReservadas: 0, horasCalendario: 0 };
        totals[e.ambienteId].horasCalendario += (e.fim-e.inicio)/60;
        totals[e.ambienteId].horas += (e.fim-e.inicio)/60;
      }
      return json({ items, calendario: calendar, resumo: Object.values(totals) });
    }
    if (body.op === "environment_list" || body.op === "my_lessons" || body.op === "managed_lessons") {
      if(body.op==='managed_lessons'&&!manager(me))return json({error:'Somente a gestão de ambientes consulta aulas para agendamento.'},403);
      const docs = await snapshotAll();
      const row = (await q("SELECT rev FROM docs WHERE id='ambientes'")).rows[0];
      if (body.op === "environment_list") return json({ items: docs.ambientes?.items || [], rev: row ? Number(row.rev) : 0 });
      if(body.op==='managed_lessons'){const names=[...new Set(Object.values(docs).flatMap(d=>d.state?.ucs?.map(u=>u.docente)||[]).filter(Boolean))];return json({items:names.flatMap(docente=>teacherLessons(docs,docente).filter(l=>l.data>=today()).map(l=>({...l,docente})))})}
      return json({ docente: me.docente || null, items: teacherLessons(docs, me.docente) });
    }
    if(['environment_import_preview','environment_import_apply'].includes(body.op)){
      if(!me.master)return json({error:'Importação de ambientes exclusiva do administrador.'},403);
      const row=(await q("SELECT data,rev FROM docs WHERE id='ambientes'")).rows[0],base=row?Number(row.rev):0,existing=row?JSON.parse(String(row.data)).items||[]:[];
      if(body.op==='environment_import_apply'&&body.base!==base)return json({error:'conflict'},409);
      let preview;try{preview=previewEnvironmentImport(body.file,existing)}catch(e){return json({error:e.message},400)}
      if(body.op==='environment_import_preview'){const {items,...safe}=preview;return json({...safe,base})}
      if(preview.errors.length)return json({error:'Corrija os erros da planilha antes de importar.',errors:preview.errors},400);
      const result=await writeDoc('ambientes',{items:preview.items},by,base,'importação Excel de ambientes');
      if(result.conflict)return json({error:'conflict'},409);
      await syncReservations(by);return json({ok:true,created:preview.created,updated:preview.updated,unchanged:preview.unchanged,rev:result.rev});
    }
    if (body.op === "environment_save") {
      if (!manager(me)) return json({ error: "Somente a gestão de ambientes cadastra ambientes." }, 403);
      const checked = validateEnvironments(body.items);
      if (checked.error) return json({ error: checked.error }, 400);
      if (!Number.isInteger(body.base) || body.base < 0) return json({ error: "Informe a revisão atual." }, 400);
      const removalError=environmentRemovalError(await snapshotAll(),checked.items,today());
      if(removalError)return json({error:removalError},422);
      const r = await writeDoc("ambientes", { items: checked.items }, by, body.base, "cadastro de ambientes");
      if (!r.conflict) await syncReservations(by);
      return r.conflict ? json({ error: "conflict", ...r.conflict }, 409) : json({ ok: true, rev: r.rev });
    }
    if (me.role === "ambientes") return json({ error: "Este perfil gerencia somente ambientes e reservas." }, 403);
    if (body.op === "user_link") {
      if (!me.master) return json({ error: "Somente a senha mestre vincula contas." }, 403);
      const account = (await q("SELECT role FROM users WHERE login=?", [normLogin(body.login)])).rows[0];
      if (!account || account.role !== "docente") return json({ error: "Selecione uma conta de docente existente." }, 400);
      const name = String(body.docente || "").trim();
      const docs = await snapshotAll();
      if (name && !(docs.geral?.docentes || []).some(d => d.nome === name)) return json({ error: "Docente não cadastrado." }, 400);
      await q("UPDATE users SET docente=?,docente_id=? WHERE login=?", [name || null,docs.geral?.docentes.find(d=>d.nome===name)?.id||null,normLogin(body.login)]);
      return json({ ok: true });
    }
    if(body.op==='management_report'){
      if(me.role!=='coord')return json({error:'Relatórios gerenciais são restritos à coordenação.'},403);
      let report;try{report=managementReport(await snapshotAll(),body.filters,today())}catch(e){return json({error:e.message},400)}
      return json({ok:true,generatedAt:new Date().toISOString(),report,csv:managementCsv(report)});
    }
    if(['planning_preview','planning_apply'].includes(body.op)){
      if(me.role!=='coord')return json({error:'Somente a coordenação usa o planejamento assistido.'},403);
      const id=String(body.turmaId||''),docs=await snapshotAll();let plan;
      try{plan=suggestPlanning(docs,id,body.options)}catch(e){return json({error:e.message},400)}
      const token=createHmac('sha256',SECRET()).update(canon({id,options:body.options,docs})).digest('hex');
      if(body.op==='planning_preview')return json({ok:true,plan,token});
      if(!eq(String(body.token||''),token))return json({error:'Os dados mudaram desde a prévia. Gere novas sugestões antes de aplicar.'},409);
      if(!plan.added)return json({error:'Não há sugestões disponíveis para aplicar.'},400);
      const row=(await q('SELECT rev FROM docs WHERE id=?',[id])).rows[0];
      const data={...docs[id],state:{...docs[id].state,days:{...docs[id].state.days,...Object.fromEntries(plan.changes.map(x=>[x.date,x.day]))}}};
      const result=await writeDoc(id,data,by,Number(row.rev),'Planejamento assistido: '+plan.added+' aulas');
      if(result.conflict)return json({error:'Os dados mudaram. Gere novas sugestões.'},409);
      await syncReservations(by);return json({ok:true,rev:result.rev,added:plan.added});
    }
    if(body.op==='set_many'){
      if(me.role!=='coord')return json({error:'Somente a coordenação salva o planejamento.'},403);
      if(!Array.isArray(body.items)||body.items.length>200||JSON.stringify(body).length>10000000)return json({error:'Lote inválido ou muito grande.'},400);
      const seen=new Set();for(const item of body.items){if(seen.has(item.id))return json({error:'Documento repetido no lote.'},400);seen.add(item.id)}
      const existing=await snapshotAll(),candidate={...existing};
      for(const item of body.items){if(!item||typeof item.id!=='string'||!item.data||typeof item.data!=='object')return json({error:'Documento inválido no lote.'},400);candidate[item.id]=item.data;}
      for(const id of body.deleted||[])delete candidate[id];
      for(const item of body.items)if(item.id.startsWith('turma-')&&item.data.state){const state=item.data.state,error=validateSchedule(state);if(error)return json({error},400);for(const [iso,day] of Object.entries(state.days||{}))if(Array.isArray(day.grade)&&(canon(day)!==canon(existing[item.id]?.state?.days?.[iso])||canon(state.ucs)!==canon(existing[item.id]?.state?.ucs)||canon(state.cfg)!==canon(existing[item.id]?.state?.cfg))){const conflicts=scheduleConflicts(candidate,item.id,state,iso);if(conflicts.length)return json({error:`Conflito em ${iso}: ${conflicts.join(' ')}`},422)}}
      const sorted=[...body.items].sort((a,b)=>(a.id==='geral')-(b.id==='geral'));
      for(const item of sorted){const response=await handleImpl(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({...item,op:'set'})}),candidate);if(!response.ok)return response;}
      for(const id of body.deleted||[]){if(!/^turma-[\w.-]{1,74}$/.test(id)||seen.has(id))return json({error:'Exclusão inválida no lote.'},400);const row=(await q('SELECT data,rev FROM docs WHERE id=?',[id])).rows[0];if(row){if(Number(body.deleteBases?.[id])!==Number(row.rev))return json({error:'conflict',rev:Number(row.rev)},409);await pushHistory(id,String(row.data),by,Number(row.rev),'excluída');await calendarNotification(id,JSON.parse(String(row.data)).state,undefined);await q('DELETE FROM student_access WHERE turma_id=?',[id]);await q('DELETE FROM docs WHERE id=?',[id]);}}
      await syncReservations(by);
      const rows=(await q('SELECT id,rev FROM docs')).rows;return json({ok:true,revs:Object.fromEntries(rows.map(r=>[r.id,Number(r.rev)]))});
    }
    if (body.op === "set") {
      if (["ambientes", "reservas", "bloqueios"].includes(body.id)) return json({ error: "Use o cadastro de ambientes." }, 400);
      if (!/^[\w.-]{1,80}$/.test(body.id || "") || !body.data || typeof body.data !== "object") return json({ error: "bad_request" }, 400);
      if (JSON.stringify(body.data).length > 2_000_000) return json({ error: "too_large" }, 413);
      if (me.role === "docente") {
        const cur = (await q("SELECT data FROM docs WHERE id=?", [body.id])).rows[0];
        const allowed=body.id.startsWith("turma-")&&cur?teacherUpdate(JSON.parse(String(cur.data)),body.data,me):null;
        if(!allowed)return json({error:"Docente só pode registrar as próprias aulas, sem alterar dados de alunos ou de outros docentes."},403);
        body.data=allowed;
      }
      let renames=[];
      if(body.id === "geral"){
        const error=validateDocentes(body.data.docentes);if(error)return json({error},400);
        const previous=(await snapshotAll()).geral?.docentes||[];
        body.data.docentes=body.data.docentes.map(d=>({...d,id:d.id||previous.find(x=>x.nome===d.nome)?.id||randomUUID()}));
        if(new Set(body.data.docentes.map(d=>d.id)).size!==body.data.docentes.length)return json({error:"Identificador de docente repetido."},400);
        renames=previous.flatMap(old=>{const next=body.data.docentes.find(d=>d.id===old.id);return !next?[[old.nome,""]]:next.nome!==old.nome?[[old.nome,next.nome]]:[]});
      }
      if(body.id.startsWith("turma-")&&body.data.state){
        const state=body.data.state,error=validateSchedule(state);if(error)return json({error},400);
        const docs=batchSnapshot||await snapshotAll(),old=(await snapshotAll())[body.id]?.state;
        for(const [iso,day] of Object.entries(state.days||{}))if(Array.isArray(day.grade)&&(JSON.stringify(day)!==JSON.stringify(old?.days?.[iso])||JSON.stringify(state.cfg)!==JSON.stringify(old?.cfg)||JSON.stringify(state.ucs)!==JSON.stringify(old?.ucs))){const conflicts=scheduleConflicts(docs,body.id,state,iso);if(conflicts.length)return json({error:`Conflito em ${iso}: ${conflicts.join(" ")}`},422)}
      }
      const r = await writeDoc(body.id, body.data, by, body.base, body.note);
      if (r.conflict) return json({ error: "conflict", ...r.conflict }, 409);
      if(renames.length){
        const rename=name=>renames.find(([old])=>old===name)?.[1]??name;
        const linked=(await q("SELECT login,docente FROM users WHERE docente IS NOT NULL")).rows;
        for(const account of linked)if(rename(account.docente)!==account.docente)await q("UPDATE users SET docente=? WHERE login=?",[rename(account.docente)||null,account.login]);
        for(const [id,doc] of Object.entries(await snapshotAll()))if(id.startsWith('turma-')&&doc.state){let changed=false;const ucs=doc.state.ucs.map(u=>{const nome=rename(u.docente);if(nome!==u.docente)changed=true;return {...u,docente:nome}});if(changed)await writeDoc(id,{...doc,state:{...doc.state,ucs}},by,undefined,"Vínculo de docente atualizado");}
        const reservations=(await snapshotAll()).reservas;if(reservations)await writeDoc('reservas',{...reservations,items:reservations.items.map(item=>({...item,docente:rename(item.docente)}))},by,undefined,"Vínculo de docente atualizado");
      }
      if(body.id==='geral')await syncTeacherIds(by);
      await syncReservations(by);
      return json({ ok: true, rev: r.rev });
    }
    if (me.role === "docente" && body.op !== "set") return json({ error: "Sem permissão para esta ação." }, 403);
    if (body.op === "delete") {
      const id = String(body.id || "");
      const cur = (await q("SELECT data, rev FROM docs WHERE id=?", [id])).rows[0];
      if (cur) { await pushHistory(id, String(cur.data), by, Number(cur.rev), "excluída"); if(id.startsWith('turma-'))await calendarNotification(id,JSON.parse(String(cur.data)).state,undefined);await q("DELETE FROM student_access WHERE turma_id=?",[id]);
      await q("DELETE FROM docs WHERE id=?", [id]); }
      await syncReservations(by);
      return json({ ok: true });
    }
    if (body.op === "history") {
      const r = await q("SELECT id, doc_id, data, at, by, rev, note FROM history ORDER BY id DESC LIMIT 80");
      return json({ items: r.rows.map((x) => ({ id: Number(x.id), doc: String(x.doc_id), at: String(x.at), by: x.by, rev: Number(x.rev), note: x.note, label: labelOf(String(x.doc_id), String(x.data)) })) });
    }
    if (body.op === "history_detail") {
      if(!Number.isSafeInteger(Number(body.hid))||Number(body.hid)<1)return json({error:'Versão inválida.'},400);
      const h=(await q('SELECT * FROM history WHERE id=?',[Number(body.hid)])).rows[0];
      if(!h)return json({error:'Versão não encontrada.'},404);
      const deleted=/excluída|removida ao restaurar/.test(String(h.note||''));
      const previous=(await q('SELECT data,rev FROM history WHERE doc_id=? AND id<? AND rev<? ORDER BY id DESC LIMIT 1',[h.doc_id,Number(h.id),Number(h.rev)])).rows[0];
      const available=deleted||!!previous||Number(h.rev)===1;
      const snapshot=JSON.parse(String(h.data));
      return json({ok:true,id:Number(h.id),rev:Number(h.rev),by:h.by,at:h.at,deleted,available,
        ...available?historyDiff(deleted?snapshot:previous?JSON.parse(String(previous.data)):undefined,deleted?undefined:snapshot):{changes:[],total:0,truncated:false},
        message:available?'': 'A versão anterior não está mais no histórico; não é possível comparar esta alteração.'});
    }
    if (body.op === "restore") {
      const h = (await q("SELECT doc_id, data FROM history WHERE id=?", [Number(body.hid)])).rows[0];
      if (!h) return json({ error: "Versão não encontrada." }, 404);
      const r = await writeDoc(String(h.doc_id), JSON.parse(String(h.data)), by, undefined, "restaurada");
      await syncReservations(by);
      return json({ ok: true, rev: r.rev });
    }

    /* backups */
    if (body.op === "backup_status") return json({ email: !!(process.env.BACKUP_EMAIL && N.providers().email), semAlunos: !!process.env.BACKUP_EMAIL_SEM_ALUNOS });
    if (body.op === "backup_list") {
      const r = await q("SELECT id, at, kind, by, size, docs_n FROM backups ORDER BY id DESC LIMIT 60");
      return json({ items: r.rows.map((x) => ({ id: Number(x.id), at: String(x.at), kind: String(x.kind), by: x.by, size: Number(x.size), docs: Number(x.docs_n) })) });
    }
    if (body.op === "backup_now") { const r = await runBackup("manual", by, true); return json({ ok: true, ...r }); }
    if (body.op === "backup_download" || body.op === "backup_restore") {
      const b = (await q("SELECT data FROM backups WHERE id=?", [Number(body.id)])).rows[0];
      if (!b) return json({ error: "Backup não encontrado." }, 404);
      const text = gunzipSync(Buffer.from(String(b.data), "base64")).toString();
      const payload = JSON.parse(text);
      if (body.op === "backup_download") {
        if (!me.master) { delete payload.users; delete payload.notifications; }
        return json({ ok: true, data: JSON.stringify(payload) });
      }
      if (payload.users && !me.master) return json({ error: "Somente a senha mestre restaura contas de um backup completo." }, 403);
      const docs = payload.docs || {};
      await runBackup("antes de restaurar", by, true);
      const n = await restoreDocuments(docs, payload.versao === 2, by, "restaurada do backup #" + body.id);
      if (Array.isArray(payload.users)) await restoreAccounts(payload.users);
      if (Array.isArray(payload.notifications)) await restoreNotifications(payload.notifications);
      await syncReservations(by);
      return json({ ok: true, restored: n, accounts: payload.users?.length || 0 });
    }

    /* avisos */
    if (body.op === "notify_status") return json({ ...N.providers(), cron: !!process.env.CRON_SECRET || "netlify-ou-local" });
    if (body.op === "notify_log") {
      const r = await q("SELECT at, turma_id, canal, kind, by, resumo, ok, erro FROM notify_log ORDER BY id DESC LIMIT 40");
      return json({ items: r.rows.map((x) => ({ at: String(x.at), turma: x.turma_id, canal: x.canal, kind: x.kind, by: x.by, resumo: x.resumo, ok: !!x.ok, erro: x.erro })) });
    }
    if (body.op === "notify_preview" || body.op === "notify_send" || body.op === "notify_baseline") {
      const { geral, turmas } = await loadTurmas(), t = turmas.find(([id]) => id === body.turma);
      if (!t) return json({ error: "Turma não encontrada." }, 404);
      const st = t[1], snap = N.snapshot(st), row = await getBase(t[0]), av = { ...AV0, ...(st.aviso || {}), ...(body.cfg || {}) };
      if (body.op === "notify_baseline") { await setBase(t[0], snap); return json({ ok: true }); }
      const rc = N.recipients(st, geral, av);
      if (body.op === "notify_preview") {
        const lines = row ? N.diffLines(row.base, snap, st, N.todayBR()) : [];
        return json({ ok: true, hasBase: !!row, lines, emails: rc.emails.length, phones: rc.phones.length, text: lines.length ? N.digest(st, lines, alunoLink(geral, t[0])).text : "" });
      }
      const canal = ["email", "whatsapp", "ambos"].includes(body.canal) ? body.canal : av.canal;
      let subject, text, kind;
      if (body.kind === "alterações") {
        const lines = row ? N.diffLines(row.base, snap, st, N.todayBR()) : [];
        if (!lines.length) return json({ error: "Não há alterações pendentes para avisar." }, 400);
        ({ subject, text } = N.digest(st, lines, alunoLink(geral, t[0]))); kind = "alterações";
      } else {
        subject = String(body.assunto || "").trim().slice(0, 150); text = String(body.texto || "").trim().slice(0, 2000); kind = "manual";
        if (!subject || !text) return json({ error: "Preencha o assunto e a mensagem." }, 400);
      }
      const res = await N.deliver(rc, canal, subject, text);
      await logNotify(t[0], canal, kind, by, res);
      if (kind === "alterações" && N.okOf(res)) await setBase(t[0], snap);
      return json({ ok: N.okOf(res), result: res, resumo: N.summary(res), simulated: Object.values(res).some((v) => v.simulated), recipients: { emails: rc.emails.length, phones: rc.phones.length } });
    }

    /* contas: só a senha mestre gerencia */
    if (body.op === "users") {
      if (!me.master) return json({ error: "Somente a senha mestre gerencia contas." }, 403);
      const r = await q("SELECT login, nome, role, docente, created_at, recovery_email FROM users ORDER BY nome");
      return json({ users: r.rows.map((x) => ({ login: String(x.login), nome: String(x.nome), role: String(x.role), docente: x.docente || null, at: String(x.created_at),recoveryEmail:String(x.recovery_email||'') })) });
    }
    if(body.op==='user_recovery_email'){
      if(!me.master)return json({error:'Somente a senha mestre gerencia contas.'},403);
      const email=recoveryEmail(body.email),login=normLogin(body.login);if(!validRecoveryEmail(email))return json({error:'Informe um e-mail válido.'},400);
      const changed=await q('UPDATE users SET recovery_email=? WHERE login=?',[email,login]);if(!changed.rowsAffected)return json({error:'Conta não encontrada.'},404);
      await q('DELETE FROM password_resets WHERE login=?',[login]);return json({ok:true});
    }
    if (body.op === "user_add" || body.op === "user_pw" || body.op === "user_del") {
      if (!me.master) return json({ error: "Somente a senha mestre gerencia contas." }, 403);
      const login = normLogin(body.login);
      if (!/^[a-z0-9._-]{3,40}$/.test(login) || login === "admin") return json({ error: "Login inválido (3 a 40 letras minúsculas, números, ponto, traço ou underline)." }, 400);
      if (body.op === "user_del") { await q("DELETE FROM password_resets WHERE login=?",[login]);await q("DELETE FROM users WHERE login=?", [login]); return json({ ok: true }); }
      const pw = String(body.password || "");
      if (pw.length < 8) return json({ error: "A senha precisa ter ao menos 8 caracteres." }, 400);
      const salt = randomBytes(16).toString("hex"), hash = hashPw(pw, salt);
      if (body.op === "user_add") {
        const email=recoveryEmail(body.recoveryEmail);if(!validRecoveryEmail(email))return json({error:'Informe um e-mail de recuperação válido.'},400);
        const nome = String(body.nome || "").trim().slice(0, 80) || login;
        if ((await q("SELECT 1 FROM users WHERE login=?", [login])).rows.length) return json({ error: "Esse login já existe." }, 409);
        await q("INSERT INTO users(login,nome,salt,hash,created_at,role,session_key) VALUES(?,?,?,?,?,?,?)", [login, nome, salt, hash, new Date().toISOString(), ["docente", "ambientes"].includes(body.role) ? body.role : "coord",randomUUID()]);
        await q('UPDATE users SET recovery_email=? WHERE login=?',[email,login]);
      } else await q("UPDATE users SET salt=?, hash=?,session_key=? WHERE login=?", [salt, hash,randomUUID(),login]);
      await q('DELETE FROM password_resets WHERE login=?',[login]);
      return json({ ok: true });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    markFailure(e);
    return json({ error: 'Não foi possível concluir a operação. Referência: '+(diagnosticContext.getStore()?.reference||'indisponível') }, 500);
  }
}

async function reservationNotification(item) {
  const target = item.status === "pendente" ? "@gestores" : item.login;
  await q("INSERT INTO notifications(target,message,reservation_id,at) VALUES(?,?,?,?)", [target, `${item.status === "revisao" ? "Reserva precisa de revisão" : "Reserva " + item.status}: ${item.ambienteNome} • ${item.data} • ${item.docente}`, item.id, new Date().toISOString()]);
}
async function calendarNotification(id,before,after){
 const accounts=(await q("SELECT login,role,docente FROM users WHERE role='docente'")).rows;
 for(const item of calendarNotifications(before,after,accounts,today()))await q("INSERT INTO notifications(target,message,kind,doc_id,at) VALUES(?,?,'calendario',?,?)",[item.target,item.message,id,new Date().toISOString()]);
}
async function syncReservations(by) {
  const docs = await snapshotAll(), items = docs.reservas?.items || [];
  const next = synchronize(docs, items, by);
  if (JSON.stringify(next) !== JSON.stringify(items)) {
    await writeDoc("reservas", { items: next }, by, undefined, "sincronização de reservas");
    for (let i=0;i<next.length;i++) if(next[i].status !== items[i].status) await reservationNotification(next[i]);
  }
}
async function restoreDocuments(docs, complete, by, note) {
  await q("DELETE FROM student_access");
  if (!docs || typeof docs !== "object" || Array.isArray(docs)) throw new Error("Documentos inválidos no backup.");
  if (complete) {
    const rows = (await q("SELECT id,data,rev FROM docs")).rows;
    for (const r of rows) if (!Object.hasOwn(docs, String(r.id))) {
      await pushHistory(String(r.id),String(r.data),by,Number(r.rev),"removida ao restaurar snapshot completo");
      if(String(r.id).startsWith('turma-'))await calendarNotification(String(r.id),JSON.parse(String(r.data)).state,undefined);
      await q("DELETE FROM docs WHERE id=?",[String(r.id)]);
    }
  }
  let count = 0;
  for (const [id,data] of Object.entries(docs)) { await writeDoc(id,data,by,undefined,note); count++; }
  return count;
}
async function restoreAccounts(users) {
  if(users.some(u=>!validRecoveryEmail(recoveryEmail(u.recovery_email))))throw new Error('E-mail de recuperação inválido no backup.');
  if (users.some(u => !/^[a-z0-9._-]{3,40}$/.test(u.login) || u.login === "admin" || !["coord","docente","ambientes"].includes(u.role) || typeof u.hash !== "string" || !/^[a-f0-9]{64}$/.test(u.hash) || !/^[a-f0-9]{32}$/.test(u.salt))) throw new Error("Contas inválidas no backup.");
  await q("DELETE FROM users");
  await q('DELETE FROM password_resets');
  for (const u of users) await q("INSERT INTO users(login,nome,salt,hash,role,docente,docente_id,created_at,session_key) VALUES(?,?,?,?,?,?,?,?,?)", [u.login,u.nome,u.salt,u.hash,u.role,u.docente || null,u.docente_id||null,u.created_at,randomUUID()]);
  for(const u of users)await q('UPDATE users SET recovery_email=? WHERE login=?',[recoveryEmail(u.recovery_email),u.login]);
}
async function restoreNotifications(items) {
  await q("DELETE FROM notifications");
  for (const n of items) await q("INSERT INTO notifications(id,target,message,reservation_id,at,seen,kind,doc_id,dismissed) VALUES(?,?,?,?,?,?,?,?,?)", [n.id,n.target==='gestores'&&String(n.message).startsWith('Reserva pendente:')?'@gestores':n.target,n.message,n.reservation_id || null,n.at,n.seen || "[]",n.kind||'reserva',n.doc_id||null,n.dismissed||'[]']);
}
async function inWriteTransaction(work) {
  const prior = writeQueue;
  let release; writeQueue = new Promise(resolve => { release = resolve; });
  await prior;
  let tx;
  try {
    tx = await _db.transaction("write");
    const result = await context.run(tx, work);
    if (result instanceof Response && result.status >= 400) await tx.rollback();
    else await tx.commit();
    return result;
  } catch (e) { if (tx) await tx.rollback(); throw e; }
  finally { if (tx) tx.close(); release(); }
}
function recoverySite(){
 try{const site=new URL(process.env.PUBLIC_URL);if(site.username||site.password||!(site.protocol==='https:'||site.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(site.hostname)))return null;return site}catch{return null}
}
async function passwordRecovery(req,body){
 try{
  const enabled=!!(N.providers().email&&recoverySite());
  if(body.op==='password_reset_status')return json({enabled});
  if(body.op==='password_reset_confirm')return await inWriteTransaction(async()=>{
   const token=String(body.token||''),password=String(body.password||'');
   if(password.length<8||password.length>1024)return json({error:'Use uma senha de 8 a 1024 caracteres.'},400);
   if(!/^[a-f0-9]{64}$/.test(token))return json({error:'Link inválido ou expirado. Solicite outro link.'},400);
   const hash=createHash('sha256').update(token).digest('hex'),reset=(await q('SELECT r.login,r.session_key FROM password_resets r JOIN users u ON u.login=r.login AND u.session_key=r.session_key WHERE r.token_hash=? AND r.expires_at>?',[hash,Date.now()])).rows[0];
   if(!reset)return json({error:'Link inválido ou expirado. Solicite outro link.'},400);
   const salt=randomBytes(16).toString('hex'),changed=await q('UPDATE users SET salt=?,hash=?,session_key=? WHERE login=? AND session_key=?',[salt,hashPw(password,salt),randomUUID(),reset.login,reset.session_key]);if(!changed.rowsAffected)return json({error:'Link inválido ou expirado. Solicite outro link.'},400);await q('DELETE FROM password_resets WHERE login=?',[reset.login]);
   return json({ok:true},200,{'set-cookie':'plan_sess=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'+(new URL(req.url).protocol==='https:'?'; Secure':'')});
  });
  if(!enabled)return json({error:'Recuperação por e-mail indisponível. Procure a coordenação.'},503);
  const started=Date.now(),prepared=await inWriteTransaction(async()=>{
   const now=Date.now(),window=15*60*1000,login=normLogin(body.login).slice(0,80),email=recoveryEmail(body.email),ip=String(req.headers.get('x-forwarded-for')||'local').split(',')[0].trim().slice(0,80);
   await q('DELETE FROM password_reset_limits WHERE window_start<?',[now-window]);await q('DELETE FROM password_resets WHERE expires_at<=?',[now]);
   let allowed=true;for(const [key,limit] of [['login:'+login,5],['ip:'+ip,50]]){const digest=createHash('sha256').update(key).digest('hex'),row=(await q('SELECT attempts FROM password_reset_limits WHERE key=?',[digest])).rows[0];if(Number(row?.attempts||0)>=limit)allowed=false;await q('INSERT INTO password_reset_limits(key,window_start,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1',[digest,now])}
   if(!allowed||!email||!validRecoveryEmail(email))return null;
   const account=(await q('SELECT login,recovery_email,session_key FROM users WHERE login=?',[login])).rows[0];if(!account||!account.recovery_email||!eq(email,account.recovery_email))return null;
   const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');await q('DELETE FROM password_resets WHERE login=?',[login]);await q('INSERT INTO password_resets(token_hash,login,session_key,expires_at) VALUES(?,?,?,?)',[hash,login,account.session_key,now+window]);return {token,hash,email:account.recovery_email};
  });
  if(prepared){const link=new URL('/recuperar.html',recoverySite());link.hash='token='+prepared.token;const result=await N.sendMail([prepared.email],'Redefinição de senha · Agenda SENAI',`Foi solicitada a redefinição da sua senha na Agenda SENAI.\n\nAbra o link para escolher uma nova senha:\n${link.href}\n\nO link expira em 15 minutos e funciona uma única vez. Se você não solicitou a alteração, ignore esta mensagem.`);if(!result.sent){await inWriteTransaction(()=>q('DELETE FROM password_resets WHERE token_hash=?',[prepared.hash]));await queueIncident({source:'servico',category:'servicos',severity:'erro',operation:'recovery_email',status:0,code:'SERVICE_FAILURE'})}}
  if(Date.now()-started<350)await new Promise(r=>setTimeout(r,350-(Date.now()-started)));
  return json({ok:true,message:'Se os dados corresponderem a uma conta com recuperação habilitada, você receberá um link por e-mail. Confira também o spam. Se não receber, procure a coordenação.'});
 }catch{return json({error:'Não foi possível concluir a recuperação. Tente novamente ou procure a coordenação.'},503)}
}
async function handleRequest(req) {
  try{await ready()}catch(e){markFailure(e);return json({error:failureCode(e)==="CONFIGURATION_FAILURE"?e.message:"O servidor está indisponível. Tente novamente."},500)}
  const op = req.method === "POST" ? (await req.clone().json().catch(() => ({}))).op : null;
  if(['password_reset_status','password_reset_request','password_reset_confirm'].includes(op))return passwordRecovery(req,await req.json());
  if ((req.method === "POST" && !["login","logout"].includes(op)) || new URL(req.url).searchParams.has("cron") || ["xlsx","docente-xlsx","docente-preview","turma-preview"].includes(new URL(req.url).searchParams.get("export"))) {
    return inWriteTransaction(() => handleImpl(req));
  }
  return handleImpl(req);
}
export async function handle(req){
 const url=new URL(req.url),body=req.method==='POST'?await req.clone().json().catch(()=>({})):null;
 const rawOperation=req.method==='POST'?body?.op:url.searchParams.get('export')||(url.searchParams.has('ics')?'ics':url.searchParams.has('cron')?'cron':'load');
 const operation=String(rawOperation||'api'),reference=randomUUID();
 return diagnosticContext.run({reference,code:null,pending:new Map()},async()=>{
  const state=diagnosticContext.getStore();let response;
  try{response=await handleRequest(req)}catch(e){markFailure(e);response=json({error:'Não foi possível concluir a operação. Referência: '+reference},500)}
  const incident=responseIncident(operation,response.status,state.code);
  if(incident){const key=incidentKey(incident);state.pending.set(key,{event:incident,count:(state.pending.get(key)?.count||0)+1})}
  for(const {event,count} of state.pending.values()){
   if(diagnosticsReady)try{await inWriteTransaction(()=>storeIncident(event,reference,count))}catch{console.warn('Diagnóstico indisponível. Código: '+event.code+'; referência: '+reference)}
   else console.warn('Diagnóstico indisponível. Código: '+event.code+'; referência: '+reference);
  }
  const headers=new Headers(response.headers);headers.set('x-request-id',reference);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 });
}
export async function restoreBackupPayload(payload, by="Restauração por arquivo") {
  await ready();
  if (!payload?.docs || typeof payload.docs !== "object" || Array.isArray(payload.docs)) throw new Error("Backup inválido.");
  return inWriteTransaction(async () => {
    await runBackup("antes de restaurar", by, true);
    await restoreDocuments(payload.docs, payload.versao === 2, by, "restauração por arquivo");
    if(Array.isArray(payload.users))await restoreAccounts(payload.users);
    if(Array.isArray(payload.notifications))await restoreNotifications(payload.notifications);
    await syncReservations(by);
  });
}
