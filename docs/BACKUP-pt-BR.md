# Backup agendado

## O que acontece sozinho
Todo dia às 20h (horário de Salvador), junto com os avisos, o sistema:
1. **Guarda uma cópia de tudo no próprio banco** (turmas, docentes, chamada, alunos e configurações), **se algo mudou** desde a última cópia. Ficam as **últimas 30 cópias** e a **primeira de cada mês** pelos últimos 12 meses.
2. **Aos domingos, envia uma cópia por e-mail** (arquivo `.json` anexo) para o endereço em `BACKUP_EMAIL`, se configurado. Isso protege contra perda do próprio banco.

O agendador é o mesmo dos avisos: Vercel (`vercel.json`, com `CRON_SECRET`), Netlify (função agendada) ou servidor próprio (`node server.js`).

## Configurar a cópia por e-mail (opcional)
Precisa do e-mail já configurado (`RESEND_API_KEY` e `MAIL_FROM`, veja `AVISOS-pt-BR.md`). Depois cadastre:
- `BACKUP_EMAIL` = `coordenacao@seudominio.com.br` (vários: separe por vírgula)
- `BACKUP_EMAIL_SEM_ALUNOS` = `1` (opcional) para **não** incluir nomes, contatos e faltas de alunos no arquivo enviado por e-mail. As cópias dentro do banco continuam completas.
- `BACKUP_EMAIL_DIARIO` = `1` (opcional) para enviar todo dia em vez de só aos domingos.

> O arquivo pode conter dados pessoais de alunos. Guarde-o em local seguro e apague e-mails antigos quando não precisar mais.

## Usar pela tela (aba Dados → Backups automáticos)
- **Fazer backup agora:** cria uma cópia na hora.
- **Baixar:** salva o arquivo `.json` no seu computador.
- **Restaurar:** devolve turmas, docentes, chamada e alunos ao estado daquela cópia. Antes de restaurar, o sistema guarda uma cópia do estado atual ("antes de restaurar"), então dá para desfazer. Turmas criadas depois do backup **não** são apagadas.
Para voltar uma turma só a um ponto anterior, a aba **Acesso → Histórico** é mais precisa.

## Se o banco inteiro for perdido
1. Crie um banco novo no Turso e atualize `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.
2. Com o arquivo de backup (do e-mail ou baixado) em mãos, no computador:
```bash
npm install
node --env-file=.env scripts/restore-backup.js backup-planejador-2026-10-10.json
```
3. Faça novo deploy. As contas de coordenador não fazem parte do backup (por segurança): entre com a senha mestre e recrie-as na aba Acesso.

## O que não entra no backup
Contas e senhas dos coordenadores, histórico de versões e histórico de envios de avisos.
