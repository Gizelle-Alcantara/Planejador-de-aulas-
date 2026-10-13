// Copia todos os documentos do banco para backups/AAAA-MM-DD.json
// Uso: node --env-file=.env scripts/backup.js
import { mkdirSync, writeFileSync } from "node:fs";
import { handle } from "../lib/core.js";
const lg = await handle(new Request("http://x/api", { method: "POST", body: JSON.stringify({ op: "login", user: "admin", password: process.env.ADMIN_PASSWORD }) }));
if (!lg.ok) { console.error("Defina ADMIN_PASSWORD no .env"); process.exit(1); }
const r = await handle(new Request("http://x/api?backup=1", { headers: { cookie: lg.headers.get("set-cookie").split(";")[0] } }));
mkdirSync("backups", { recursive: true });
const f = "backups/" + new Date().toISOString().slice(0, 10) + ".json";
writeFileSync(f, await r.text()); console.log("Backup salvo em", f);
