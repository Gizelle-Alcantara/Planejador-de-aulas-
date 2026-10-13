// Rodar: npm test   (usa um banco temporário em arquivo)
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.TURSO_DATABASE_URL = "file:" + join(mkdtempSync(join(tmpdir(), "pl-")), "t.db");
process.env.ADMIN_PASSWORD = "mestre-123";
process.env.SESSION_SECRET = "segredo-de-teste";
const { handle } = await import("../lib/core.js");

const call = (body, cookie) => handle(new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) }));
const get = (qs = "", cookie) => handle(new Request("http://x/api" + qs, { headers: cookie ? { cookie } : {} }));
const login = async (b) => { const r = await call({ op: "login", ...b }); return { r, cookie: (r.headers.get("set-cookie") || "").split(";")[0] }; };

const turma = { state: { cfg: { turma: "T1", curso: "C", turno: "Matutino", aulasDia: 4 }, ucs: [{ sigla: "LOG", nome: "Lógica", ch: 40, docente: "Ana", sala: "Lab 1" }], days: { "2027-03-01": { s: ["LOG"] }, "2027-03-02": { t: "feriado", h: "X" } }, envios: [] } };

test("sem login não grava; senha errada é recusada", async () => {
  assert.equal((await call({ op: "set", id: "geral", data: {} })).status, 401);
  assert.equal((await login({ password: "errada" })).r.status, 401);
});
test("login mestre grava e lê", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const r = await call({ op: "set", id: "turma-t1", data: turma, base: 0 }, cookie);
  assert.equal((await r.json()).rev, 1);
  const j = await (await get()).json();
  assert.equal(j.admin, false);
  assert.equal(j.docs[0].rev, 1);
});
test("conflito de edição simultânea devolve 409 com a versão atual", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const a = await (await call({ op: "set", id: "turma-t1", data: { ...turma, x: 1 }, base: 1 }, cookie)).json();
  assert.equal(a.rev, 2);
  const r = await call({ op: "set", id: "turma-t1", data: { ...turma, x: 2 }, base: 1 }, cookie);
  assert.equal(r.status, 409);
  assert.equal((await r.json()).rev, 2);
});
test("histórico lista versões e restaura", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const h = await (await call({ op: "history" }, cookie)).json();
  assert.ok(h.items.length >= 2);
  const first = h.items[h.items.length - 1];
  assert.equal((await (await call({ op: "restore", hid: first.id }, cookie)).json()).ok, true);
  const j = await (await get()).json();
  assert.equal(j.docs.find((d) => d.id === "turma-t1").data.x, undefined);
});
test("exclusão guarda cópia no histórico", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  await call({ op: "set", id: "turma-del", data: turma, base: 0 }, cookie);
  await call({ op: "delete", id: "turma-del" }, cookie);
  const h = await (await call({ op: "history" }, cookie)).json();
  assert.ok(h.items.some((i) => i.doc === "turma-del" && i.note === "excluída"));
});
test("contas: só a mestre cria; conta própria edita mas não gerencia", async () => {
  const m = await login({ password: "mestre-123" });
  assert.equal((await call({ op: "user_add", login: "maria", nome: "Maria", password: "curta" }, m.cookie)).status, 400);
  assert.equal((await call({ op: "user_add", login: "maria", nome: "Maria", password: "senha-longa-1" }, m.cookie)).status, 200);
  const u = await login({ login: "maria", password: "senha-longa-1" });
  assert.equal(u.r.status, 200);
  assert.equal((await call({ op: "set", id: "geral", data: { docentes: [] }, base: 0 }, u.cookie)).status, 200);
  assert.equal((await call({ op: "users" }, u.cookie)).status, 403);
  assert.equal((await login({ login: "maria", password: "errada-123" })).r.status, 401);
  const info = await (await get("", u.cookie)).json();
  assert.equal(info.user.nome, "Maria");
});
test("agenda .ics da turma e do docente", async () => {
  await (async () => { const { cookie } = await login({ password: "mestre-123" }); await call({ op: "set", id: "geral", data: { docentes: [{ nome: "Ana" }] }, base: 1 }, cookie); })();
  const t = await (await get("?ics=turma-t1")).text();
  assert.match(t, /DTSTART;TZID=America\/Bahia:20270301T073000/);
  assert.match(t, /DTEND;TZID=America\/Bahia:20270301T114300|DTEND;TZID=America\/Bahia:20270301T113000/);
  assert.doesNotMatch(t, /20270302/);
  const d = await (await get("?ics=docente-ana")).text();
  assert.match(d, /SUMMARY:LOG/);
  assert.equal((await get("?ics=turma-nao-existe")).status, 404);
});

test("visitante não recebe alunos nem faltas; logado recebe", async () => {
  const m = await login({ password: "mestre-123" });
  const st = { ...turma.state, alunos: [{ id: "a1", nome: "Aluno Secreto" }], reg: { "2027-03-01": { dado: "sim", faltas: { a1: 2 }, obs: "x", motivo: "m" }, "2027-03-03": { dado: "nao", motivo: "Docente ausente", rep: "2027-03-05" } } };
  const cur = (await (await get("", m.cookie)).json()).docs.find((d) => d.id === "turma-t1");
  await call({ op: "set", id: "turma-t1", base: cur.rev, data: { state: st } }, m.cookie);
  const pub = JSON.stringify(await (await get()).json());
  assert.doesNotMatch(pub, /Aluno Secreto|faltas|Docente ausente|"obs"/);
  assert.match(pub, /"dado":"nao"/);
  assert.match(JSON.stringify(await (await get("", m.cookie)).json()), /Aluno Secreto/);
});
test("conta de docente só altera chamada e alunos", async () => {
  const m = await login({ password: "mestre-123" });
  assert.equal((await call({ op: "user_add", login: "prof", nome: "Prof", password: "senha-docente-1", role: "docente" }, m.cookie)).status, 200);
  const d = await login({ login: "prof", password: "senha-docente-1" });
  const cur = (await (await get("", d.cookie)).json()).docs.find((x) => x.id === "turma-t1");
  const ok = await call({ op: "set", id: "turma-t1", base: cur.rev, data: { ...cur.data, state: { ...cur.data.state, reg: { ...cur.data.state.reg, "2027-03-09": { dado: "sim" } } } } }, d.cookie);
  assert.equal(ok.status, 200);
  const cur2 = (await (await get("", d.cookie)).json()).docs.find((x) => x.id === "turma-t1");
  const bad = await call({ op: "set", id: "turma-t1", base: cur2.rev, data: { ...cur2.data, state: { ...cur2.data.state, cfg: { ...cur2.data.state.cfg, coord: "X" } } } }, d.cookie);
  assert.equal(bad.status, 403);
  assert.equal((await call({ op: "delete", id: "turma-t1" }, d.cookie)).status, 403);
  assert.equal((await call({ op: "history" }, d.cookie)).status, 403);
  assert.equal((await call({ op: "set", id: "geral", base: 1, data: { docentes: [] } }, d.cookie)).status, 403);
});
test("agenda ignora aula não dada", async () => {
  const t = await (await get("?ics=turma-t1")).text();
  assert.match(t, /20270301T/);
});

/* ---------- avisos ---------- */
const { runCron, runDaily, runBackup } = await import("../lib/core.js");
const nst = (extra = {}) => ({ state: { cfg: { turma: "N1", curso: "Curso N", turno: "Vespertino", aulasDia: 4, destinatarios: "lista@x.com" }, ucs: [{ sigla: "LOG", nome: "Lógica", ch: 40, docente: "Ana", sala: "Lab 2" }, { sigla: "BD", nome: "Banco", ch: 40, docente: "Beto" }],
  alunos: [{ id: "a1", nome: "Maria", email: "maria@x.com", tel: "(75) 99999-0001" }, { id: "a2", nome: "Sem Contato" }],
  days: { "2027-03-02": { s: ["LOG"] }, "2027-03-04": { s: ["BD"] } }, reg: {}, aviso: { auto: true, lembrete: true, canal: "ambos", alunos: true, docentes: true, lista: true }, ...extra } });
const setDoc = async (cookie, id, data) => { const cur = (await (await get("", cookie)).json()).docs.find((d) => d.id === id); return call({ op: "set", id, base: cur ? cur.rev : 0, data }, cookie); };

test("avisos: sem chaves o envio é simulado e fica no histórico", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  await setDoc(cookie, "geral", { docentes: [{ nome: "Ana", email: "ana@x.com", tel: "75 98888-0002" }, { nome: "Beto", email: "beto@x.com" }], base: "https://site.exemplo" });
  await setDoc(cookie, "turma-n1", nst());
  const st = await (await call({ op: "notify_status" }, cookie)).json();
  assert.equal(st.email, false);
  const r = await (await call({ op: "notify_send", turma: "n1", kind: "manual", assunto: "Teste", texto: "Olá", canal: "ambos" }, cookie)).json();
  assert.equal(r.simulated, true);
  assert.equal(r.recipients.emails, 4); // Maria, Ana, Beto, lista
  assert.equal(r.recipients.phones, 2); // Maria, Ana
  const lg = await (await call({ op: "notify_log" }, cookie)).json();
  assert.equal(lg.items[0].kind, "manual");
});
test("avisos: e-mail e WhatsApp chamam os serviços com o formato certo", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  Object.assign(process.env, { RESEND_API_KEY: "re_x", MAIL_FROM: "SENAI <a@b.com>", WHATSAPP_TOKEN: "tk", WHATSAPP_PHONE_ID: "123", WHATSAPP_TEMPLATE: "aviso_calendario" });
  const calls = []; const real = globalThis.fetch;
  globalThis.fetch = async (u, o) => { calls.push({ u: String(u), o }); return new Response("{}", { status: 200 }); };
  try {
    const r = await (await call({ op: "notify_send", turma: "n1", kind: "manual", assunto: "Aviso", texto: "Linha 1\nLinha 2", canal: "ambos" }, cookie)).json();
    assert.equal(r.ok, true); assert.equal(r.simulated, false);
    const mail = calls.find((c) => c.u.includes("resend.com")); const sent = JSON.parse(mail.o.body);
    assert.equal(sent.length, 4); assert.equal(mail.o.headers.authorization, "Bearer re_x"); assert.deepEqual(sent[0].to.length, 1);
    const w = calls.filter((c) => c.u.includes("graph.facebook.com/v21.0/123/messages"));
    assert.equal(w.length, 2);
    const wb = JSON.parse(w[0].o.body); assert.match(wb.to, /^55\d{10,11}$/); assert.equal(wb.template.name, "aviso_calendario");
    assert.doesNotMatch(wb.template.components[0].parameters[0].text, /\n/);
  } finally { globalThis.fetch = real; }
});
test("avisos: falha do serviço é registrada", async () => {
  const { cookie } = await login({ password: "mestre-123" }); const real = globalThis.fetch;
  globalThis.fetch = async () => new Response("erro", { status: 422 });
  try {
    const r = await (await call({ op: "notify_send", turma: "n1", kind: "manual", assunto: "A", texto: "B", canal: "email" }, cookie)).json();
    assert.equal(r.ok, false);
    const lg = await (await call({ op: "notify_log" }, cookie)).json();
    assert.equal(lg.items[0].ok, false); assert.match(lg.items[0].erro, /Resend 422/);
  } finally { globalThis.fetch = real; }
});
test("avisos: alterações pendentes e agendador (digest único + lembrete)", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const calls = []; const real = globalThis.fetch;
  globalThis.fetch = async (u, o) => { calls.push(String(u)); return new Response("{}", { status: 200 }); };
  try {
    const NOW = new Date("2027-03-01T23:00:00Z"); // 20:00 em Salvador
    await runCron(NOW); // primeira passada: só registra a base
    assert.equal(calls.length, 0);
    const p0 = await (await call({ op: "notify_preview", turma: "n1" }, cookie)).json();
    assert.equal(p0.lines.length, 0);
    const cur = (await (await get("", cookie)).json()).docs.find((d) => d.id === "turma-n1");
    const s = cur.data.state; s.days["2027-03-04"] = { s: ["BD"] }; s.reg = { "2027-03-04": { dado: "nao", motivo: "Docente ausente" } };
    s.days["2027-03-09"] = { s: ["BD"], t: "nota", h: "Reposição de 04/03/2027" }; s.reg["2027-03-04"].rep = "2027-03-09";
    await call({ op: "set", id: "turma-n1", base: cur.rev, data: { state: s } }, cookie);
    const p1 = await (await call({ op: "notify_preview", turma: "n1" }, cookie)).json();
    assert.equal(p1.lines.length, 2); assert.match(p1.lines.join("|"), /não será dada/); assert.match(p1.lines.join("|"), /reposição/);
    const out = await runCron(NOW);
    const kinds = out.map((o) => o.kind).sort(); assert.deepEqual(kinds, ["alterações", "lembrete"]);
    assert.ok(calls.some((c) => c.includes("resend.com")) && calls.some((c) => c.includes("graph.facebook.com")));
    const n = calls.length; const again = await runCron(NOW);
    assert.equal(again.length, 0); assert.equal(calls.length, n); // nada repetido
    const lg = await (await call({ op: "notify_log" }, cookie)).json();
    assert.ok(lg.items.some((i) => i.kind === "lembrete" && i.by.includes("agendado")));
  } finally { globalThis.fetch = real; }
});
test("agendador por HTTP exige CRON_SECRET; visitante não vê contatos", async () => {
  assert.equal((await get("?cron=1")).status, 401);
  process.env.CRON_SECRET = "cron-segredo";
  assert.equal((await handle(new Request("http://x/api?cron=1", { headers: { authorization: "Bearer errado" } }))).status, 401);
  assert.equal((await handle(new Request("http://x/api?cron=1", { headers: { authorization: "Bearer cron-segredo" } }))).status, 200);
  const pub = JSON.stringify(await (await get()).json());
  assert.doesNotMatch(pub, /ana@x\.com|98888|maria@x\.com|lista@x\.com/);
  const { cookie } = await login({ login: "prof", password: "senha-docente-1" });
  assert.equal((await call({ op: "notify_send", turma: "n1", kind: "manual", assunto: "x", texto: "y" }, cookie)).status, 403);
});

/* ---------- backup agendado ---------- */
test("backup: manual cria, agendado não duplica sem mudanças, mas cria se mudou", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const m = await (await call({ op: "backup_now" }, cookie)).json(); assert.equal(m.ok, true); assert.ok(m.docs >= 2);
  const s1 = await runBackup("agendado", "Sistema"); assert.match(s1.skipped, /sem alterações/);
  await call({ op: "set", id: "turma-bk", base: 0, data: nst() }, cookie);
  const s2 = await runBackup("agendado", "Sistema"); assert.equal(s2.saved, true);
  const l = await (await call({ op: "backup_list" }, cookie)).json();
  assert.ok(l.items.length >= 2); assert.equal(l.items[0].kind, "agendado");
});
test("backup: baixar e restaurar desfaz uma edição ruim e guarda cópia de segurança", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const id = (await (await call({ op: "backup_list" }, cookie)).json()).items[0].id;
  const dl = await (await call({ op: "backup_download", id }, cookie)).json();
  const parsed = JSON.parse(dl.data); assert.ok(parsed.docs["turma-bk"]);
  // estrago: apaga alunos da turma
  const cur = (await (await get("", cookie)).json()).docs.find((d) => d.id === "turma-bk");
  await call({ op: "set", id: "turma-bk", base: cur.rev, data: { state: { ...cur.data.state, alunos: [] } } }, cookie);
  const r = await (await call({ op: "backup_restore", id }, cookie)).json(); assert.equal(r.ok, true);
  const after = (await (await get("", cookie)).json()).docs.find((d) => d.id === "turma-bk");
  assert.equal(after.data.state.alunos.length, 2);
  const l = await (await call({ op: "backup_list" }, cookie)).json();
  assert.ok(l.items.some((i) => i.kind === "antes de restaurar"));
  assert.equal((await call({ op: "backup_restore", id: 999999 }, cookie)).status, 404);
});
test("backup: retenção mantém 30 recentes e o primeiro de cada mês", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  for (let i = 0; i < 34; i++) await call({ op: "backup_now" }, cookie);
  const l = await (await call({ op: "backup_list" }, cookie)).json();
  assert.ok(l.items.length <= 30 + 1); // 30 recentes + 1º do mês (mesmo mês das recentes pode coincidir)
  assert.ok(l.items.length >= 30);
});
test("backup: cópia por e-mail aos domingos com anexo (e sem alunos se pedido)", async () => {
  Object.assign(process.env, { RESEND_API_KEY: "re_x", MAIL_FROM: "SENAI <a@b.com>", BACKUP_EMAIL: "coord@x.com" });
  const calls = []; const real = globalThis.fetch;
  globalThis.fetch = async (u, o) => { calls.push({ u: String(u), body: o && o.body ? JSON.parse(o.body) : null }); return new Response("{}", { status: 200 }); };
  try {
    const SUNDAY = new Date("2027-03-07T23:00:00Z"), MONDAY = new Date("2027-03-08T23:00:00Z");
    const mon = await runDaily(MONDAY); assert.equal(mon.email, undefined);
    const sun = await runDaily(SUNDAY); assert.equal(sun.email.sent, 1);
    const mail = calls.find((c) => c.body && c.body.attachments);
    assert.equal(mail.body.to[0], "coord@x.com"); assert.match(mail.body.attachments[0].filename, /^backup-planejador-2027-03-07\.json$/);
    const att = JSON.parse(Buffer.from(mail.body.attachments[0].content, "base64").toString());
    assert.ok(att.docs["turma-n1"].state.alunos.length > 0);
    process.env.BACKUP_EMAIL_SEM_ALUNOS = "1";
    calls.length = 0; await runDaily(SUNDAY);
    const att2 = JSON.parse(Buffer.from(calls.find((c) => c.body && c.body.attachments).body.attachments[0].content, "base64").toString());
    assert.equal(att2.docs["turma-n1"].state.alunos, undefined);
  } finally { globalThis.fetch = real; delete process.env.BACKUP_EMAIL_SEM_ALUNOS; }
});
test("backup: só coordenador acessa; docente e visitante não", async () => {
  assert.equal((await call({ op: "backup_list" })).status, 401);
  const d = await login({ login: "prof", password: "senha-docente-1" });
  assert.equal((await call({ op: "backup_list" }, d.cookie)).status, 403);
  assert.equal((await call({ op: "backup_download", id: 1 }, d.cookie)).status, 403);
  const r = await (await handle(new Request("http://x/api?cron=1", { headers: { authorization: "Bearer cron-segredo" } }))).json();
  assert.ok(r.result.backup && r.result.avisos !== undefined);
});


test("duas edições concorrentes: só uma grava e a outra recebe a versão vencedora", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  await call({ op: "set", id: "turma-concorrente", data: turma, base: 0 }, cookie);
  const results = await Promise.all(["primeira", "segunda"].map(x => call({ op: "set", id: "turma-concorrente", data: { ...turma, x }, base: 1 }, cookie)));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const conflict = await results.find(r => r.status === 409).json();
  const saved = (await (await get("", cookie)).json()).docs.find(d => d.id === "turma-concorrente");
  assert.equal(saved.rev, 2);
  assert.equal(conflict.rev, saved.rev);
  assert.deepEqual(conflict.data, saved.data);
  const history = await (await call({ op: "history" }, cookie)).json();
  assert.equal(history.items.filter(i => i.doc === "turma-concorrente").length, 2);
});

test("criações concorrentes do mesmo documento não sobrescrevem nem retornam erro interno", async () => {
  const { cookie } = await login({ password: "mestre-123" });
  const results = await Promise.all(["primeira", "segunda"].map(x => call({ op: "set", id: "turma-nova-concorrente", data: { ...turma, x }, base: 0 }, cookie)));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const conflict = await results.find(r => r.status === 409).json();
  assert.equal(conflict.rev, 1);
});

const environment = { id: 'lab-maker', nome: 'Lab Maker', tipo: 'laboratorio', capacidade: 25, ativo: true };
test('ambientes: exige login, valida dados e mantém revisão e histórico', async () => {
  assert.equal((await call({op:'environment_list'})).status,401);
  const {cookie}=await login({password:'mestre-123'});
  assert.equal((await call({op:'environment_save',items:[{...environment,capacidade:0}],base:0},cookie)).status,400);
  assert.equal((await call({op:'environment_save',items:[environment,{...environment,id:'outro',nome:' lab maker '}],base:0},cookie)).status,400);
  assert.equal((await call({op:'environment_save',items:[environment],base:0},cookie)).status,200);
  const list=await (await call({op:'environment_list'},cookie)).json();
  assert.deepEqual(list.items,[environment]); assert.equal(list.rev,1);
  assert.equal((await call({op:'environment_save',items:[],base:0},cookie)).status,409);
  const history=await (await call({op:'history'},cookie)).json();
  assert.ok(history.items.some(i=>i.doc==='ambientes'));
  assert.equal((await call({op:'set',id:'ambientes',data:{items:[]},base:1},cookie)).status,400);
  const teacher=await login({login:'prof',password:'senha-docente-1'});
  assert.equal((await call({op:'environment_list'},teacher.cookie)).status,200);
  assert.equal((await call({op:'environment_save',items:[],base:1},teacher.cookie)).status,403);
});
test('vínculo: só mestre vincula docente cadastrado; consulta usa identidade da conta', async () => {
  const master=await login({password:'mestre-123'});
  await setDoc(master.cookie,'geral',{docentes:[{nome:'Ana'},{nome:'Beto'}]});
  assert.equal((await call({op:'user_link',login:'prof',docente:'Inexistente'},master.cookie)).status,400);
  assert.equal((await call({op:'user_link',login:'maria',docente:'Ana'},master.cookie)).status,400);
  const teacher=await login({login:'prof',password:'senha-docente-1'});
  assert.equal((await call({op:'user_link',login:'prof',docente:'Ana'},teacher.cookie)).status,403);
  assert.equal((await call({op:'user_link',login:'prof',docente:'Ana'},master.cookie)).status,200);
  await setDoc(master.cookie,'turma-vinculo',{state:{cfg:turma.state.cfg,ucs:[...turma.state.ucs,{sigla:'BD',nome:'Banco',docente:'Beto'}],days:{'2027-04-01':{s:['LOG']},'2027-04-02':{s:['BD']},'2027-04-03':{t:'feriado',s:['LOG']},'2027-04-04':{s:['LOG']}},reg:{'2027-04-04':{dado:'nao'}}}});
  const lessons=await (await call({op:'my_lessons',docente:'Beto'},teacher.cookie)).json();
  assert.equal(lessons.docente,'Ana');
  assert.deepEqual(lessons.items.filter(i=>i.turmaId==='turma-vinculo').map(i=>i.data),['2027-04-01']);
  assert.equal((await (await get('',teacher.cookie)).json()).user.docente,'Ana');
  const users=await (await call({op:'users'},master.cookie)).json();
  assert.equal(users.users.find(u=>u.login==='prof').docente,'Ana');
  await call({op:'user_link',login:'prof',docente:''},master.cookie);
  assert.deepEqual((await (await call({op:'my_lessons'},teacher.cookie)).json()).items,[]);
});

test('reservas: docente solicita, coordenação decide, cancela e registra histórico', async()=>{
 const m=await login({password:'mestre-123'}),d=await login({login:'prof',password:'senha-docente-1'});
 await call({op:'user_link',login:'prof',docente:'Ana'},m.cookie);
 await setDoc(m.cookie,'turma-reserva',{state:{cfg:turma.state.cfg,ucs:turma.state.ucs,days:{'2099-04-01':{s:['LOG']},'2099-04-02':{s:['LOG']}},reg:{}}});
 const request={op:'reservation_request',turmaId:'turma-reserva',data:'2099-04-01',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Prática de lógica'};
 assert.equal((await call(request)).status,401);
 assert.equal((await call({...request,sigla:'BD'},d.cookie)).status,400);
 const res=await (await call(request,d.cookie)).json();assert.equal(res.item.status,'pendente');
 assert.equal((await call(request,d.cookie)).status,409);
 assert.equal((await call({op:'reservation_decide',id:res.item.id,status:'aprovada'},d.cookie)).status,403);
 assert.equal((await call({op:'reservation_decide',id:res.item.id,status:'recusada'},m.cookie)).status,400);
 assert.equal((await call({op:'reservation_decide',id:res.item.id,status:'aprovada'},m.cookie)).status,200);
 assert.equal((await call({op:'reservation_decide',id:res.item.id,status:'aprovada'},m.cookie)).status,409);
 assert.equal((await call({op:'reservation_cancel',id:res.item.id},d.cookie)).status,200);
 const list=await (await call({op:'reservation_list'},d.cookie)).json();assert.deepEqual(list.items[0].historico.map(h=>h.status),['pendente','aprovada','cancelada']);
 const r2=await (await call({...request,data:'2099-04-02'},d.cookie)).json();
 assert.equal((await call({op:'reservation_decide',id:r2.item.id,status:'recusada',motivo:'Manutenção'},m.cookie)).status,200);
 const publicDocs=await (await get()).json();assert.deepEqual(publicDocs.docs.find(x=>x.id==='reservas').data.items,[]);
});
test('reservas: aprovação concorrente bloqueia sobreposição; revalida aula e calendário',async()=>{
 const m=await login({password:'mestre-123'}),d=await login({login:'prof',password:'senha-docente-1'});
 for(const id of ['turma-ra','turma-rb'])await setDoc(m.cookie,id,{state:{cfg:turma.state.cfg,ucs:turma.state.ucs,days:{'2099-05-01':{s:['LOG']}},reg:{}}});
 const make=async id=>(await (await call({op:'reservation_request',turmaId:id,data:'2099-05-01',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Prática'},d.cookie)).json()).item;
 const a=await make('turma-ra'),b=await make('turma-rb');
 const results=await Promise.all([a,b].map(x=>call({op:'reservation_decide',id:x.id,status:'aprovada'},m.cookie)));
 assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);
 const list=await (await call({op:'reservation_list'},m.cookie)).json();assert.equal(list.items.filter(x=>x.data==='2099-05-01'&&x.status==='aprovada').length,1);
 const pending=list.items.find(x=>x.data==='2099-05-01'&&['pendente','revisao'].includes(x.status));
 await setDoc(m.cookie,pending.turmaId,{state:{...turma.state,days:{},reg:{}}});
 assert.equal((await call({op:'reservation_decide',id:pending.id,status:'aprovada'},m.cookie)).status,409);
 await setDoc(m.cookie,'turma-ocupada',{state:{...turma.state,ucs:[{...turma.state.ucs[0],sala:' Lab Maker '}],days:{'2099-04-01':{s:['LOG']}},reg:{}}});
 assert.equal((await call({op:'reservation_request',turmaId:'turma-reserva',data:'2099-04-01',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Prática'},d.cookie)).status,409);
});

test('reservas: outro docente não consulta nem cancela pedidos de terceiros',async()=>{
 const m=await login({password:'mestre-123'});
 await call({op:'user_add',login:'outroprof',nome:'Outro Professor',password:'senha-docente-2',role:'docente'},m.cookie);
 const d=await login({login:'outroprof',password:'senha-docente-2'});
 const all=await (await call({op:'reservation_list'},m.cookie)).json(),target=all.items.find(r=>r.status==='aprovada');
 assert.ok(target);
 assert.deepEqual((await (await call({op:'reservation_list'},d.cookie)).json()).items,[]);
 assert.equal((await call({op:'reservation_cancel',id:target.id},d.cookie)).status,403);
 assert.deepEqual((await (await get('',d.cookie)).json()).docs.find(x=>x.id==='reservas').data.items,[]);
 assert.equal((await call({op:'set',id:'reservas',data:{items:[]},base:1},m.cookie)).status,400);
});

const nextFixture=async()=>{
 const m=await login({password:'mestre-123'}),d=await login({login:'prof',password:'senha-docente-1'});
 await call({op:'user_link',login:'prof',docente:'Ana'},m.cookie);
 await setDoc(m.cookie,'turma-melhorias',{state:{cfg:turma.state.cfg,ucs:turma.state.ucs,days:{'2099-06-01':{s:['LOG']},'2099-06-02':{s:['LOG']},'2099-06-03':{s:['LOG']}},reg:{}}});
 return {m,d};
};
const requestNew=(cookie,extra={})=>call({op:'reservation_request',turmaId:'turma-melhorias',data:'2099-06-01',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Atividade prática',...extra},cookie);
test('perfil ambientes: decide reservas e cadastra espaços, mas não edita turma nem acessa contas ou backup',async()=>{
 const {m,d}=await nextFixture();
 assert.equal((await call({op:'user_add',login:'gestorlab',nome:'Gestor de ambientes',password:'senha-gestao-1',role:'ambientes'},m.cookie)).status,200);
 const a=await login({login:'gestorlab',password:'senha-gestao-1'});assert.equal(a.r.status,200);
 for(const op of ['users','backup_list','history','notify_log'])assert.equal((await call({op},a.cookie)).status,403);
 assert.equal((await call({op:'set',id:'turma-melhorias',data:turma,base:1},a.cookie)).status,403);
 const e=await (await call({op:'environment_list'},a.cookie)).json();assert.equal((await call({op:'environment_save',items:e.items,base:e.rev},a.cookie)).status,200);
 const r=await (await requestNew(d.cookie)).json();assert.equal((await call({op:'reservation_decide',id:r.item.id,status:'aprovada'},a.cookie)).status,200);
 const safe=await (await get('',a.cookie)).json();assert.ok(!JSON.stringify(safe).includes('Aluno Secreto'));
});
test('sincronização: alterar turno exige revisão e gera aviso sem permitir aprovar diretamente',async()=>{
 const {m}=await nextFixture();
 const before=(await (await call({op:'reservation_list'},m.cookie)).json()).items.find(r=>r.turmaId==='turma-melhorias'&&r.data==='2099-06-01');
 assert.equal(before.status,'aprovada');
 const cur=(await (await get('',m.cookie)).json()).docs.find(x=>x.id==='turma-melhorias');
 await call({op:'set',id:cur.id,base:cur.rev,data:{state:{...cur.data.state,cfg:{...cur.data.state.cfg,turno:'Vespertino'}}}},m.cookie);
 const d=await login({login:'prof',password:'senha-docente-1'});
 const current=(await (await call({op:'reservation_list'},d.cookie)).json()).items.find(r=>r.id===before.id);assert.equal(current.status,'revisao');
 assert.equal((await call({op:'reservation_decide',id:before.id,status:'aprovada'},m.cookie)).status,409);
 const notices=await (await call({op:'notification_list'},d.cookie)).json();assert.ok(notices.items.some(n=>n.reservaId===before.id));
 const notice=notices.items.find(n=>n.reservaId===before.id);await call({op:'notification_read',id:notice.id},d.cookie);
 assert.equal((await (await call({op:'notification_list'},d.cookie)).json()).items.find(n=>n.id===notice.id).lida,true);
});
test('reagendamento conserva histórico, volta a pendente e libera o horário anterior',async()=>{
 const {m,d}=await nextFixture();
 const r=(await (await call({op:'reservation_list'},d.cookie)).json()).items.find(r=>r.turmaId==='turma-melhorias'&&r.data==='2099-06-01');
 const moved=await (await call({op:'reservation_reschedule',id:r.id,turmaId:'turma-melhorias',data:'2099-06-02',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Reposição prática'},d.cookie)).json();
 assert.equal(moved.item.status,'pendente');assert.equal(moved.item.data,'2099-06-02');assert.ok(moved.item.historico.at(-1).anterior);
 assert.equal((await call({op:'reservation_decide',id:r.id,status:'aprovada'},m.cookie)).status,200);
 const board=await (await call({op:'daily_board',data:'2099-06-01'},d.cookie)).json();assert.ok(!board.items.some(x=>x.id===r.id));
 const other=await login({login:'outroprof',password:'senha-docente-2'});
 assert.equal((await call({op:'reservation_reschedule',id:r.id,turmaId:'turma-melhorias',data:'2099-06-03',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Outra'},other.cookie)).status,403);
});
test('bloqueios: validam período e suspendem reserva afetada; removal não aprova automaticamente',async()=>{
 const m=await login({password:'mestre-123'}),d=await login({login:'prof',password:'senha-docente-1'}),a=await login({login:'gestorlab',password:'senha-gestao-1'});
 const block={op:'block_add',ambienteId:'lab-maker',de:'2099-06-02',ate:'2099-06-03',inicio:420,fim:1380,motivo:'Manutenção'};
 assert.equal((await call(block,d.cookie)).status,403);
 assert.equal((await call({...block,de:'2099-02-30'},a.cookie)).status,400);
 assert.equal((await call(block,a.cookie)).status,200);
 const list=await (await call({op:'reservation_list'},d.cookie)).json();assert.equal(list.items.find(r=>r.data==='2099-06-02'&&r.turmaId==='turma-melhorias').status,'revisao');
 assert.equal((await requestNew(d.cookie,{data:'2099-06-03'})).status,409);
 const blocks=await (await call({op:'block_list'},a.cookie)).json();assert.equal((await call({op:'block_remove',id:blocks.items[0].id},a.cookie)).status,200);
 assert.equal((await (await call({op:'reservation_list'},d.cookie)).json()).items.find(r=>r.data==='2099-06-02'&&r.turmaId==='turma-melhorias').status,'revisao');
});
test('grade diária e relatórios: dados por período, sem finalidade compartilhada e sem relatório para docente',async()=>{
 const {m,d}=await nextFixture();
 const r=await (await requestNew(d.cookie,{data:'2099-06-03'})).json();await call({op:'reservation_decide',id:r.item.id,status:'aprovada'},m.cookie);
 const board=await (await call({op:'daily_board',data:'2099-06-03'},d.cookie)).json();assert.ok(board.items.some(x=>x.status==='aprovada'));assert.ok(!JSON.stringify(board).includes('finalidade'));
 assert.equal((await call({op:'reservation_report',de:'2099-06-01',ate:'2099-06-30'},d.cookie)).status,403);
 const report=await (await call({op:'reservation_report',de:'2099-06-01',ate:'2099-06-30'},m.cookie)).json();assert.equal(report.resumo[0].horas,4);assert.equal(report.resumo[0].aprovadas,1);
 const other=await login({login:'outroprof',password:'senha-docente-2'}),notices=await (await call({op:'notification_list'},d.cookie)).json();
 assert.equal((await call({op:'notification_read',id:notices.items[0].id},other.cookie)).status,404);
});
test('backup completo: inclui contas e vínculos, detecta mudanças só de contas e restaura credenciais',async()=>{
 const m=await login({password:'mestre-123'});
 const saved=await (await call({op:'backup_now'},m.cookie)).json();
 const payload=JSON.parse((await (await call({op:'backup_download',id:saved.id},m.cookie)).json()).data);
 assert.equal(payload.versao,2);assert.equal(payload.users.find(u=>u.login==='prof').docente,'Ana');assert.ok(Array.isArray(payload.notifications));assert.ok(!JSON.stringify(payload).includes('senha-docente-1'));
 const coordinator=await login({login:'maria',password:'senha-longa-1'});
 const redacted=JSON.parse((await (await call({op:'backup_download',id:saved.id},coordinator.cookie)).json()).data);assert.ok(!redacted.users);
 assert.equal((await call({op:'backup_restore',id:saved.id},coordinator.cookie)).status,403);
 await call({op:'user_pw',login:'prof',password:'senha-nova-1'},m.cookie);assert.equal((await runBackup('agendado','teste')).saved,true);
 await call({op:'user_link',login:'prof',docente:''},m.cookie);
 assert.equal((await call({op:'backup_restore',id:saved.id},m.cookie)).status,200);
 assert.equal((await login({login:'prof',password:'senha-docente-1'})).r.status,200);
 const users=await (await call({op:'users'},m.cookie)).json();assert.equal(users.users.find(u=>u.login==='prof').docente,'Ana');
});

test('relatório inclui ocupações do calendário e evita contar duas vezes uma aula reservada',async()=>{
 const m=await login({password:'mestre-123'}),d=await login({login:'prof',password:'senha-docente-1'});
 await setDoc(m.cookie,'turma-relatorio-calendario',{state:{...turma.state,ucs:[{...turma.state.ucs[0],sala:'Lab Maker'}],days:{'2099-08-01':{s:['LOG']}},reg:{}}});
 const report=()=>call({op:'reservation_report',de:'2099-08-01',ate:'2099-08-01'},m.cookie).then(r=>r.json());
 assert.equal((await report()).resumo[0].horasCalendario,4);
 const r=await (await call({op:'reservation_request',turmaId:'turma-relatorio-calendario',data:'2099-08-01',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Prática na aula programada'},d.cookie)).json();
 await call({op:'reservation_decide',id:r.item.id,status:'aprovada'},m.cookie);
 const after=await report();assert.equal(after.resumo[0].horas,4);assert.equal(after.resumo[0].horasReservadas,4);assert.equal(after.resumo[0].horasCalendario,0);
});
test('restauração v2 recupera snapshot completo e desfaz documentos criados depois; backup inválido não altera dados',async()=>{
 const m=await login({password:'mestre-123'}),saved=await (await call({op:'backup_now'},m.cookie)).json();
 await setDoc(m.cookie,'turma-depois-do-backup',turma);
 await call({op:'backup_restore',id:saved.id},m.cookie);
 assert.ok(!(await (await get('',m.cookie)).json()).docs.some(d=>d.id==='turma-depois-do-backup'));
 const before=await (await get('',m.cookie)).json();
 const {restoreBackupPayload}=await import('../lib/core.js');
 await assert.rejects(restoreBackupPayload({versao:2,docs:{},users:[{login:'admin'}]}));
 const after=await (await get('',m.cookie)).json();assert.deepEqual(after.docs,before.docs);
});
test('alteração de calendário concorrente com aprovação nunca deixa reserva aprovada com horário antigo',async()=>{
 const m=await login({password:'mestre-123'}),d=await login({login:'prof',password:'senha-docente-1'});
 const data={state:{...turma.state,days:{'2099-09-01':{s:['LOG']}},reg:{}}};await setDoc(m.cookie,'turma-corrida-calendario',data);
 const r=await (await call({op:'reservation_request',turmaId:'turma-corrida-calendario',data:'2099-09-01',sigla:'LOG',ambienteId:'lab-maker',finalidade:'Prática'},d.cookie)).json();
 const cur=(await (await get('',m.cookie)).json()).docs.find(x=>x.id==='turma-corrida-calendario');
 const results=await Promise.all([call({op:'reservation_decide',id:r.item.id,status:'aprovada'},m.cookie),call({op:'set',id:cur.id,base:cur.rev,data:{state:{...data.state,cfg:{...data.state.cfg,turno:'Noturno'}}}},m.cookie)]);
 assert.equal(results[1].status,200);
 const item=(await (await call({op:'reservation_list'},m.cookie)).json()).items.find(x=>x.id===r.item.id);assert.equal(item.status,'revisao');
});

test('download Excel exige login e entrega arquivo do calendário salvo no modelo SENAI',async()=>{
 const query='?export=xlsx&turma=turma-exportacao';assert.equal((await get(query)).status,401);
 const m=await login({password:'mestre-123'});
 const data={state:{...turma.state,cfg:{...turma.state.cfg,inicio:'2099-03-01',termino:'2099-03-31'},days:{'2099-03-01':{s:['LOG']}}}};
 await setDoc(m.cookie,'turma-exportacao',data);
 const r=await get(query,m.cookie);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/spreadsheetml/);assert.match(r.headers.get('content-disposition'),/xlsx/);assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0,2).toString(),'PK');
 assert.equal((await get('?export=xlsx&turma=nao-existe',m.cookie)).status,404);
});
