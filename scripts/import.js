// Importa dados-atuais/*.json para o banco configurado (.env / variáveis de ambiente).
// Uso: node --env-file=.env scripts/import.js
import { readdir, readFile } from "node:fs/promises";
import { createClient } from "@libsql/client";
const db = createClient({ url: process.env.TURSO_DATABASE_URL || "file:./data/planejador.db", authToken: process.env.TURSO_AUTH_TOKEN || undefined });
await db.execute("CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)");
const dir = new URL("../dados-atuais/", import.meta.url);
for (const f of (await readdir(dir)).filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(await readFile(new URL(f, dir), "utf8")), id = f.replace(/\.json$/, "");
  await db.execute({ sql: "INSERT INTO docs(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at", args: [id, JSON.stringify(data), new Date().toISOString()] });
  console.log("importado:", id);
}
