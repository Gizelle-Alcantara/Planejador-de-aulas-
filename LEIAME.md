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
No cabeçalho, clique em **Exportar calendário** e escolha a **Prévia do Excel da turma** ou do docente, **PDF** ou **HTML**. Se houver lançamentos fora do período, escolha se deseja incluí-los. O botão **Voltar** permite retornar à aba ou ao calendário conforme o perfil.
Guia: `docs/EXPORTACAO-CALENDARIO.md`.

## Aulas por horário

No Calendário, abra um dia com a ferramenta Editar e escolha a disciplina de cada aula. Guia completo: `docs/HORARIOS-POR-AULA.md`. Os dados antigos não são redistribuídos automaticamente.

## Prévia antes do download
Confira a planilha, escolha o mês e ajuste o zoom. Clique em **Baixar Excel** quando terminar. Se os dados mudarem, use **Atualizar prévia**. Consulte `docs/PREVIA-EXCEL.md`.

## Cadastro completo do docente
Formulário com matrícula, contatos, unidade, área, formação, Meu SENAI, vínculo e observações, com validação e preservação dos cadastros existentes. Consulte `docs/CADASTRO-DOCENTE.md`.

## Filtros do calendário
Filtros combinados por docente, disciplina, sala/laboratório e situação, com contador mensal e limpeza. A agenda do docente também permite turma e turno. Consulte `docs/FILTROS-CALENDARIO.md`.
