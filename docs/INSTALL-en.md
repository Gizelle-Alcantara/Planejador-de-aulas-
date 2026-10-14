# Installation — current edition

The complete maintained reference is the [Portuguese manual](MANUAL-COMPLETO.md), edition 2026-10-13. This quick guide supersedes the original installation instructions.

Use a Node.js version supporting `--env-file`, such as Node.js 22. Work in the directory containing `package.json`. Install with `npm ci`, build with `npm run build`, create `data/` for local SQLite, and configure ADMIN_PASSWORD and SESSION_SECRET in a private environment file. Both are mandatory; do not commit credentials.

For local use, set TURSO_DATABASE_URL to `file:./data/planejador.db` and run `node --env-file=.env server.js`. Open `http://localhost:3000/#login`. For Vercel/Netlify, publish the whole project, configure remote Turso URL/token and the two secrets, preserve the workbook models, and redeploy.

Importing the original JSON files can replace existing documents. A v2 backup restore can remove documents/accounts created after the snapshot. Back up and verify the destination first. Password resets and account restoration invalidate old sessions. The relational files in `banco/` are distinct from the API document store.

See the [technical reference](REFERENCIA-TECNICA.md), [validation checklist](CHECKLIST-VALIDACAO.md) and [documentation index](README.md) for current permissions, backups, scheduling and API contracts.
