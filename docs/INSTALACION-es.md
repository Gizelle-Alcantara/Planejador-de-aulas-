# Instalación — edición actual

La referencia completa mantenida es el [manual en portugués](MANUAL-COMPLETO.md), edición 13/10/2026. Esta guía breve sustituye las instrucciones originales.

Use Node.js compatible con `--env-file`, como Node.js 22. Abra la carpeta que contiene `package.json`, ejecute `npm ci` y `npm run build`, cree `data/` para SQLite local y configure ADMIN_PASSWORD y SESSION_SECRET en un archivo de entorno privado. Ambas variables son obligatorias. No publique credenciales.

Para uso local, configure TURSO_DATABASE_URL como `file:./data/planejador.db` y ejecute `node --env-file=.env server.js`. Abra `http://localhost:3000/#login`. En Vercel/Netlify publique el proyecto completo, configure Turso remoto y las claves, conserve los modelos Excel y realice una nueva implementación.

La importación de los archivos de origen puede sustituir documentos. Restaurar un backup v2 puede eliminar documentos/cuentas posteriores a la copia. Verifique el destino y haga una copia externa primero. El cambio de contraseña y la restauración de cuentas invalidan sesiones anteriores. Los archivos relacionales de `banco/` no son el almacén JSON usado por la API.

Consulte la [referencia técnica](REFERENCIA-TECNICA.md), el [checklist](CHECKLIST-VALIDACAO.md) y el [índice](README.md) para permisos, backups, programación y contratos actuales de la API.
