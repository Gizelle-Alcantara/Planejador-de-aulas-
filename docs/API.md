# Referência da API

Edição: 19/10/2026. Contrato interno de manutenção, baseado em lib/core.js e lib/key-control.js. Não há garantia de compatibilidade pública entre versões nem token público de integração.

## 1. Convenções

Rota única: `/api`. POST recebe JSON com `op`; navegador envia cookie plan_sess da mesma origem. Content-Type: application/json. Não coloque senha/cookie/token em URL. Sem sessão, GET básico devolve user:null e docs vazios; operações protegidas exigem autenticação. Perfis: M=mestre; C=coordenação; A=ambientes; D=docente; E=aluno; P=entrada pública.

JSON de erro usa `error`; respostas podem incluir outros campos. x-request-id identifica a requisição para suporte. Algumas operações retornam ok e outras um objeto próprio: confira response.ok/status, não suponha um envelope universal.

| HTTP | Interpretação |
|---|---|
| 200 | Operação/consulta concluída |
| 400 | Operação/campo/regra inválida |
| 401 | Entrada necessária, sessão ou credencial inválida |
| 403 | Perfil/vínculo/escopo não autorizado |
| 404 | Recurso não encontrado ou comprovante não visível |
| 405 | Método não aceito |
| 409 | Revisão, versão da prévia ou estado conflitante |
| 422 | Conflito de programação nas validações aplicáveis |
| 429 | Limite de login ou diagnóstico atingido; login inclui Retry-After em segundos |
| 500/503 | Falha de servidor/configuração/provedor ou recuperação indisponível |

Exemplo de consulta na própria origem, sem credenciais embutidas:

```javascript
const response = await fetch('/api', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({op: 'key_list', upcoming: true})
});
const result = await response.json();
if (!response.ok) throw new Error(result.error || 'Falha na consulta');
```

## 2. GET

| Consulta | Acesso e resultado |
|---|---|
| Sem parâmetros | Projeção por sessão: user, docs e revisões; admin indica presença de sessão, não permissão universal |
| ?ics=turma-CODIGO | Agenda autenticada; coordenação |
| ?ics=docente-ID | Coordenação ou próprio docente por identificador estável |
| ?export=turma-preview&turma=turma-CODIGO | M/C; JSON da prévia da turma |
| ?export=xlsx&turma=turma-CODIGO | M/C; XLSX; incluir=1 permite incluir fora do período |
| ?export=docente-preview&docente=NOME&ano=2027 | M/C ou D próprio; prévia anual; vinculo opcional |
| ?export=docente-xlsx&docente=NOME&ano=2027 | Mesmo escopo; arquivo anual |
| ?export=modelo-ambientes | M; modelo de importação XLSX |
| ?export=programacao-diaria&data=2027-03-01&formato=html | M/C/A; snapshot externo; formato=xlsx para Excel; ambiente opcional |
| ?cron=1 | Bearer CRON_SECRET; executa backup/avisos, portanto não é consulta sem efeitos |

Alunos só podem usar GET básico, projetado para sua turma. Perfil ambientes não exporta agendas acadêmicas. Use URLSearchParams para codificar nomes e parâmetros. XLSX/HTML são respostas binárias/textuais de arquivo, não JSON de sucesso.

Prévia inclui title, filename, version, styles, sheets e conflicts. Download XLSX pode enviar versao=HASH; divergência retorna 409. Não construa links de docente por slug de nome: utilize identificador/link fornecido pela interface.

## 3. Sessão e recuperação — POST

| op | Perfil | Campos e efeito |
|---|---|---|
| login | P | login, password; admin/login vazio usa senha mestre; cria cookie |
| logout | P/sessão | Expira cookie |
| student_login | P | code; valida código da turma e cria sessão restrita |
| password_reset_status | P | Retorna enabled conforme provedor/URL |
| password_reset_request | P | login, email; resposta genérica quando serviço habilitado |
| password_reset_confirm | P | token, password; troca senha, invalida sessões/token |
| student_code_generate | M/C | turmaId; novo código exibido uma vez e revogação do anterior |
| student_code_revoke | M/C | turmaId; remove autorização de acesso da turma |

Recuperação: token hexadecimal de 64 caracteres, 15 minutos, uso único; confirmação aceita senha de 8 a 1024 caracteres. E-mail mestre não é redefinido por esse fluxo.

## 4. Contas — POST mestre

| op | Campos principais |
|---|---|
| users | Lista sem hashes/salts; retorna users |
| user_add | login, nome, password, role, recoveryEmail |
| user_pw | login, password; renova versão de sessão |
| user_del | login; exclui conta e tokens de recuperação |
| user_link | login, docente; vincula cadastro ou desassocia |
| user_recovery_email | login, email; atualiza endereço e revoga reset pendente |

Logins: 3 a 40 letras minúsculas, números, ponto, traço ou underscore; admin reservado. Senhas de contas exigem pelo menos 8 caracteres. Perfis de conta: coord, docente e ambientes. O acesso aluno é código de turma, não user_add.

## 5. Documentos, histórico e planejamento

| op | Perfil | Campos e resultado |
|---|---|---|
| set | M/C; D restrito | id, data, base, note; grava validado; D só alterações permitidas de próprias aulas |
| set_many | M/C | items [{id,data,base}], deleted, deleteBases; lote atômico, revisões em revs |
| delete | M/C | id; exclui com histórico; para concorrência prefira lote com deleteBases |
| history | M/C | Lista histórico |
| history_detail | M/C | hid; detalhes/diferenças da versão |
| restore | M/C | hid; restaura documento e sincroniza reservas |
| planning_preview | M/C | turmaId, options; retorna plan e token |
| planning_apply | M/C | turmaId, options, token; aplica plano conferido se estado compatível |
| management_report | M/C | filters; retorna report, csv e generatedAt |

base é revisão conhecida; documento novo usa 0. set_many aceita até 200 itens e verifica tamanho de até 10 milhões de caracteres; set até 2 milhões. Hospedagem pode impor limite menor. Trate 409 recarregando/comparando, sem sobrescrever automaticamente.

## 6. Ambientes, aulas e reservas

| op | Perfil | Campos/efeito |
|---|---|---|
| environment_list | M/C/A/D | items e rev |
| environment_save | M/C/A | base, items com id/nome/tipo/capacidade/ativo; valida dependências de exclusão |
| environment_import_preview | M | file em base64 XLSX; prévia e base |
| environment_import_apply | M | file e base; revalida e aplica; created/updated/unchanged/rev |
| my_lessons | Autenticado com escopo | Aulas do vínculo docente; sem vínculo, lista vazia |
| managed_lessons | M/C/A | Aulas disponíveis para agendamento pela gestão |
| reservation_list | M/C/A; D próprias | items e rev |
| reservation_request | D vinculado | turmaId, data, sigla, bloco, ambienteId, finalidade; aula própria/laboratório |
| reservation_book | M/C/A | Dados da aula, docente e ambiente; agendamento pela gestão |
| reservation_reschedule | D dono conforme regra | id e novos dados da aula/ambiente; volta a pendente |
| reservation_decide | M/C/A | id, status, motivo; aprovar/recusar; recusa exige motivo |
| reservation_cancel | M/C/A; D dono | id de pedido ativo |
| block_list | M/C/A/D | Lista/projeção dos bloqueios |
| block_add | M/C/A | ambienteId, de, ate, inicio, fim, motivo |
| block_remove | M/C/A | id |
| daily_board | M/C/A/D | data; ocupação prevista; filtros adicionais são da interface |
| reservation_report | M/C/A | de, ate; relatório de ambientes |

Importação aceita arquivo .xlsx; a interface limita a 2 MB. O servidor faz validações próprias; não dependa do limite do navegador para segurança. Finalidade de reserva: obrigatória, até 1000 caracteres. Datas/horários e titularidade são derivados/revalidados no servidor. Status: pendente, aprovada, recusada, cancelada, revisao.

Os nomes de filtros específicos dos relatórios seguem as chamadas de src/static/ambientes.js e src/tpl.html; não são um contrato de integração externa estável.

Horários de bloqueios e projeções de ocupação usam minutos desde meia-noite (por exemplo, 450 = 07:30), não strings HH:mm. Dates de negócio usam YYYY-MM-DD. A finalidade do pedido aceita até 1000 caracteres; motivo de bloqueio, até 500.

## 7. Chaves

| op | Perfil | Campos e efeito |
|---|---|---|
| key_list | M/C/A/D | date; D upcoming=true inclui futuras próprias; items, keys, date |
| key_create | M/C/A | code, ambienteId; cria key com token QR |
| key_toggle | M/C/A | id; alterna active se sem pendência |
| key_allocate | M/C/A | keyId, docente, turmaId, data, sigla, bloco; cria alocação/reserva validada |
| key_cancel | M/C/A | id de alocação ainda alocada |
| key_terminal_prepare | D vinculado no terminal | id da própria alocação; retorna key com token QR, sem registrar movimentação; exige retirada aberta ou alocação do dia com chave ativa |
| key_scan | M/C/A/D | token; identifica chave e alocações visíveis elegíveis |
| key_sign | D vinculado | id da alocação, token, action, name, consent, signature |
| key_receipt | M/C/A ou D proprietário | id do evento; retorna receipt |

Docente recebe keys vazio; não catálogo geral. Alocação é própria pelo docenteId estável. action aceita retirada ou devolucao. name deve corresponder ao docente da sessão; consent deve ser true. signature é array de traços, cada traço com pontos [x,y] normalizados entre 0 e 1. O servidor verifica tamanho, extensão e quantidade de pontos. Não envie imagem base64 como assinatura.

Limites atuais: 500 chaves e 10.000 alocações; identificação de chave até 60 caracteres. Retirada só no dia da aula; devolução exige status retirada. Comprovantes listados resumem eventos sem desenho; key_receipt retorna evento completo autorizado.

## 8. Notificações, envios e backup

| op | Perfil | Campos/efeito |
|---|---|---|
| notification_list | Autenticado autorizado | Lista pessoal/gestão projetada |
| notification_read | Destinatário autorizado | id; leitura individual |
| notification_read_many | Destinatário autorizado | ids; leitura em lote |
| notification_delete | Destinatário autorizado | id; oculta para o login, preservando demais usuários |
| notify_status | M/C | Estado dos provedores |
| notify_log | M/C | Histórico de envio |
| notify_preview | M/C | turma; prévia conforme configuração da turma |
| notify_send | M/C | turma e opções da interface; envio externo real quando configurado |
| notify_baseline | M/C | turma; redefine base de comparação |
| backup_status | M/C | Configuração do envio de backup |
| backup_list | M/C | Lista de snapshots |
| backup_now | M/C | Cria snapshot manual |
| backup_download | M/C | id; download projetado pelo perfil |
| backup_restore | M/C conforme escopo | id; restaura snapshot com cópia prévia |

WhatsApp manual usa link wa.me no navegador e não uma operação de envio dessa API. Não marque mensagem como entregue com base apenas na abertura da conversa.

## 9. Diagnóstico e Publicação

| op | Perfil | Campos/efeito |
|---|---|---|
| diagnostics_client | Autenticado autorizado | event, operation; incidente sanitizado; até 10 por janela de 10 min por conta |
| diagnostics_list | M | category, state=open/resolved/all; grupos e resumo |
| diagnostics_resolve | M | id, count; só resolve se contagem ainda corresponde |
| publication_status | M | Configuração, conexão, integridade/atualidade de backup e checks manuais |

## 10. Alterações no contrato

### Modo de painel compartilhado

GET/POST `/api?kiosk=1` usam exclusivamente cookie `plan_key_kiosk`, com sessão de finalidade própria e validade máxima de 300 segundos. Não há herança do cookie `plan_sess`; trocar o nome do cookie não permite usar o token fora da finalidade assinada. Login aceita apenas conta docente; mestre e perfis de gestão são recusados.

Operações permitidas: login, logout, key_list, key_terminal_prepare, key_scan, key_sign e key_receipt, com as mesmas verificações de titularidade. GET básico retorna somente user resumido ou null, sem documentos. Outros parâmetros de consulta/operações são recusados. Logout limpa apenas o cookie do painel. O cliente encerra por inatividade de 90 segundos e após concluir uma movimentação; o limite absoluto de 5 minutos também é verificado pela assinatura no servidor.

O filtro de retirada do painel mostra alocações do dia; devolução mostra retiradas abertas. A filtragem visual não substitui as validações de key_sign. O módulo compartilhado aceita workflow e onSigned para concluir o atendimento sem expor assinatura/comprovante completo no terminal.

Antes de integrar, confira campos exatos na implementação e nos testes de domínio. Ao mudar uma operação, atualize esta referência, interface chamadora e testes. Preserve projeções por perfil, transações e revisões. Não exponha novos endpoints de escrita sem política de autorização explícita.

### Autoatendimento sem celular

POST key_terminal_prepare com id da alocação exige sessão plan_key_kiosk de docente vinculado e proprietário. Retorna key com token para exibir o QR; não altera a movimentação. key_sign mantém validações de aula, reserva, assinatura e aceite. Eventos do terminal incluem method=terminal.
