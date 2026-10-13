# Planificador de Grupos SENAI — Instalación (Español)

Funciona en **Vercel**, **Netlify** o cualquier servidor con **Node.js 18+**. Los datos se guardan en una base **Turso** (SQLite en la nube, plan gratuito). Solo el coordinador edita (contraseña); alumnos y docentes abren enlaces de solo lectura que se actualizan cada ~5 s.

## 0. Requisitos
- Cuentas gratuitas en [Turso](https://turso.tech), [GitHub](https://github.com) y [Vercel](https://vercel.com) **o** [Netlify](https://netlify.com)
- Node.js 18+ (solo para importar los datos actuales)

## 1. Crear la base (Turso)
Panel: *Create database* → nombre `planejador` → copie la **URL** (`libsql://planejador-suusuario.turso.io`) y genere un **token**.
Alternativa por terminal:
```bash
turso auth login
turso db create planejador
turso db show planejador --url
turso db tokens create planejador
```

## 2. Preparar el proyecto
```bash
cp .env.example .env      # complete las 4 variables
npm install
node --env-file=.env scripts/import.js   # importa los datos actuales (dados-atuais/)
```
| Variable | Función |
|---|---|
| `ADMIN_PASSWORD` | contraseña del coordinador (use una fuerte) |
| `SESSION_SECRET` | texto aleatorio largo que firma la sesión |
| `TURSO_DATABASE_URL` | URL del paso 1 |
| `TURSO_AUTH_TOKEN` | token del paso 1 |

> Para empezar de cero, omita `import`: el sistema parte de la planilla original.

## 3A. Publicar en Vercel
1. Suba la carpeta a un repositorio de GitHub (`.env` no se sube).
2. Vercel: **Add New → Project** → elija el repositorio → **Framework Preset: Other**.
3. Registre las 4 **Environment Variables**.
4. **Deploy** → `https://su-proyecto.vercel.app`.

Terminal: `npm i -g vercel && vercel`, luego `vercel env add ADMIN_PASSWORD` (y las demás) y `vercel --prod`.

## 3B. Publicar en Netlify
1. Suba a GitHub. Netlify: **Add new site → Import an existing project**.
2. Build command `node scripts/build.js`, publish directory `public` (ya definidos en `netlify.toml`).
3. **Site configuration → Environment variables**: registre las 4 variables.
4. **Deploy** → `https://su-sitio.netlify.app`.

Terminal: `npm i -g netlify-cli && netlify deploy --prod` (variables con `netlify env:set NOMBRE valor`).

## 3C. Servidor propio / VPS
```bash
npm install
node --env-file=.env server.js        # http://localhost:3000
```
Sin `TURSO_DATABASE_URL` usa el archivo local `data/planejador.db`. Manténgalo activo con `pm2 start server.js` y ponga Nginx/Caddy con HTTPS delante.

## 4. Uso
- **Coordinador:** abra `https://su-dirección/#login` e ingrese la contraseña. Aparece el botón "Sair" abajo a la derecha.
- **Alumnos:** pestaña *Compartilhar* → enlace/código QR del grupo.
- **Docentes:** pestaña *Compartilhar* → enlace general o individual.
- Todos los enlaces usan automáticamente la dirección de su sitio.

## 5. Problemas comunes
- **"Solo lectura" al editar:** no inició sesión; use `/#login`.
- **Error 500 / "ADMIN_PASSWORD não configurada":** faltan variables de entorno; agréguelas y vuelva a publicar.
- **Calendario vacío para alumnos:** ejecute `import` o entre una vez como coordinador (guarda la planilla inicial).
- **Cambiar la contraseña:** modifique `ADMIN_PASSWORD` y vuelva a publicar.

## 6. Seguridad y respaldo
La contraseña se verifica en el servidor; sin ella no se acepta ninguna escritura. Respalde con *Dados → copiar todo (JSON)* y/o `turso db shell planejador ".dump"`. La carpeta opcional `banco/` trae el esquema relacional SQLite/SQL para informes.

## 7. Cuentas, historial y agenda (novedades)
Vea `NOVIDADES.md` (portugués). Resumen: entre en `/#login` con la contraseña maestra, abra la pestaña **Acesso** para crear una cuenta por coordinador y restaurar versiones anteriores. La pestaña **Compartilhar** tiene enlaces de agenda para suscribirse en el celular.

## 8. Avisos automáticos (correo / WhatsApp)
Vea `docs/AVISOS-pt-BR.md` (portugués). Resumen: configure `RESEND_API_KEY` + `MAIL_FROM` (Resend) para correo y `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE` (API de WhatsApp Cloud de Meta, plantilla aprobada con una variable) para WhatsApp. Defina `CRON_SECRET` para el cron diario de Vercel (Netlify y el servidor propio lo programan solos). Sin claves, el envío es simulado.

## 9. Copia de seguridad programada
Vea `docs/BACKUP-pt-BR.md` (portugués): copia diaria en la base, copia semanal por correo (`BACKUP_EMAIL`), restauración desde la pestaña Dados o con `scripts/restore-backup.js`.
