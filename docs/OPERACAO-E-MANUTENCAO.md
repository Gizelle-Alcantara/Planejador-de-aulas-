# Instalação, publicação e manutenção

Edição: 19/10/2026. Público: administração e equipe técnica.

## 1. Instalação local

Use Node 24/npm na raiz do projeto. O mínimo declarado é Node 18, mas --env-file requer versão mais recente.

```powershell
npm ci
New-Item -ItemType Directory -Force data
Copy-Item .env.example .env
```

Edite o arquivo antes de iniciar e substitua os marcadores. Para banco local, não deixe a URL fictícia do Turso copiada do exemplo.

```ini
ADMIN_PASSWORD=SUBSTITUA_POR_SENHA_FORTE
SESSION_SECRET=SUBSTITUA_POR_SEGREDO_ALEATORIO_LONGO
TURSO_DATABASE_URL=file:./data/planejador.db
PUBLIC_URL=http://localhost:3000
PORT=3000
```

Gere segredos distintos por ferramenta criptográfica/gerenciador de senhas. Depois:

```powershell
npm run build
node --env-file=.env server.js
```

Abra http://localhost:3000. No Linux/macOS use mkdir -p data e cp .env.example .env. O diretório do banco deve ser gravável. npm start não lê .env automaticamente; requer variáveis já carregadas.

O servidor local/VPS limita cada requisição a 64 MiB antes do processamento da API, incluindo envios em partes sem Content-Length. Excedentes recebem HTTP 413. Ajuste `MAX_REQUEST_BYTES` somente se necessário para importação/restauração: inteiro em bytes entre 1024 e 268435456; valor inválido impede a inicialização. Os limites específicos de cada operação continuam vigentes. Vercel/Netlify aplicam seus próprios limites de entrada, que esta variável não altera.

As páginas locais e as configurações Vercel/Netlify incluem CSP, bloqueio de enquadramento, nosniff e política de referência. A CSP permite scripts/estilos inline usados pela interface e relatórios, a biblioteca QR no cdnjs e fontes do Google; bloqueia objetos incorporados e limita conexões à própria origem. Confira esses cabeçalhos na resposta da hospedagem após publicar. Novos recursos externos exigem revisão da política em `lib/http-security.js`, `vercel.json` e `netlify.toml`.

### Importação inicial

Revise dados-atuais e banco de destino. O importador pode substituir documentos; faça backup antes quando já houver dados.

```powershell
node --env-file=.env scripts/import.js
```

Confira mensagens e interface. A pasta não é importada como um único lote com rollback; não execute a cada atualização. Excel de ambientes é outro fluxo, pela interface mestre.

## 2. Configuração

| Variável | Uso |
|---|---|
| ADMIN_PASSWORD | Senha mestre obrigatória |
| SESSION_SECRET | Assinatura obrigatória de sessões, distinta da senha |
| TURSO_DATABASE_URL | Banco remoto na hospedagem ou file local |
| TURSO_AUTH_TOKEN | Autorização do banco remoto |
| PUBLIC_URL | URL pública; HTTPS para recuperação remota |
| PORT | Porta local, padrão 3000 |
| CRON_SECRET | Bearer da rotina HTTP |
| RESEND_API_KEY / MAIL_FROM | Provedor e remetente autorizado de e-mail |
| WHATSAPP_TOKEN / WHATSAPP_PHONE_ID / WHATSAPP_TEMPLATE | API Meta opcional |
| WHATSAPP_LANG | Idioma do template; padrão pt_BR |
| BACKUP_EMAIL | Destinatários do backup por e-mail |
| BACKUP_EMAIL_SEM_ALUNOS | Texto não vazio retira alunos da cópia enviada |
| BACKUP_EMAIL_DIARIO | Texto não vazio troca envio semanal por diário |

Nas flags de backup, deixe vazio para desativar: `0` também é texto não vazio. WhatsApp manual não depende de Meta. E-mail/Meta são opcionais para o planejamento.

Segredos ficam no servidor, nunca em src/public/docs. Alterar variáveis exige reinício/implantação conforme o destino. SESSION_SECRET novo invalida sessões; ADMIN_PASSWORD nova invalida sessão mestre anterior.

## 3. Vercel

1. Gere backup externo atualizado pela senha mestre.
2. Valide em banco isolado.
3. Atualize fontes src/lib, adaptadores api, scripts, modelos e lockfile. Não envie só public.
4. Configure Production e Preview separadamente; Preview deve ter banco próprio.
5. Execute os testes pertinentes e publique commit identificado.
6. Aguarde implantação/build e confira logs.
7. Recarregue e execute aceite por perfil; registre resultado.

vercel.json define build node scripts/build.js, saída public, api/index.js com maxDuration 15 e lib/assets incluído. Cron: 0 23 * * * UTC em /api?cron=1 com CRON_SECRET.

Use Turso remoto persistente. .vercelignore exclui dados, bancos, backups, artefatos, testes, docs e segredos da implantação; não apaga arquivos já enviados ao histórico Git. Revise o conteúdo do commit.

npm run check:publish avalia o ambiente local do processo. Variáveis ausentes localmente não comprovam falha remota. Confira Publicação com mestre no destino e homologue os fluxos.

## 4. Netlify e servidor próprio

Netlify usa netlify.toml, build compartilhado, public e funções de netlify/functions com assets. Configure banco remoto, variáveis, agenda e logs no destino.

Servidor próprio requer processo supervisionado, HTTPS e volume persistente do SQLite. Não substitua o banco ao atualizar código. Supervisão, TLS e infraestrutura não são provisionados pelo projeto.

## 5. Rotina de manutenção

| Momento | Atividade |
|---|---|
| Diariamente | Revisões de reservas, chaves abertas e falhas relevantes |
| Após rotina agendada | Conferir backup e resultados de envios |
| Antes de importar/atualizar | Backup externo e registro da versão atual |
| Após atualização | Login, gravação, perfis, exportações e chaves |
| Periodicamente | Revisar acessos e ensaiar restauração isolada |

Rotina local depende do processo ligado; não há compensação garantida de toda execução perdida. Cópia no mesmo banco não protege contra perda do banco/conta; preserve backup externo.

## 6. Retorno de versão e incidentes

Registre a implantação funcional antes da mudança. Se necessário, preserve estado/logs e retorne ao código anterior pelo mecanismo da hospedagem, conferindo compatibilidade do banco. Retornar código não desfaz gravações/migrações.

Restauração é decisão separada e pode remover registros posteriores ao snapshot. Gere cópia atual e siga [recuperação](SEGURANCA-E-RECUPERACAO.md).

Registre perfil, ação, horário e referência/x-request-id do erro. No diagnóstico mestre, investigue antes de marcar tratada; se a contagem mudou, atualize a lista.

| Sintoma | Conferir |
|---|---|
| 401 | Sessão/login/revogação |
| 403 | Perfil, vínculo e escopo |
| 409 | Revisão ou estado alterado; recarregar/comparar |
| 400/422 | Campos, conflitos e regras conforme mensagem |
| 500/503 | Logs, banco, configuração e provedor |
| Modelo ausente | lib/assets na função e integridade dos arquivos |
| Tela antiga | Commit, fontes src, build e cache |
| E-mail falha | Domínio, remetente, credencial e logs |
| Câmera falha | HTTPS, permissão e alternativa de foto |

Teste de carga fornecido trabalha com dados locais descartáveis; não aponte ferramentas de carga para produção sem planejamento específico.
