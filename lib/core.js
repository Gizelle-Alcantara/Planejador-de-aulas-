// Núcleo da API (padrão Web Request/Response). Usado pela Vercel, Netlify e pelo servidor local.
import { createHmac, timingSafeEqual } from "node:crypto";

let _db, _ready;
// Remoto (Turso) usa o cliente "web" (sem módulos nativos, ideal para Vercel/Netlify); arquivo local usa o cliente completo.
async function init() {
  const url = process.env.TURSO_DATABASE_URL || "file:./data/planejador.db";
  const { createClient } = await import(url.startsWith("file:") ? "@libsql/client" : "@libsql/client/web");
  _db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
}
const db = () => _db;
async function ready() {
  if (!_ready) _ready = init().then(() => db().execute("CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)"));
  await _ready;
}

const SECRET = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "troque-isto";
const sign = (v) => createHmac("sha256", SECRET()).update(v).digest("hex");
function makeToken() { const exp = String(Date.now() + 1000 * 60 * 60 * 12); return exp + "." + sign(exp); }
function validToken(t) {
  if (!t) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}
function cookieOf(req, name) {
  const m = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(name + "="));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : "";
}
const isAdmin = (req) => validToken(cookieOf(req, "plan_sess"));
const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export async function handle(req) {
  try {
    await ready();
    if (req.method === "GET") {
      const r = await db().execute("SELECT id, data FROM docs");
      const docs = r.rows.map((x) => ({ id: String(x.id), data: JSON.parse(String(x.data)) }));
      return json({ admin: isAdmin(req), docs });
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const body = await req.json().catch(() => ({}));

    if (body.op === "login") {
      const pw = process.env.ADMIN_PASSWORD;
      if (!pw) return json({ error: "ADMIN_PASSWORD não configurada no servidor." }, 500);
      const a = Buffer.from(String(body.password || "")), b = Buffer.from(pw);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return json({ error: "Senha incorreta." }, 401);
      const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
      return json({ ok: true }, 200, { "set-cookie": `plan_sess=${encodeURIComponent(makeToken())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}` });
    }
    if (body.op === "logout") return json({ ok: true }, 200, { "set-cookie": "plan_sess=; Path=/; HttpOnly; Max-Age=0" });

    if (!isAdmin(req)) return json({ error: "Somente o coordenador pode alterar os dados." }, 401);
    if (body.op === "set") {
      if (!/^[\w.-]{1,80}$/.test(body.id || "") || typeof body.data !== "object") return json({ error: "bad_request" }, 400);
      const js = JSON.stringify(body.data);
      if (js.length > 2_000_000) return json({ error: "too_large" }, 413);
      await db().execute({ sql: "INSERT INTO docs(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at", args: [body.id, js, new Date().toISOString()] });
      return json({ ok: true });
    }
    if (body.op === "delete") {
      await db().execute({ sql: "DELETE FROM docs WHERE id=?", args: [String(body.id || "")] });
      return json({ ok: true });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Erro no servidor: " + (e && e.message) }, 500);
  }
}
