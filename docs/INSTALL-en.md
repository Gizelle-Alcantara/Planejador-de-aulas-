# SENAI Class Planner — Installation (English)

Runs on **Vercel**, **Netlify**, or any server with **Node.js 18+**. Data lives in a **Turso** database (cloud SQLite, free tier). Only the coordinator can edit (password); students and teachers open read-only links that refresh every ~5 s.

## 0. Requirements
- Free accounts at [Turso](https://turso.tech), [GitHub](https://github.com) and [Vercel](https://vercel.com) **or** [Netlify](https://netlify.com)
- Node.js 18+ (only to import the current data)

## 1. Create the database (Turso)
Dashboard: *Create database* → name `planejador` → copy the **URL** (`libsql://planejador-youruser.turso.io`) and *Generate token*.
CLI alternative:
```bash
turso auth login
turso db create planejador
turso db show planejador --url
turso db tokens create planejador
```

## 2. Prepare the project
```bash
cp .env.example .env      # fill in the 4 variables
npm install
node --env-file=.env scripts/import.js   # imports the current data (dados-atuais/)
```
| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | coordinator password (use a strong one) |
| `SESSION_SECRET` | long random string that signs the login cookie |
| `TURSO_DATABASE_URL` | URL from step 1 |
| `TURSO_AUTH_TOKEN` | token from step 1 |

> To start empty, skip `import`: the app starts from the original spreadsheet.

## 3A. Deploy on Vercel
1. Push the folder to a GitHub repo (`.env` is git-ignored).
2. Vercel: **Add New → Project** → pick the repo → **Framework Preset: Other**.
3. Add the 4 **Environment Variables**.
4. **Deploy** → `https://your-project.vercel.app`.

CLI: `npm i -g vercel && vercel`, then `vercel env add ADMIN_PASSWORD` (and the others), then `vercel --prod`.

## 3B. Deploy on Netlify
1. Push to GitHub. Netlify: **Add new site → Import an existing project**.
2. Build command `node scripts/build.js`, publish directory `public` (preset in `netlify.toml`).
3. **Site configuration → Environment variables**: add the 4 variables.
4. **Deploy** → `https://your-site.netlify.app`.

CLI: `npm i -g netlify-cli && netlify deploy --prod` (set variables with `netlify env:set NAME value`).

## 3C. Own server / VPS
```bash
npm install
node --env-file=.env server.js        # http://localhost:3000
```
Without `TURSO_DATABASE_URL` it uses the local file `data/planejador.db`. Keep it alive with `pm2 start server.js` and put Nginx/Caddy with HTTPS in front.

## 4. Using it
- **Coordinator:** open `https://your-address/#login` and enter the password. A "Sair" (log out) button appears bottom-right.
- **Students:** *Compartilhar* tab → class link / QR code.
- **Teachers:** *Compartilhar* tab → general or personal link.
- All links automatically use your site's address.

## 5. Troubleshooting
- **"Read-only" when editing:** you are not logged in; use `/#login`.
- **500 error / "ADMIN_PASSWORD não configurada":** environment variables are missing; add them and redeploy.
- **Empty calendar for students:** run `import`, or log in once as coordinator (it saves the initial spreadsheet).
- **Change the password:** edit `ADMIN_PASSWORD` and redeploy.

## 6. Security and backup
The password is checked on the server; without it no write is accepted. Back up via *Dados → copy everything (JSON)* and/or `turso db shell planejador ".dump"`. The optional `banco/` folder has a relational SQLite/SQL schema for reporting.
