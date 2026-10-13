import { readFileSync } from "node:fs";
import { restoreBackupPayload } from "../lib/core.js";
const file = process.argv[2];
if (!file) { console.error("Informe o arquivo de backup."); process.exit(1); }
try { await restoreBackupPayload(JSON.parse(readFileSync(file,"utf8"))); console.log("Documentos, contas e notificações disponíveis no arquivo foram restaurados."); }
catch(e) { console.error(e.message); process.exitCode=1; }
