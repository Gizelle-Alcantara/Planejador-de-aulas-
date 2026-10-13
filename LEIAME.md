# Planejador de Turmas SENAI — versão para hospedagem própria
Guias de instalação: `docs/INSTALACAO-pt-BR.md` · `docs/INSTALL-en.md` · `docs/INSTALACION-es.md`

Estrutura: `src/` (código-fonte do app + shim) · `scripts/build.js` (gera `public/`) · `api/` (Vercel) · `netlify/functions/` (Netlify) · `lib/core.js` (API compartilhada) · `server.js` (servidor local/VPS) · `dados-atuais/` (seus lançamentos, para importar) · `banco/` (versão relacional SQLite/SQL).

Novidades: `NOVIDADES.md` · Testes: `npm test`

## Gestão integrada de ambientes
A aba **Ambientes** abre o painel diário, solicitações, notificações, manutenção e relatórios. Na aba **Acesso**, a senha mestre cria contas de **Administrador de ambientes**. Professores precisam de conta de Docente vinculada ao cadastro.
Guias: `docs/AMBIENTES-pt-BR.md`, `docs/RESERVAS-pt-BR.md`, `docs/BACKUP-pt-BR.md`.
Validação: 36 testes da API e fluxo de interface em computador/celular. `npm run test:ui` executa a integração visual (instale o Chromium com `npx playwright install chromium`).
As abas **Chamada** e **Alunos** foram removidas, conforme solicitado. Os dados anteriores permanecem preservados.

Os testes de navegador exigem Node.js 20+. O servidor mantém compatibilidade com Node.js 18+; instalações de produção podem usar `npm ci --omit=dev`.

## Exportação do calendário
No cabeçalho, clique em **Exportar calendário** e escolha **Excel no padrão SENAI**, **PDF** ou **HTML**. Se houver lançamentos fora do período, escolha se deseja incluí-los. O botão **Voltar** permite retornar à aba ou ao calendário conforme o perfil.
Guia: `docs/EXPORTACAO-CALENDARIO.md`.
