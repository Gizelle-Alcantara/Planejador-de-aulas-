/* Camada de compatibilidade: oferece window.claude (db, user, downloads) usando a API /api.
   O aplicativo foi escrito para esse formato; aqui ele passa a falar com o seu servidor. */
(function () {
  let session = null, loading = null; const revs = {}; let poke = null;
  const api = (body) => fetch("/api", body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" } : { credentials: "same-origin", cache: "no-store" });
  const load = async () => { let r = await api(); if(r.status===401)r=await api(); if (!r.ok) throw new Error("api " + r.status); return r.json(); };
  const keep = (j) => { (j.docs || []).forEach((d) => (revs[d.id] = d.rev)); return j; };
  const first = () => (loading = loading || load().then((j) => (session = keep(j))));
  const BASE = location.origin + "/";

  function db() {
    return {
      collection() {
        return {
          doc(id) {
            return {
              async set(data) {
                const r = await api({ op: "set", id, data, base: revs[id] || 0 });
                if (r.status === 409) {
                  const j = await r.json().catch(() => ({})); revs[id] = j.rev || 0;
                  window.dispatchEvent(new Event("plan-conflict")); if (poke) poke();
                  const e = new Error("conflict"); e.code = "conflict"; throw e;
                }
                if (!r.ok) { const j=await r.json().catch(()=>({})); const e = new Error(j.error||"Não foi possível salvar."); e.code = r.status === 401 ? "invalid_argument" : "error"; throw e; }
                const j = await r.json(); revs[id] = j.rev;
              },
              async delete() { const r = await api({ op: "delete", id }); if (!r.ok) { const e = new Error("write"); e.code = "invalid_argument"; throw e; } delete revs[id]; },
            };
          },
          onSnapshot(cb, errcb) {
            let last = null, stop = false, timer;
            const emit = (j) => {
              const js = JSON.stringify(j.docs);
              if (js === last) return; last = js;
              cb({ metadata: { hasPendingWrites: false }, docs: j.docs.map((d) => { if (d.id === "geral") d.data.base = BASE; return { id: d.id, data: () => d.data }; }) });
            };
            const tick = async (initial) => {
              if (stop) return; clearTimeout(timer);
              try { const j = initial ? await first() : await load(); if(session?.user&&(!j.user||j.user.docenteId!==session.user.docenteId||j.user.role!==session.user.role||j.user.turmaId!==session.user.turmaId)){location.reload();return}session = keep(j); emit(j); } catch (e) { if (initial && errcb) errcb(e); }
              if (!stop) timer = setTimeout(() => tick(false), document.hidden ? 20000 : 5000);
            };
            poke = () => { last = null; tick(false); };
            tick(true);
            return () => { stop = true; clearTimeout(timer); };
          },
        };
      },
    };
  }

  const downloads = {
    save({ filename, data }) {
      return new Promise((ok) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([data], { type: "application/octet-stream" }));
        a.download = filename; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); ok({ status: "saved" });
      });
    },
  };

  async function saveDocs(items,deleted){
    const response=await api({op:'set_many',items:items.map(([id,data])=>({id,data,base:revs[id]||0})),deleted,deleteBases:Object.fromEntries(deleted.map(id=>[id,revs[id]||0]))});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){if(response.status===409){window.dispatchEvent(new Event('plan-conflict'));if(poke)poke()}throw new Error(result.error==='conflict'?'Outra pessoa alterou os dados. Recarregue e confira antes de salvar novamente.':result.error||'Não foi possível salvar.');}
    Object.assign(revs,result.revs||{});for(const id of deleted)delete revs[id];
  }
  window.PLAN = {saveDocs, api: (b) => api(b).then(async (r) => ({ ok: r.ok, status: r.status, ...(await r.json().catch(() => ({}))) })), me: () => first().then((s) => s.user || null) };
  window.claude = {
    async use(name) {
      if (name === "db") return db();
      if (name === "user") { await first(); return { can: () => !!session.admin }; }
      if (name === "downloads") return downloads;
      return null;
    },
  };

  /* Login do coordenador: abra /#login */
  function ui() {
    const st = document.createElement("style");
    st.textContent = ".lg-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99}.lg-box{background:var(--surface,#fff);color:var(--ink,#14202e);border-radius:10px;padding:22px;width:min(92vw,340px);box-shadow:0 10px 40px rgba(0,0,0,.3);font-family:inherit}.lg-box h2{margin:0 0 12px;font-size:1.1rem}.lg-box input{width:100%;padding:10px;border:1px solid var(--line,#ccc);border-radius:6px;margin-bottom:10px;font:inherit;box-sizing:border-box;background:var(--surface2,#fff);color:inherit}.lg-box button{padding:9px 14px;border-radius:6px;border:1px solid var(--accent,#0b5cab);background:var(--accent,#0b5cab);color:#fff;font:inherit;cursor:pointer}.lg-box .x{background:transparent;color:inherit;border-color:var(--line,#ccc);margin-left:6px}.lg-err{color:#b3261e;font-size:.85rem;min-height:1.2em;margin:0 0 8px}.lg-out{position:fixed;right:12px;bottom:12px;z-index:50;padding:6px 12px;border-radius:6px;border:1px solid var(--line,#ccc);background:var(--surface,#fff);color:var(--ink,#14202e);font:inherit;font-size:.8rem;cursor:pointer}";
    document.head.appendChild(st);
    first().then((s) => {
      if (s.user && s.user.role === "ambientes" && new URLSearchParams(location.search).get("visao") !== "calendario") { location.replace("/ambientes.html"); return; }
      if (s.user) {
        const b = document.createElement("button"); b.className = "lg-out"; b.textContent = "Sair (" + ((s.user && s.user.nome) || "coordenador").split(" ")[0] + ")";
        b.onclick = async () => { await api({ op: "logout" }); location.hash = ""; location.reload(); };
        document.body.appendChild(b);
      } else if (["#login","#login-docente","#login-aluno"].includes(location.hash)) {
        const ov = document.createElement("div"); ov.className = "lg-ov";
        ov.innerHTML = '<form class="lg-box" role="dialog" aria-modal="true" aria-label="Acesso ao sistema"><h2>Acesso ao sistema</h2><input type="text" class="lg-user" placeholder="Usuário (deixe vazio para a senha mestre)" autocomplete="username" aria-label="Usuário"><input type="password" placeholder="Senha" autocomplete="current-password" aria-label="Senha"><p class="lg-err" role="alert"></p><button type="submit">Entrar</button><button type="button" class="x">Cancelar</button></form>';
        const student=location.hash==='#login-aluno';
        if(student){ov.querySelector('h2').textContent='Acesso do aluno';ov.querySelector('form').setAttribute('aria-label','Acesso do aluno');ov.querySelector('.lg-user').outerHTML='<label>Código da turma<input class="lg-user" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" required placeholder="Código fornecido pela coordenação"></label>';ov.querySelector('input[type=password]').hidden=true;}
        if(!student){const help=document.createElement("p"),a=document.createElement("a");a.href="/recuperar.html";a.textContent="Esqueci minha senha";help.append(a);ov.firstChild.append(help)}document.body.appendChild(ov);ov.querySelector("input").focus();
        const f = ov.firstChild, inp = f.querySelector("input[type=password]"), err = f.querySelector(".lg-err");
        f.addEventListener("keydown",e=>{if(e.key==="Escape"){location.hash="";return}if(e.key!=="Tab")return;const c=[...f.querySelectorAll("input:not([hidden]),button,a[href]")];if(e.shiftKey&&document.activeElement===c[0]){e.preventDefault();c.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===c.at(-1)){e.preventDefault();c[0].focus()}});
        f.querySelector(".x").onclick = () => { location.hash = ""; };
        f.onsubmit = async (e) => {
          e.preventDefault(); err.textContent = "";
          const submit=f.querySelector('[type=submit]');submit.disabled=true;
          try {
            const r = await api(student?{op:"student_login",code:f.querySelector(".lg-user").value}:{ op: "login", login: f.querySelector(".lg-user").value, password: inp.value }); const j = await r.json().catch(() => ({}));
            if (r.ok) { history.replaceState(null, "", student?"/#aluno":j.user?.role==="docente"?"/#docente":location.pathname); location.reload(); } else err.textContent = j.error || "Não foi possível entrar.";
          } catch {err.textContent="Não foi possível conectar. Tente novamente."} finally {submit.disabled=false}

        };
      }
    }).catch(() => {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ui); else ui();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
})();
