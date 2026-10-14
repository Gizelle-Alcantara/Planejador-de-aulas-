> Política de acesso atual: [Acesso privado dos docentes](ACESSO-DOCENTE.md). Referências históricas a consultas públicas não se aplicam; ICS exige autenticação e exportações completas de turma são restritas à coordenação.

# Referência técnica

**Base:** implementação entregue em 13/10/2026. O contrato abaixo documenta a API atual; não é uma promessa de estabilidade entre versões. Para procedimentos de operação, consulte [MANUAL-COMPLETO.md](MANUAL-COMPLETO.md).

## 1. Arquitetura e diretórios

| Caminho | Responsabilidade |
|---|---|
| `src/tpl.html` | Interface principal, estado de turmas, calendário, filtros, formulários e exportações da tela |
| `src/shim.js` | Compatibilidade com o aplicativo original; sessão, API, revisões, consulta periódica e download |
| `src/static/` | Gestão de ambientes, acessibilidade, prévia, estilos, service worker e recursos estáticos |
| `scripts/build.js` | Gera `public/index.html`, copia estáticos e transforma regras de horários para o navegador; incorpora o código da prévia à página |
| `public/` | Saída de build; não deve ser a origem principal de alterações |
| `lib/core.js` | API, autenticação, banco, políticas de acesso, transações, migrações, histórico, backups e rotinas |
| `lib/schedule.js` | Horários, blocos, validação da grade e conflitos; compartilhado entre servidor e navegador |
| `lib/docentes.js` | Validação do cadastro docente |
| `lib/environments.js` | Validação dos ambientes e projeção de aulas do docente |
| `lib/reservations.js` | Pedidos, decisões, sincronização, bloqueios, ocupação e relatórios |
| `lib/calendar-export.js` | XLSX no modelo por turma |
| `lib/teacher-calendar-export.js` | XLSX anual do docente |
| `lib/excel-preview.js` | Leitura dos valores/estilos do XLSX gerado e hash de versão |
| `lib/ics.js` / `lib/notify.js` | Agendas ICS e avisos externos |
| `lib/assets/` | Modelos originais das planilhas; precisam acompanhar as funções publicadas |
| `api/index.js` | Adaptador Vercel para a API compartilhada |
| `netlify/functions/` | Adaptadores API e agendador Netlify |
| `server.js` | Servidor Node local/VPS e verificação da rotina diária |
| `scripts/import.js` | Importação inicial de arquivos JSON da pasta de dados |
| `scripts/restore-backup.js` | Restauração de arquivo de backup |
| `banco/` | Esquema e arquivos relacionais de origem; não equivalem ao armazenamento JSON utilizado pela API |
| `dados-atuais/` | Documentos de origem para importação |
| `tests/` | API, cadastros, horários, XLSX, prévia e integração de navegador |
| `docs/` | Documentação operacional e técnica |

A aplicação usa JavaScript/Node e bibliotecas `@libsql/client` e `fflate`. Testes de interface usam Playwright e axe. As versões exatas instaladas devem ser conferidas no lockfile. Não há backend separado para KeyControl, framework React ou container Docker fornecido neste pacote.

### Fluxo principal

O navegador consulta `/api`; o shim transforma os documentos em estado da interface. A coordenação envia mudanças com as revisões conhecidas. A API valida acesso e dados, grava em transação e sincroniza reservas. As consultas periódicas atualizam a visualização. A exportação lê o estado salvo no servidor e os modelos, gera XLSX e fornece a prévia ou o arquivo.

## 2. Banco efetivamente usado pela API

O cliente libSQL usa Turso remoto ou SQLite local. A inicialização cria tabelas e migra colunas necessárias. Não substitua `data/planejador.db` pelo arquivo relacional de `banco/` sem uma migração explícita.

| Tabela | Campos principais / finalidade |
|---|---|
| `docs` | `id`, `data` JSON, `updated_at`, `rev`, `updated_by`; documentos operacionais |
| `users` | `login`, `nome`, `salt`, `hash`, `role`, `docente`, `docente_id`, `created_at`, `session_key`; contas e vínculo |
| `history` | `id`, `doc_id`, `data`, `at`, `by`, `rev`, `note`; versões de documentos |
| `backups` | `id`, `at`, `kind`, `by`, `size`, `hash`, `docs_n`, `data`; payload compactado com gzip/base64 |
| `notify_state` | `turma_id`, `base`, `lembrete_last`; base para detectar alterações/lembretes |
| `notify_log` | Data, turma, canal, tipo, responsável, resumo, sucesso e erro do envio |
| `notifications` | Destinatário, mensagem, reserva, data e lista de logins que leram |

A retenção do histórico é de até 60 versões por documento. A consulta de histórico retorna até 80 registros globais. Backups preservam as 30 cópias mais recentes e a primeira de cada um dos 12 meses distintos mais recentes com cópias; isso não é um prazo absoluto de exclusão de dados pessoais. A consulta de backups retorna até 60 registros.

### Documentos e unidades

| Identificador | Conteúdo |
|---|---|
| `geral` | Cadastro compartilhado de docentes e endereço-base |
| `turma-CODIGO` | `{state: {cfg, ucs, days, reg, ...}}`; programação e dados legados da turma |
| `ambientes` | `{items: [...]}`; salas/laboratórios |
| `reservas` | `{items: [...]}`; pedidos, status e histórico |
| `bloqueios` | `{items: [...]}`; manutenção/indisponibilidade de ambientes |

Os nomes permanecem como rótulos. `docentes[].id`, `users.docente_id`, `ucs[].docenteId` e `reservas[].docenteId` mantêm a referência profissional. Não altere esses IDs manualmente. A sessão da conta resolve o nome atual pelo vínculo. O campo `session_key` é interno, não integra o backup exportado de contas e é renovado ao redefinir senha/restaurar contas.

### Exemplo de grade

```json
{
  "state": {
    "cfg": {
      "turma": "T-EXEMPLO",
      "curso": "Curso de exemplo",
      "turno": "Matutino",
      "aulasDia": 4,
      "inicio": "2027-03-01",
      "termino": "2027-03-31"
    },
    "ucs": [
      {"sigla": "LOG", "nome": "Lógica", "ch": 20, "docente": "Docente A", "sala": "Sala 1"},
      {"sigla": "IHC", "nome": "Interface", "ch": 20, "docente": "Docente A", "sala": "Sala 1"}
    ],
    "days": {
      "2027-03-01": {"s": ["LOG", "IHC"], "grade": ["LOG", "LOG", "IHC", "IHC"]}
    },
    "reg": {}
  }
}
```

O exemplo é um esquema didático, não um comando para importar em produção. `s` contém as siglas únicas; `grade` contém a sigla de cada posição. Um bloco é uma sequência contígua da mesma UC. A pausa do turno pode separar blocos. `bloco` identifica as posições, como `1-2`. Dados legados sem grade usam `dia` e representam o turno inteiro. `reg[DATA].dado` usa `sim` ou `nao`; os campos legados não constituem uma nova tela de chamada.

## 3. Horários codificados

| Turno | Início / particularidade |
|---|---|
| Matutino | 07:30 |
| Matutino NEM | 07:00, aulas de 50 min, pausa de 20 min após a terceira |
| Vespertino NEM | 13:20; duração da função atual permanece 60 min |
| Vespertino | 13:00 |
| Diurno | 07:30; a quinta posição inicia às 13:00 |
| Noturno (Comunidade) | 18:00 |
| Outros nomes de turno | Início padrão 18:40 |

A quantidade vem de `aulasDia`; os limites/validações estão em `schedule.js`. Se regras institucionais diferirem, é necessário alterar a regra compartilhada e retestar interface, conflitos, reservas, carga horária e exportações. Ajustar apenas o texto de uma tabela não altera a programação.

## 4. API: convenções

A rota é `/api`. Operações POST recebem JSON com `op`; a sessão é enviada pelo cookie `plan_sess`. Use requisições da mesma origem com `credentials: 'same-origin'`. Não há um token de API público destinado a gravar documentos.

Siglas de perfis nas tabelas: **M** = senha mestre; **C** = coordenação; **D** = docente; **A** = administração de ambientes; **P** = público. Os exemplos indicam campos principais; validações e escopos adicionais continuam no servidor.

### GET

| Consulta | Perfil e resposta |
|---|---|
| `/api` | P; documentos com projeção por perfil, `admin`, `user` e revisões. `admin` indica sessão presente, não autorização universal |
| `?ics=turma-CODIGO` | P; agenda `text/calendar` da turma |
| `?ics=docente-ID` | P; agenda do identificador permanente; nome antigo somente se não ambíguo |
| `?export=turma-preview&turma=turma-CODIGO` | M/C ou D associado à turma; JSON da prévia |
| `?export=xlsx&turma=turma-CODIGO` | Mesmo acesso; XLSX. `incluir=1` inclui lançamentos fora do período |
| `?export=docente-preview&docente=NOME&ano=2027` | M/C ou D do próprio vínculo; prévia anual. `vinculo` é opcional |
| `?export=docente-xlsx&docente=NOME&ano=2027` | Mesmo acesso; XLSX anual |
| `?cron=1` | Autorização Bearer CRON_SECRET; executa rotina diária. Não é uma consulta somente leitura |

Downloads conferidos podem incluir `versao=HASH`. Um hash diferente da geração atual retorna 409. A prévia contém `title`, `filename`, `version`, `styles`, `sheets` e `conflicts`; planilhas incluem linhas/células, mesclagens, larguras e meses identificados. Valores exibidos vêm do arquivo gerado.

### Sessão, planejamento e contas

| `op` | Acesso | Campos principais / efeito |
|---|---|---|
| `login` | P | `login`, `password`; cria cookie; usuário vazio/admin usa senha mestre |
| `logout` | Sessão ou P | Expira cookie |
| `set` | M/C; D restrito a próprias aulas | `id`, `data`, `base`, `note`; grava documento validado |
| `set_many` | M/C | `items: [{id,data,base}]`, `deleted`, `deleteBases`; lote atômico; retorna `revs` |
| `delete` | M/C | `id`; exclusão com registro no histórico. A operação isolada não recebe revisão; prefira o lote usado pela interface |
| `history` | M/C | Lista versões |
| `restore` | M/C | `hid`; restaura a versão do documento e sincroniza reservas |
| `users` | M | Lista contas, sem hash/salt |
| `user_add` | M | `login`, `nome`, `password`, `role` |
| `user_pw` | M | `login`, `password`; muda senha e versão de sessão |
| `user_del` | M | `login`; remove conta |
| `user_link` | M | `login`, `docente` (nome atual ou vazio); associa/desassocia cadastro |

Logins aceitam 3 a 40 caracteres em letras minúsculas, números, ponto, traço ou underscore; `admin` é reservado. Senhas de contas exigem pelo menos 8 caracteres. Não há endpoint de recuperação de senha por e-mail.

`base` é a revisão conhecida; documentos novos usam 0. `set_many` aceita até 200 itens e rejeita payload acima de 10 milhões de caracteres na checagem implementada. Cada `set` tem limite de 2 milhões. A infraestrutura pode impor limites menores. Exclusões do lote enviam as revisões em `deleteBases`.

### Ambientes, reservas e notificações

| `op` | Acesso | Campos principais / efeito |
|---|---|---|
| `environment_list` | M/C/D/A | Retorna ambientes e revisão |
| `environment_save` | M/C/A | `base`, `items` com `id,nome,tipo,capacidade,ativo`; salva cadastro |
| `my_lessons` | Autenticado | Retorna blocos do vínculo docente; sem vínculo retorna lista vazia |
| `reservation_list` | M/C/A; D próprios | Lista pedidos visíveis e revisão |
| `reservation_request` | D vinculado | `turmaId,data,sigla,bloco,ambienteId,finalidade`; deriva demais dados da aula |
| `reservation_reschedule` | D dono | `id` do pedido ativo e campos da nova aula/ambiente; volta a pendente |
| `reservation_decide` | M/C/A | `id,status,motivo`; aprovada/recusada; recusa exige motivo |
| `reservation_cancel` | M/C/A; D dono | `id`; encerra pedido ativo |
| `notification_list` | Autenticado | Notificações próprias/gestão; leitura individual |
| `notification_read` | Destinatário autorizado | `id`; marca leitura |
| `block_list` | Autenticado | Lista manutenção |
| `block_add` | M/C/A | `ambienteId,de,ate,inicio,fim,motivo`; datas ISO e minutos no dia |
| `block_remove` | M/C/A | `id`; remove bloqueio |
| `daily_board` | Autenticado | `data` ISO; grade diária sem login/finalidade/histórico privado |
| `reservation_report` | M/C/A | `de,ate` ISO; pedidos, ocupação e resumo |

Os status persistidos são `pendente`, `aprovada`, `recusada`, `cancelada`, `revisao`. Pedidos ativos incluem pendente/aprovada/revisao. Só aprovada garante ocupação. Uma revisão não pode ser aprovada diretamente: reagende ou encerre. A API trata sobreposição por minutos; início igual ao fim da outra aula não sobrepõe.

### Backups e avisos

| `op` | Acesso | Campos / efeito |
|---|---|---|
| `backup_status` | M/C | Estado do envio de backup por e-mail |
| `backup_list` | M/C | Lista metadados das cópias |
| `backup_now` | M/C | Força cópia atual |
| `backup_download` | M/C | `id`; retorna `data` como texto JSON; C não recebe contas/notificações |
| `backup_restore` | M/C conforme conteúdo | `id`; conteúdo com contas exige M |
| `notify_status` | M/C | Estado dos provedores e agendamento |
| `notify_log` | M/C | Histórico de avisos; filtros conforme interface |
| `notify_preview` | M/C | `turma` sem prefixo `turma-`, `cfg` opcional; diferenças e contagens |
| `notify_baseline` | M/C | `turma`; atualiza base de comparação, sem envio |
| `notify_send` | M/C | `turma,canal,kind`; alterações ou mensagem manual com `assunto,texto` |

Uma chamada de envio modifica o estado e pode contactar destinatários reais. Não execute exemplos de escrita para depurar a API publicada sem autorização operacional.

### Exemplos de corpos de requisição

```json
{"op":"reservation_request","turmaId":"turma-T-EXEMPLO","data":"2027-03-01","sigla":"LOG","bloco":"1-2","ambienteId":"lab-1","finalidade":"Prática de lógica"}
```

```json
{"op":"reservation_decide","id":"ID_DO_PEDIDO","status":"recusada","motivo":"Ambiente em manutenção"}
```

```json
{"op":"set_many","items":[{"id":"geral","base":4,"data":{"docentes":[],"base":"https://SEU_SITE/"}}],"deleted":[],"deleteBases":{}}
```

O terceiro exemplo ilustra apenas o formato; enviar uma lista vazia de docentes tem efeito real de remoção/desvinculação. Use dados descartáveis em um banco isolado para testar.

## 5. Respostas e erros

| HTTP | Interpretação / tratamento |
|---|---|
| 200 | Operação atendida; confira o conteúdo e `ok` quando presente |
| 400 | Dados/operação inválidos; corrija campos e regras |
| 401 | Sem sessão, sessão removida/expirada ou cron sem autorização |
| 403 | Perfil/vínculo sem permissão; não repetir como se fosse erro transitório |
| 404 | Turma, agenda, reserva, conta relacionada ou backup não encontrado conforme operação |
| 409 | Conflito de revisão, versão da prévia, pedido duplicado ou estado incompatível |
| 413 | Documento acima do limite do `set` |
| 422 | Sobreposição/indisponibilidade da grade validada no servidor |
| 500 | Configuração, banco ou processamento; revisar logs sem expor segredos |

Os erros JSON usam `error`. Não assuma que todo 409 inclui `data`: respostas de versões/estado de reserva têm formatos diferentes. O shim conserva revisões e a interface não deve atualizar `lastJson` como salvo quando a operação falhou.

## 6. Transações, migrações e proteção

Escritas passam por transação libSQL/SQLite com contexto assíncrono. Respostas de erro a partir de 400 provocam rollback. A fila em memória serializa dentro do processo; a transação/revisão protege o banco entre processos. Não trate a fila local como lock global.

A inicialização migra colunas de usuários e IDs de docentes. As novas colunas toleram criação concorrente e a primeira migração de IDs confere a revisão. Renomear sincroniza rótulos e referências de contas/turmas/reservas. Validações e permissões são server-side; ocultar botões não é uma barreira de acesso.

Consultas anônimas retornam docs vazio. Docentes recebem somente seu cadastro e turmas filtradas para suas UCs, dias e posições da grade. Exportação de turma é restrita à coordenação. ICS exige login e, para docente, o identificador do próprio vínculo. Ocupação alheia é anonimizada na grade de ambientes.

## 7. Testes e verificação de entrega

A suíte `npm test` executa testes de API, XLSX por turma/docente, horários, prévia e cadastro. Os casos da auditoria incluem escopo de docente, privacidade, vínculo após renomear, sessões, rollback de lote, IDs com slug igual e configuração sem segredo. A suíte de navegador executa ações na interface, downloads e verificações axe em temas e telas móveis.

Não são cobertos por essa evidência: autenticação na hospedagem publicada do usuário, entrega real dos provedores, desempenho sob carga, todos os leitores de tela, conformidade formal com um padrão de acessibilidade ou renderização no Excel de desktop. Mantenha testes de regressão ao alterar regras compartilhadas.

As instruções de operação e diagnóstico estão no [manual](MANUAL-COMPLETO.md). A [lista de validação](CHECKLIST-VALIDACAO.md) organiza uma homologação antes da publicação.
