> Alunos agora acessam uma única turma por código: veja [Acesso dos alunos](ACESSO-ALUNOS.md). A consulta anônima continua bloqueada.

> Atualização: agendas agora exigem login. Docentes consultam apenas a própria agenda. Consulte [Acesso privado dos docentes](ACESSO-DOCENTE.md), inclusive para configurar contas e vínculos.

# Planejador de Aulas SENAI

## Manual completo — uso, instalação e manutenção

**Edição:** 13 de outubro de 2026. **Base:** código do pacote com as correções da auditoria. **Público:** coordenação, docentes, administração de ambientes e equipe técnica. O manual descreve funcionalidades existentes; melhorias futuras estão identificadas como limitações.

**Endereço informado da instalação:** https://planejador-de-aulas-zowu.vercel.app/ . A agenda pública foi consultada nesta data. Isso não substitui testes autenticados nem comprova a configuração da hospedagem.

### Como consultar

Para começar, leia as seções 1 a 4. Para operação diária, use as seções 5 a 11. Para instalação e suporte, use as seções 12 a 18 e a [referência técnica](REFERENCIA-TECNICA.md). Abra `MANUAL-COMPLETO.html` para leitura com sumário navegável e impressão pelo navegador. Os guias especializados continuam disponíveis no [índice](README.md).

## 1. Finalidade e limites

O sistema organiza turmas, disciplinas, docentes e aulas por horário. A programação da coordenação alimenta a agenda autenticada da turma, a agenda do docente e as solicitações de salas/laboratórios. A gestão decide os pedidos e acompanha ocupação, manutenção, notificações e relatórios.

As abas Chamada e Alunos foram retiradas da interface. Dados antigos dessas áreas continuam preservados no armazenamento e em backups. Não há módulo de retirada/devolução de chaves, assinatura digital, controle físico de presença ou integração automática com o KeyControl nesta versão.

Excel, CSV, HTML e ICS são saídas do planejamento. Alterar um arquivo exportado não atualiza o sistema. O modelo anual de docente e o modelo por turma são arquivos diferentes, preservados em `lib/assets/`.

## 2. Perfis e permissões

| Perfil | Acesso principal | Pode fazer | Restrições |
|---|---|---|---|
| Coordenação com senha mestre | `/#login` e `/ambientes.html` | Planejar, cadastrar, gerenciar ambientes/reservas, contas, vínculos e backups completos | Deve proteger a senha mestre e os arquivos com credenciais derivadas |
| Conta de coordenação (`coord`) | Mesmos módulos de planejamento e gestão | Calendário, cadastros, decisões de reservas, relatórios, histórico e backups de documentos | Não cria/remove contas, não redefine senhas nem vincula contas; não restaura backup que contém contas |
| Conta docente (`docente`) | `/ambientes.html` e agenda | Solicitar ambiente para suas aulas, acompanhar pedidos, reagendar/cancelar seus pedidos ativos, exportar agenda própria | Precisa estar vinculada ao cadastro; não planeja turmas nem altera alunos ou aulas de colegas |
| Administração de ambientes (`ambientes`) | `/ambientes.html` | Cadastrar ambientes, bloquear períodos, decidir reservas e consultar relatórios | Não edita planejamento nem acessa a exportação Excel acadêmica |
| Visitante | Página inicial | Entrar com sua conta | Não recebe calendários nem ICS |

O cadastro profissional e a conta de acesso são registros distintos. Criar um docente não cria login. A referência permanente relaciona ambos, mesmo após renomear o cadastro. A API permite ao docente registrar apenas dias cujas disciplinas pertencem integralmente ao vínculo dele; a confirmação ainda é diária. Dias com docentes diferentes exigem registro pela coordenação. Não há uma nova tela de confirmação por bloco nesta versão.

## 3. Primeira configuração funcional

1. Entre como coordenação pela rota `/#login`. Para a senha mestre, deixe o usuário vazio ou use `admin`.
2. Abra **Docentes** e complete os cadastros.
3. Cadastre ou confira a **Turma**: código, curso, módulo, turno, período e aulas por dia.
4. Em **Disciplinas**, informe nome, sigla, carga horária, docente e sala padrão.
5. Cadastre salas/laboratórios em **Ambientes**.
6. Com a senha mestre, crie as contas em **Acesso**. Na gestão de ambientes, vincule cada conta docente ao cadastro correspondente.
7. Lance as aulas no **Calendário** e aguarde **Todos os lançamentos salvos**.
8. Abra a agenda do docente, confira os blocos e faça uma solicitação de teste somente em ambiente de homologação.
9. Confira a prévia do Excel e os relatórios. Publique os links gerados em **Compartilhar**.

Use cadastros reais na produção. Não execute os scripts de importação ou restauração para simplesmente abrir o site.

## 4. Rotina diária recomendada

A coordenação confere pendências, carga horária e conflitos antes de alterar a programação. O docente consulta a agenda e solicita o ambiente correspondente ao bloco da aula. A gestão verifica o painel diário, decide pedidos e acompanha avisos de revisão.

Depois de qualquer alteração, confira a gravação. Se aparecer conflito de edição, recarregue, compare a versão atual e refaça somente a alteração necessária. Não considere a cópia local do navegador equivalente a um backup completo.

## 5. Cadastro completo do docente

Em **Docentes**, use **Adicionar docente** ou **Cadastro completo**. O formulário contém nome completo, matrícula, e-mail de contato, e-mail institucional, WhatsApp/telefone, unidade, área de atuação, formação/titulação, Meu SENAI, vínculo e observações. Somente o nome é obrigatório.

Nomes repetidos sem diferença de maiúsculas/minúsculas e matrículas repetidas são rejeitados. E-mails, telefone e limites de tamanho são validados. Os vínculos disponíveis são Mensalista, Horista, Intermitente e RSA. O cadastro não faz cálculos trabalhistas nem valida documentos pessoais.

**Salvar cadastro** mantém os bloqueios existentes; **Cancelar** descarta a edição do formulário. Renomear atualiza contas, disciplinas e reservas na mesma transação. Remover o docente deixa sua conta sem vínculo e exige conferir as disciplinas afetadas. Novos links usam o identificador permanente. Um link antigo por nome só é resolvido quando não há ambiguidade.

O e-mail institucional tem preferência no Excel anual, com o contato como alternativa. Meu SENAI preenche o campo correspondente. O vínculo é sugerido ao abrir a exportação; confira-o ao trocar o docente selecionado.

## 6. Turmas, disciplinas e carga horária

A turma define o período, o turno e a quantidade de aulas por dia. A disciplina define sigla, carga horária, docente e sala/laboratório padrão. O cadastro de docentes é compartilhado pelas turmas.

A interface conta aulas individuais. A duração da hora-aula participa da conversão da carga horária: o Matutino NEM usa 50 minutos; os demais turnos, 60 minutos no código atual. Ajustar uma configuração exige conferir a programação que já existe.

Um total como **84/82** indica duas aulas acima da previsão apresentada. Isso não significa, por si só, que a aula foi confirmada como realizada. A tabela pública de andamento considera datas e programação; o filtro **Realizada** usa a confirmação registrada em `reg.dado`.

Ao renomear a sigla, as referências dos lançamentos são atualizadas. Excluir uma disciplina remove seus lançamentos após a confirmação da interface. Antes de alterar cargas, turno ou aulas por dia em uma turma ativa, gere um backup e confira o resultado na prévia.

## 7. Calendário e distribuição por horário

1. Abra **Calendário** e escolha o mês.
2. Selecione **Editar dia** e clique na data.
3. Escolha a disciplina de cada aula. Exemplo: LOG nas aulas 1 e 2; IHC nas aulas 3 e 4.
4. Deixe horários vazios quando não houver aula. **Preencher todas as aulas** aplica uma disciplina ao turno.
5. Confira os intervalos e os avisos. Clique em **Salvar** e aguarde a gravação.

A grade considera a pausa do Matutino NEM e a separação manhã/tarde do Diurno. A validação aceita até 12 posições por dia; certos controles de cadastro podem oferecer um limite menor. Uma configuração não pode ultrapassar a meia-noite. Antes de reduzir aulas por dia, ajuste os dias que usam as posições que seriam removidas.

Lançamentos antigos sem `grade` continuam representando o turno inteiro. Não são redistribuídos automaticamente. Ao abrir um dia antigo com várias disciplinas, confira cada horário antes de salvar.

A ferramenta para lançar várias aulas usa a disciplina, a data inicial, a quantidade e os dias da semana. Ela pode preencher parcialmente o último dia. Reveja feriados, período e bloqueios antes de confirmar.

Feriados e dias sem aula permanecem visíveis. A grade explícita rejeita aulas em dias marcados como feriado/sem aula. Conflitos de docente e ambiente são verificados quando os horários se sobrepõem; intervalos que apenas se encostam não conflitam. Bloqueios de docente por dia/período ainda afetam o dia inteiro.

## 8. Filtros, celular e acessibilidade

Combine docente, disciplina, sala/laboratório e situação. A agenda docente também permite turma e turno. O contador se refere aos lançamentos do mês, não ao total de horas nem à quantidade de posições da grade.

| Situação | Significado |
|---|---|
| Programada | Não há confirmação registrada como realizada ou não dada |
| Realizada | `reg.dado` está definido como `sim` |
| Cancelada / não dada | `reg.dado` está definido como `nao` |
| Com conflito | Há sobreposição ou indisponibilidade identificada pelo calendário |

**Limpar filtros** recupera a visualização completa. As datas mantêm sua posição, inclusive quando não há resultados. Na coordenação, a edição de um dia mostra todos os horários; limpe os filtros para lançar/apagar diretamente com as ferramentas. Exportações mantêm o calendário completo, sem aplicar os filtros da tela.

A sala efetiva é a reserva aprovada do bloco, quando existir; caso contrário, a sala da disciplina ou o local da turma. A agenda docente mostra cancelamentos sem incluí-los nas próximas aulas ativas.

No celular, o calendário mantém sete colunas, e tabelas permitem rolagem horizontal. Use a janela do dia e as tabelas para ler intervalos completos. Tab percorre controles; setas navegam nas abas e nos dias; Escape fecha janelas. O foco retorna ao controle de origem. A próxima aula recebe destaque, e as informações têm rótulos para leitores de tela.

## 9. Salas, laboratórios e manutenção

Abra **Ambientes → Abrir gestão de ambientes** ou `/ambientes.html`. Cadastre nome, tipo (sala/laboratório), capacidade e disponibilidade. A capacidade aceita inteiros de 1 a 1000. Nomes normalizados e identificadores repetidos são rejeitados.

Desativar um ambiente impede novas solicitações para ele e exige revisar reservas futuras afetadas. O cadastro da capacidade não bloqueia automaticamente pedidos por número de participantes: esse campo ainda não existe no pedido.

Em **Bloqueios e manutenção**, escolha ambiente, datas, início, fim e motivo. Os intervalos precisam ser válidos e não atravessam a meia-noite. Remover um bloqueio não reaprove automaticamente pedidos em revisão.

A grade diária combina aulas do calendário, reservas e bloqueios. Consulte a data e os filtros antes de decidir. A ocupação é prevista; não comprova utilização física da sala.

## 10. Solicitações e aprovação de reservas

### Docente

Entre com sua conta vinculada. Escolha uma aula atual/futura, o bloco de horário, um ambiente ativo e a finalidade. Clique em **Enviar para aprovação**. A identidade e os horários são derivados da aula e da conta pelo servidor.

A finalidade é obrigatória e aceita até 1000 caracteres. Não é possível solicitar em nome de outra pessoa. Quando a mesma UC aparece em blocos diferentes no dia, escolha o bloco correto. Existe somente um pedido ativo sobreposto para a mesma aula/bloco.

### Gestão

Confira turma, docente, finalidade, horários e ocupação. **Aprovar** reserva o intervalo após nova validação. **Recusar** exige motivo. Coordenação e administração de ambientes podem decidir/cancelar; o docente atua apenas nos próprios pedidos ativos.

| Status | Efeito e próximo passo |
|---|---|
| Pendente | Aguarda decisão; não garante a ocupação |
| Aprovada | Reserva o intervalo validado |
| Recusada | Pedido encerrado com motivo |
| Cancelada | Ocupação liberada; histórico preservado |
| Revisão | Dados/disponibilidade mudaram; docente deve reagendar ou gestão encerrar |

**Reagendar** volta o pedido a pendente e exige nova aprovação. Alterar aula, docente, turno, sala, curso ou turma pode exigir revisão, assim como remover a aula, desativar o ambiente ou inserir manutenção/conflito. Pedidos passados mantêm o histórico.

Uma reserva aprovada não reescreve a sala padrão da disciplina. O calendário e as exportações usam o ambiente aprovado do bloco. A aprovação e a validação ocorrem dentro de transações.

## 11. Notificações, relatórios e exportações

As notificações de reservas são internas: novos pedidos avisam a gestão; decisões/revisões avisam o docente. Abra o aviso para localizar a reserva e marque-o como lido. A leitura é individual. A tela verifica novidades a cada 30 segundos enquanto ativa. Não há envio automático de decisões de reservas por e-mail/WhatsApp.

Os relatórios de ambientes agrupam pedidos, aprovações e horas previstas por ambiente/docente. Aulas do calendário e reservas aprovadas somam ocupação, com deduplicação da aula já reservada. Pendências, recusas, cancelamentos e revisão não somam horas de reserva. Selecione o período antes de exportar CSV ou imprimir PDF.

### Excel, HTML, PDF e ICS

1. Com uma conta autorizada, abra **Exportar calendário**.
2. Escolha docente/ano/vínculo ou a turma. Quando oferecido, escolha incluir lançamentos fora do período.
3. Abra **Prévia do Excel**. Selecione planilha, mês e zoom.
4. Confira cabeçalho, horários, ambiente e totais. Clique em **Baixar Excel**.

Se os dados mudarem, use **Atualizar prévia**. A versão conferida acompanha o download; um arquivo desatualizado é bloqueado. **Voltar às opções** conserva as escolhas. Quando a prévia falhar e a alternativa for oferecida, use **Baixar Excel sem prévia**; as permissões e a exigência de dados salvos permanecem.

A prévia lê o XLSX gerado; não reproduz imagens nem cada detalhe da impressão nativa do Excel. A planilha baixada preserva o modelo. O modelo por turma usa encontros equivalentes no resumo (aulas do bloco divididas por aulas/dia); o anual do docente conta aulas individuais. Não compare esses totais como se fossem a mesma unidade.

HTML gera uma cópia independente. PDF é obtido pela impressão do navegador. CSV de turma/docente e relatórios protege textos que poderiam virar fórmulas. ICS exige login e permite importar uma cópia da agenda; não há assinatura pública automática. Copie os links em **Compartilhar**; não construa links de docentes pelo nome.

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

## 16. Backup, restauração e atualização

Backups agendados são criados se houve alterações. A retenção mantém as últimas 30 cópias e a primeira de cada um dos 12 meses distintos mais recentes que tenham cópias. A lista da interface exibe até 60 registros. Cópias dentro do mesmo banco não substituem uma cópia externa.

| Tipo | Conteúdo e comportamento |
|---|---|
| Backup completo v2 pela senha mestre | Documentos, contas com hashes/salts/vínculos e notificações; não inclui senha mestre, variáveis de ambiente ou cópias recursivas de backups |
| Download por coordenação comum | Retira contas e notificações individuais do arquivo |
| Backup enviado por e-mail | Documentos; não envia credenciais das contas; opção sem alunos remove seus dados dessa cópia |
| Restauração v2 | Recupera o conjunto do snapshot e remove documentos/contas posteriores quando incluídos no escopo do arquivo |
| Backup antigo v1 | Compatibilidade com documentos; não equivale à restauração completa de contas |

Antes de restaurar, o sistema cria uma cópia do estado atual. A restauração é transacional; uma falha desfaz as mudanças. Sessões de contas restauradas exigem novo login. O histórico existente não é importado do arquivo e não deve ser confundido com a lista de backups.

Para um arquivo externo:

```bash
node --env-file=.env scripts/restore-backup.js caminho/backup-completo.json
```

Confira o destino, o arquivo e seu conteúdo antes de executar. Preserve as variáveis da hospedagem separadamente. Depois de restaurar, confira docentes, vínculos, ambientes, reservas, datas e exportações.

Para atualizar: gere backup externo; teste o pacote em banco separado; mantenha o banco e as variáveis de produção; atualize código/funções/modelos; faça build e implantação; entre novamente; valide os fluxos. Não altere manualmente identificadores para resolver problemas de vínculo.

## 17. Segurança, dados e manutenção

As senhas de contas são derivadas com scrypt e salt aleatório. A sessão assinada dura 12 horas, usa cookie HttpOnly/SameSite=Lax e Secure quando a requisição é HTTPS. Trocar senha, remover conta ou restaurar contas encerra sessões conforme a nova versão de sessão. Isso não implementa recuperação de senha por e-mail, autenticação multifator nem limitação completa de tentativas.

O planejamento usa revisão por documento e transações de escrita. O lote é desfeito em erro/conflito. Os modelos Excel ficam no servidor. A prévia verifica a versão do conteúdo da pasta de trabalho, não apenas o horário do download.

O service worker tenta reutilizar conteúdo disponível quando não há rede; não guarda respostas da API. Offline não significa gravação sincronizada nem exportação disponível. Não use um computador compartilhado para guardar backups com dados pessoais. Faça logout e controle o acesso às cópias locais.

A equipe técnica deve testar atualizações, conferir logs, observar falhas 401/409/422/500, verificar a rotina diária e ensaiar restauração em ambiente isolado. O compartilhamento de cópias exportadas deve estar de acordo com a política da unidade; o sistema não comprova automaticamente conformidade jurídica.

## 18. Testes, suporte e limitações

### Comandos

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

`npm test` usa bancos temporários. O teste de navegador sobe servidor próprio temporário, cria contas/dados descartáveis e encerra o processo. Não aponte a variável de teste para produção. Dependências de sistema do Chromium podem precisar de instalação no ambiente usado para os testes.

A versão auditada passou em 67 testes automatizados e fluxos de navegador com cadastro, vínculos, pedidos, decisões, revisão, reagendamento, filtros, horários, cancelamentos, acessibilidade, backup e exportações. Esses resultados não garantem todas as configurações remotas. Envio real, carga com muitos usuários e Microsoft Excel de desktop não foram validados nessa execução.

| Sintoma | O que conferir |
|---|---|
| Página não carrega dados | Conectividade e resposta de `/api`; configuração e logs da função |
| Erro de SESSION_SECRET/ADMIN_PASSWORD | Defina ambas no processo/ambiente correto e reinicie/implante novamente |
| Conta docente sem aulas | Cadastro, vínculo da conta, disciplinas atribuídas, período, blocos e cancelamentos |
| Pedido em revisão | Abra o motivo; escolha uma aula atual, reagende e peça nova aprovação |
| Conflito 409 | Recarregue, compare a versão atual e refaça a alteração necessária |
| Conflito de horários 422 | Confira sobreposição de docente/sala e bloqueios; ajuste a grade |
| Prévia não abre | Aguarde a gravação; confira erro na janela e API; use a alternativa direta quando oferecida |
| Planilha baixada com dados inesperados | Perfil, turma, docente, ano, período, vínculo e versão; atualize a prévia |
| Link por nome escolhe outro/mostra lista | Copie o link permanente na interface; nomes podem gerar o mesmo slug |
| Dados de tela parecem antigos | Confira conexão, versão implantada e cache; recarregue após atualização |
| Backup não foi enviado | Provedor de e-mail, destinatários, flags, logs e execução da rotina |

Ao pedir suporte, informe endereço, perfil, tela/ação, mensagem exata, horário e passos para reproduzir. Nunca envie senha, token de banco, SESSION_SECRET ou backup completo em uma conversa pública.

Limitações atuais: confirmação/cancelamento por dia; disponibilidade docente por dia/período; capacidade de ambiente sem contagem de participantes; agendas e ICS exigem login; filtros não limitam exportações; importação inicial por arquivo; ausência de integração de chaves, MFA, recuperação de senha, confirmação física e medição de carga em produção.

Para detalhes de implementação, contratos da API e tabelas, consulte [REFERENCIA-TECNICA.md](REFERENCIA-TECNICA.md). Para validação antes de publicar, consulte [CHECKLIST-VALIDACAO.md](CHECKLIST-VALIDACAO.md).


### Atualização de responsividade
No celular, os filtros ficam em duas colunas ou uma coluna nas telas menores; formulários ficam em uma coluna. As janelas se ajustam à altura disponível. O calendário mantém sete dias por linha e as tabelas podem ser deslizadas horizontalmente dentro do painel. Campos têm fonte de 16px para facilitar a leitura. Na gestão de ambientes, o menu acompanha a rolagem da página, evitando cobrir os formulários.
