# Instalação — versão atual

O [Manual completo](MANUAL-COMPLETO.md) é a referência atual. Leia as seções 12 a 15 para instalação, hospedagem, variáveis e agendamento.

## 12. Instalação local — Windows, Linux ou macOS

O `package.json` declara Node.js 18 ou superior. Os exemplos abaixo usam Node.js com `--env-file`, como Node.js 22; esse parâmetro não está disponível em todas as versões antigas aceitas pelo projeto. Os testes de navegador exigem um ambiente compatível com as dependências de desenvolvimento (guia anterior indica Node.js 20+).

### Preparação

Extraia o pacote e abra o terminal na pasta que contém `package.json`. Confira:

```bash
node --version
npm --version
```

Se o terminal não reconhecer Node/npm, instale o Node.js e reabra o terminal. Não use a pasta `public/` como raiz do projeto.

```bash
npm ci
npm run build
```

Crie o diretório `data` para SQLite local. No PowerShell:

```powershell
New-Item -ItemType Directory -Force data
```

No Linux/macOS:

```bash
mkdir -p data
```

Crie um arquivo `.env` local com as variáveis abaixo, substituindo os marcadores por valores próprios. Para banco local, não copie a URL de exemplo do Turso:

```ini
ADMIN_PASSWORD=SUA_SENHA_MESTRE_FORTE
SESSION_SECRET=SUA_CHAVE_ALEATORIA_LONGA_E_DIFERENTE_DA_SENHA
TURSO_DATABASE_URL=file:./data/planejador.db
PORT=3000
PUBLIC_URL=http://localhost:3000
```

Para gerar uma chave aleatória, execute e copie o resultado para o campo correspondente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

O servidor não carrega `.env` sozinho. Inicie com:

```bash
node --env-file=.env server.js
```

Abra `http://localhost:3000/#login`. Sem `--env-file`, defina as variáveis no ambiente do processo antes de usar `npm start`. Não publique `.env`, chaves ou backups completos em repositórios. O arquivo de exemplo contém marcadores, não credenciais utilizáveis.

### Importação inicial

A pasta `dados-atuais/` contém documentos JSON de origem. Confira o banco de destino e gere backup se já houver dados. A importação pode substituir documentos com o mesmo identificador:

```bash
node --env-file=.env scripts/import.js
```

Confira cada mensagem `importado`/`falhou` e valide pela interface. O importador percorre os arquivos; não oferece uma importação única de toda a pasta com rollback. Não rode esse comando a cada atualização.

## 13. Hospedagem e configuração

### Vercel

Use o projeto completo no repositório, incluindo `api/`, `lib/`, `src/`, `scripts/`, modelos e lockfile. A configuração existente usa `node scripts/build.js`, saída `public/`, função `api/index.js`, inclusão de `lib/assets/**` e duração máxima configurada de 15 segundos.

Cadastre ADMIN_PASSWORD, SESSION_SECRET, TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis do ambiente de produção. Use Turso remoto; SQLite local não fornece persistência adequada para esse fluxo de funções. Atualize o projeto inteiro e faça nova implantação. Confira também qual ambiente recebe as variáveis; Preview e Production podem ter configurações diferentes.

### Netlify

A configuração usa build `node scripts/build.js`, pasta `public/`, funções em `netlify/functions/` e inclusão dos modelos. A função API atende `/api`; a função agendada executa `runDaily`. Cadastre as mesmas variáveis e confira os logs após a implantação.

### Servidor próprio

Mantenha um processo Node ativo, acesso de escrita ao diretório do banco e HTTPS na camada de publicação. Com banco local, preserve o volume do arquivo SQLite ao atualizar o código. Configure o gerenciador de processos para carregar as variáveis; executar um comando diferente sem `.env` não as carrega automaticamente.

Os limites da hospedagem devem ser conferidos no ambiente contratado. A publicação do código não valida, sozinha, banco, provedores de mensagens ou execução dos agendamentos.

## 14. Variáveis de ambiente

| Variável | Obrigatoriedade e finalidade |
|---|---|
| ADMIN_PASSWORD | Obrigatória; senha mestre; mudar exige nova implantação/reinício e invalida a sessão mestre antiga |
| SESSION_SECRET | Obrigatória; assinatura de sessões; sem valor padrão; trocar invalida assinaturas existentes |
| TURSO_DATABASE_URL | Banco remoto na hospedagem; local omite ou usa `file:./data/planejador.db` |
| TURSO_AUTH_TOKEN | Token do banco remoto; não necessário para arquivo local |
| PORT | Porta local; padrão 3000 |
| PUBLIC_URL | Endereço público usado nos links de avisos; se ausente, usa a base cadastrada |
| CRON_SECRET | Autentica `/api?cron=1` como `Authorization: Bearer ...`; necessário para cron HTTP na Vercel |
| RESEND_API_KEY / MAIL_FROM | Habilitam envio real de e-mail |
| WHATSAPP_TOKEN / WHATSAPP_PHONE_ID / WHATSAPP_TEMPLATE | Habilitam envio por template na API WhatsApp |
| WHATSAPP_LANG | Idioma do template; padrão `pt_BR` |
| BACKUP_EMAIL | Destinatários da cópia por e-mail; aceita separação por espaço, vírgula ou ponto e vírgula |
| BACKUP_EMAIL_SEM_ALUNOS | Qualquer valor não vazio ativa a retirada de dados de alunos do backup por e-mail; use `1` ou deixe vazio |
| BACKUP_EMAIL_DIARIO | Qualquer valor não vazio ativa envio diário, em vez de somente domingo; use `1` ou deixe vazio |

Não use `0` para desativar as duas flags de backup: o código verifica se o texto está preenchido. Segredos ficam na hospedagem ou no ambiente local, não no navegador nem no código publicado.

## 15. Avisos automáticos e agendamento

A aba **Avisos** define alterações do calendário, lembretes, canais e destinatários. Esses avisos são diferentes das notificações internas de reservas. Confira a prévia e a lista de destinatários antes de enviar uma mensagem real.

E-mail requer Resend configurado e remetente autorizado. WhatsApp requer as variáveis do número/token/template e um template aprovado compatível com o corpo enviado. Sem configuração, confira o estado retornado pelo provedor: não considere simulação como entrega real.

A rotina diária está configurada para **23:00 UTC / 20:00 Bahia**. No servidor local, verifica-se o horário a cada 30 segundos e executa-se uma vez por dia enquanto o processo está ligado. Na Netlify, a função agendada chama a rotina. Na Vercel, `vercel.json` aponta `/api?cron=1`; o servidor exige CRON_SECRET. A rotina cria backup e executa avisos conforme as configurações.

Não há recuperação automática garantida de uma execução perdida enquanto o servidor local estava desligado. Confira o histórico de envios e os logs do agendador. Falhas de provedor precisam ser analisadas sem expor tokens ou contatos em capturas públicas.

