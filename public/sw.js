// Cache simples: a tela e as últimas agendas lidas abrem sem internet. Nunca guarda respostas de coordenador logado.
const CACHE = "planejador-v43-docentes";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if(u.pathname==='/recuperar.html'||u.pathname==='/recovery.js')return;
  if (u.pathname === "/api") return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.ok) {
        let ok = true;
        if (u.pathname === "/api") { try { ok = !(await res.clone().json()).admin; } catch { ok = false; } }
        if (ok) (await caches.open(CACHE)).put(r, res.clone());
      }
      return res;
    } catch (err) {
      const c = await caches.match(r, { ignoreSearch: false }) || (r.mode === "navigate" ? await caches.match("/") : null);
      if (c) return c;
      throw err;
    }
  })());
});
