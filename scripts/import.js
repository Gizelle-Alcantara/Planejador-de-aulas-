// Importa dados-atuais/*.json para o banco configurado (.env / variáveis de ambiente).
// Uso: node --env-file=.env scripts/import.js
import { readdir, readFile } from "node:fs/promises";
import { handle } from "../lib/core.js";
const dir = new URL("../dados-atuais/", import.meta.url);
const req = (body, cookie) => new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
const lg = await handle(req({ op: "login", user: "admin", password: process.env.ADMIN_PASSWORD }));
if (!lg.ok) { console.error("Defina ADMIN_PASSWORD no .env"); process.exit(1); }
const cookie = lg.headers.get("set-cookie").split(";")[0];
for (const f of (await readdir(dir)).filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(await readFile(new URL(f, dir), "utf8")), id = f.replace(/\.json$/, "");
  const r = await handle(req({ op: "set", id, data }, cookie));
  console.log(r.ok ? "importado:" : "falhou:", id);
}
