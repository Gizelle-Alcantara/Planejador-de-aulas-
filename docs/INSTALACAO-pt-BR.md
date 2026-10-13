# Planejador de Turmas SENAI — Instalação (Português)

Funciona em **Vercel**, **Netlify** ou em qualquer servidor com **Node.js 18+**. Os dados ficam num banco **Turso** (SQLite na nuvem, plano gratuito). Só o coordenador edita (senha); alunos e docentes abrem links somente leitura, atualizados a cada ~5 segundos.

## 0. O que você precisa
- Conta gratuita no [Turso](https://turso.tech), no [GitHub](https://github.com) e na [Vercel](https://vercel.com) **ou** [Netlify](https://netlify.com)
- Node.js 18 ou mais novo (só para importar os dados atuais)

## 1. Criar o banco (Turso)
Pelo painel: *Create database* → nome `planejador` → abra o banco e copie a **URL** (`libsql://planejador-seuuser.turso.io`) e gere um **token** (*Generate token*).
Pelo terminal (alternativa):
```bash
turso auth login
turso db create planejador
turso db show planejador --url
turso db tokens create planejador
```

## 2. Preparar o projeto
```bash
cp .env.example .env      # edite e preencha as 4 variáveis
npm install
node --env-file=.env scripts/import.js   # importa seus lançamentos atuais (pasta dados-atuais/)
```
Variáveis (`.env`):
| Variável | Para quê |
|---|---|
| `ADMIN_PASSWORD` | senha do coordenador (use uma forte) |
| `SESSION_SECRET` | obrigatório: texto aleatório longo que assina o login, diferente da senha mestre |
| `TURSO_DATABASE_URL` | URL do passo 1 |
| `TURSO_AUTH_TOKEN` | token do passo 1 |

> Para começar do zero (sem os dados atuais), pule o comando `import`: o sistema inicia com a planilha original.

## 3A. Publicar na Vercel
1. Suba a pasta para um repositório no GitHub (`.env` não vai: está no `.gitignore`).
2. Na Vercel: **Add New → Project** → escolha o repositório → **Framework Preset: Other**.
3. Em **Environment Variables**, cadastre as 4 variáveis acima.
4. **Deploy**. O endereço será `https://seu-projeto.vercel.app`.

Pelo terminal: `npm i -g vercel && vercel` e depois `vercel env add ADMIN_PASSWORD` (idem para as outras) e `vercel --prod`.

## 3B. Publicar na Netlify
1. Suba para o GitHub. Na Netlify: **Add new site → Import an existing project**.
2. Build command `node scripts/build.js`, publish directory `public` (já vêm do `netlify.toml`).
3. **Site configuration → Environment variables**: cadastre as 4 variáveis.
4. **Deploy**. Endereço: `https://seu-site.netlify.app`.

Pelo terminal: `npm i -g netlify-cli && netlify deploy --prod` (defina as variáveis com `netlify env:set NOME valor`).

## 3C. Servidor próprio / VPS
```bash
npm install
node --env-file=.env server.js        # http://localhost:3000
```
Sem `TURSO_DATABASE_URL`, usa o arquivo local `data/planejador.db`. Mantenha rodando com `pm2 start server.js` e coloque Nginx/Caddy com HTTPS na frente.

## 4. Usar
- **Coordenador:** abra `https://seu-endereço/#login`, digite a senha. Botão "Sair" no canto inferior direito.
- **Alunos:** aba *Compartilhar* → link/QR Code da turma.
- **Docentes:** aba *Compartilhar* → link geral ou individual.
- Todos os links usam automaticamente o endereço do seu site.

## 5. Problemas comuns
- **"Somente leitura" ao editar:** você não entrou. Use `/#login`.
- **Erro 500 / "ADMIN_PASSWORD não configurada":** faltam variáveis de ambiente; cadastre e faça novo deploy.
- **Calendário vazio para alunos:** rode o `import` ou entre como coordenador uma vez (ele grava a planilha inicial).
- **Trocar a senha:** altere `ADMIN_PASSWORD` e faça novo deploy.

## 6. Segurança e backup
A senha é conferida no servidor; sem ela nenhuma gravação é aceita. Faça backup na aba *Dados → copiar tudo (JSON)* e/ou com `turso db shell planejador ".dump"`. A pasta `banco/` traz o esquema relacional (SQLite/SQL) opcional para relatórios.

## 7. Contas, histórico e agenda (novidades)
Veja `NOVIDADES.md`. Resumo: entre em `/#login` com a senha mestre, abra a aba **Acesso** para criar uma conta por coordenador e para restaurar versões anteriores. Na aba **Compartilhar** há links de agenda para assinar no celular.

## 8. Avisos automáticos por e-mail e WhatsApp
Veja `docs/AVISOS-pt-BR.md`: criação das contas no Resend e na Meta, variáveis de ambiente (`RESEND_API_KEY`, `MAIL_FROM`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE`, `CRON_SECRET`, `PUBLIC_URL`) e uso da aba **Avisos**.

## 9. Backup agendado
Veja `docs/BACKUP-pt-BR.md`: cópia diária no banco, cópia semanal por e-mail (`BACKUP_EMAIL`) e como restaurar.

A versão com correções da auditoria exige ADMIN_PASSWORD e SESSION_SECRET, sem valores padrão. Contas existentes precisam entrar novamente após a atualização. Os identificadores dos docentes e as novas colunas são migrados automaticamente.
