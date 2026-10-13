// Restaura um arquivo de backup (.json baixado na aba Dados ou recebido por e-mail) no banco configurado.
// Uso: node --env-file=.env scripts/restore-backup.js backup-planejador-2026-10-10.json
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
const file = process.argv[2];
if (!file) { console.error("Informe o arquivo de backup."); process.exit(1); }
const docs = JSON.parse(readFileSync(file, "utf8")).docs;
if (!docs || typeof docs !== "object") { console.error("Arquivo inválido: sem a seção docs."); process.exit(1); }
const db = createClient({ url: process.env.TURSO_DATABASE_URL || "file:./data/planejador.db", authToken: process.env.TURSO_AUTH_TOKEN || undefined });
await db.execute("CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, rev INTEGER NOT NULL DEFAULT 1, updated_by TEXT)");
for (const [id, data] of Object.entries(docs)) {
  await db.execute({ sql: "INSERT INTO docs(id,data,updated_at,rev,updated_by) VALUES(?,?,?,1,'restauração') ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, rev=docs.rev+1, updated_by='restauração'", args: [id, JSON.stringify(data), new Date().toISOString()] });
  console.log("restaurado:", id);
}
