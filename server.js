// Servidor local / VPS: node server.js  (porta 3000)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handle, runDaily } from "./lib/core.js";
if(!process.env.SESSION_SECRET)throw new Error("Configure SESSION_SECRET para iniciar o servidor com segurança.");
const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon" };
http.createServer(async (rq, rs) => {
  try {
    const url = new URL(rq.url, "http://" + (rq.headers.host || "localhost"));
    if (url.pathname === "/api") {
      const chunks = []; for await (const c of rq) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const res = await handle(new Request(url, { method: rq.method, headers: rq.headers, body: ["GET", "HEAD"].includes(rq.method) ? undefined : body }));
      const h = {}; res.headers.forEach((v, k) => (h[k] = v));
      rs.writeHead(res.status, h); return rs.end(Buffer.from(await res.arrayBuffer()));
    }
    let p = normalize(url.pathname).replace(/^(\.\.[\/\\])+/, ""); if (p === "/" || p === "\\") p = "/index.html";
    const data = await readFile(join(root, p));
    rs.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); rs.end(data);
  } catch { rs.writeHead(404); rs.end("Não encontrado"); }
}).listen(process.env.PORT || 3000, () => console.log("Planejador em http://localhost:" + (process.env.PORT || 3000)));

// Avisos agendados: verifica a cada minuto e roda uma vez por dia às 23:00 UTC (20:00 em Salvador)
let lastRun = "";
setInterval(async () => {
  const n = new Date(), key = n.toISOString().slice(0, 10);
  if (n.getUTCHours() === 23 && n.getUTCMinutes() === 0 && lastRun !== key) { lastRun = key; try { await runDaily(n);console.log('Rotina diária executada. Consulte Diagnóstico para falhas.'); } catch { console.error('Rotina diária não concluída. Consulte Diagnóstico.'); } }
}, 30000);
