# Referência técnica e arquitetura

Edição: 19/10/2026. Veja também [API](API.md), [operação](OPERACAO-E-MANUTENCAO.md) e [segurança](SEGURANCA-E-RECUPERACAO.md).

## 1. Arquitetura

JavaScript ESM, frontend HTML/CSS/JS e backend Node/libSQL. O núcleo atende servidor local e adaptadores Vercel/Netlify. Não há React nem backend separado de chaves.

Fluxo: navegador → `/api` → autenticação/projeção por perfil → validação → transação/revisões → SQLite local ou Turso remoto → resposta. Exportações usam dados salvos e modelos do servidor.

| Caminho | Responsabilidade |
|---|---|
| src/tpl.html | Interface principal, estado e formulários |
| src/shim.js | Sessão, API, revisões, atualização e downloads |
| src/static/ | Ambientes, chaves, mobile, busca, recuperação, avisos e estilos |
| scripts/build.js | Geração de public, regras compartilhadas e logo |
| public/ | Saída de build; não editar como fonte principal |
| lib/core.js | API, banco, migrações, acesso, histórico, backups e rotinas |
| lib/local-database.js | Conexão local reutilizada e fila transacional |
| lib/schedule.js | Turnos, blocos, EAD, Ambientação e conflitos |
| lib/docentes.js | Validação de docentes |
| lib/planning.js, turma-copy.js, search.js | Planejamento, cópia e busca |
| lib/environments.js, environment-import.js | Ambientes e importação |
| lib/reservations.js | Reservas, ocupação e sincronização |
| lib/key-control.js | Catálogo, alocações, movimentos e comprovantes |
| lib/calendar-export.js, teacher-calendar-export.js | XLSX de turma/docente |
| lib/daily-display.js, excel-preview.js, ics.js | Programação externa, prévia e agendas |
| lib/notify.js, calendar-notifications.js | Mensagens e avisos |
| lib/diagnostics.js, publication.js | Incidentes e preparação de publicação |
| lib/management-report.js, history-diff.js | Relatórios e diferenças |
| lib/assets/ | Modelos XLSX originais |
| server.js, api/index.js, netlify/functions/ | Adaptadores de execução |
| tests/ | Testes de domínio/API e navegador |

## 2. Dependências

package.json declara Node >=18; a instalação documentada usa Node 24 com --env-file. Dependências runtime: @libsql/client, fflate, jsqr e qrcode-generator. Desenvolvimento: Playwright e axe. npm ci respeita package-lock.json; registre versões realmente executadas.

O servidor não lê .env sozinho. Exige ADMIN_PASSWORD e SESSION_SECRET. Banco padrão: file:./data/planejador.db; remoto: TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.

## 3. Modelo persistido

A API usa tabelas operacionais e documentos JSON. Os arquivos de banco/ não substituem esse esquema. Inicialização em core.js cria tabelas/índices e adiciona colunas; não há framework externo de migração versionada.

| Tabela | Campos/finalidade |
|---|---|
| docs | id, JSON data, updated_at, rev, updated_by |
| history | doc_id, snapshot, data, autor, revisão e nota |
| users | login, nome, salt/hash, role, docente/docente_id, recovery_email, session_key, criação |
| backups | Data, tipo, autor, tamanho, hash, contagem e payload compactado |
| notify_state | Base de comparação e último lembrete por turma |
| notify_log | Resultado, canal, resumo e erro dos envios |
| notifications | target, message, reservation_id, at, kind/doc_id, seen e dismissed |
| key_control | Registro único id=1; JSON keys, assignments e events |
| student_access | turma_id, code_hash e session_key |
| password_resets | token_hash, login, session_key e expires_at |
| password_reset_limits | Contadores e janela da recuperação |
| system_events | Fingerprint, categoria, código, referência, contagem e resolução |
| diagnostic_limits | Limites de incidentes enviados pelo cliente |

Documentos: geral (docentes/configuração), turma-CODIGO (state), ambientes, reservas e bloqueios (items). IDs são referências estáveis; nomes são rótulos. Preserve IDs ao renomear pessoas/recursos.

### Exemplo didático de programação

```json
{"state":{"cfg":{"turma":"EXEMPLO","turno":"Matutino","aulasDia":4,"inicio":"2027-03-01","termino":"2027-03-31"},"ucs":[{"sigla":"LOG","nome":"Lógica","ch":20,"docente":"Pessoa exemplo","sala":"Sala exemplo"}],"days":{"2027-03-01":{"s":["LOG"],"grade":["LOG","LOG","LOG","LOG"]}},"reg":{}}}
```

É um esquema de armazenamento, não payload completo de importação. s reúne siglas únicas; grade representa posições; blocos são derivados. Dados legados sem grade usam bloco do dia. Atividades paralelas EAD usam ead e quantidades opcionais eadHours.

## 4. Regras compartilhadas

- Sobreposição presencial considera docente, ambiente e indisponibilidade; intervalos adjacentes não se sobrepõem.
- slotsOf define início e pausas do turno. Grade explícita aceita 1 a 12 aulas/dia e não ultrapassa meia-noite.
- Ambientação reconhecida pelo domínio pode anteceder o período.
- isEAD libera ambiente/horário presencial e ocupação; EAD pode ser paralela.
- Docente solicita laboratório para aula própria; gestão agenda salas.
- Reserva aprovada altera local efetivo do bloco; mudanças relevantes podem exigir revisão.
- Chave é alocada a aula presencial/reserva e docente com conta vinculada.
- Retirada: dia atual, QR correto, chave ativa/livre, aula/reserva válidas, conta proprietária, assinatura e aceite. Devolução: retirada em aberto e QR correto.

Altere regras em lib e valide sua transformação para navegador pelo build. Nunca substitua checagem transacional por validação apenas da interface.

## 5. Concorrência

inWriteTransaction propaga a transação pelo contexto assíncrono e usa fila de escrita. Erro faz rollback; sucesso commit; finally fecha/libera. Revisão antiga retorna 409; set_many é atômico.

No banco de arquivo, local-database.js serializa acesso e mantém uma conexão de BEGIN até commit/rollback/close. Isso evita o caminho de troca de conexão associado a falhas nativas no teste de carga. A causa C++ exata não foi comprovada. Cliente remoto web não usa essa adaptação.

## 6. Exportação

XLSX usa modelos em lib/assets e ZIP/XML por fflate. Prévia lê o workbook gerado e calcula versão; download pode exigir o mesmo hash. CSV protege textos que poderiam virar fórmula. PDF usa impressão do navegador. ICS exige autenticação.

Excel diário e HTML externo derivam de aulas planejadas, reservas e bloqueios, com deduplicação da aula reservada. HTML é snapshot independente, sem autenticação de quem recebe ou atualização automática.

## 7. Mobile e cache

mobile.js escolhe Agenda em telas pequenas e preserva preferência da sessão. mobile-app.js oferece instalação, menu, navegação e aviso offline. Manifest define aplicação instalável; sw.js cacheia shell e não respostas da API. Não há fila de gravação offline.

Minhas chaves usa key_list com upcoming=true para próprias futuras pendentes e retiradas abertas. Leitor aparece após selecionar ação; a interface e o servidor conferem correspondência da alocação.

## 8. Rotinas e retenção

Rotina diária executa backup e avisos. Vercel: 23:00 UTC; Node verifica horário com processo ativo; Netlify tem adaptador agendado. Partes do domínio usam UTC-3 fixo, sem suporte completo a múltiplos fusos por unidade.

Histórico: até 60 versões/documento e consulta global até 80. Backups: últimas 30 cópias e primeira de cada um dos 12 meses distintos mais recentes com cópias; listagem até 60. Diagnóstico: retenção declarada 30 dias, até 500 grupos e consulta até 100. Essas retenções não substituem política institucional de dados.
