# Checklist de instalação, homologação e atualização

Use uma cópia isolada do banco para testes que criem ou alterem registros. Não marque um item como concluído somente porque o build passou.

## Preparação

- [ ] Registrar versão/pacote, data, responsável e banco de destino.
- [ ] Fazer backup externo da produção e guardar as variáveis de ambiente separadamente.
- [ ] Conferir Node/npm, lockfile, dependências e build.
- [ ] Definir ADMIN_PASSWORD e SESSION_SECRET fortes/diferentes.
- [ ] Conferir Turso remoto na hospedagem ou diretório/volume SQLite local.
- [ ] Confirmar que modelos Excel, API e código-fonte acompanham o pacote.

## Acesso e cadastros

- [ ] Visitante vê agendas, mas não grava nem baixa Excel autenticado.
- [ ] Senha mestre cria conta; coordenação comum não administra contas.
- [ ] Docente novo é cadastrado, vinculado e encontra as próprias aulas.
- [ ] Nome, matrícula, e-mails, telefone e vínculo são validados.
- [ ] Renomear mantém conta/disciplinas/reservas e o link permanente.
- [ ] Remover vínculo impede novos pedidos daquele docente.
- [ ] Trocar senha encerra a sessão anterior e permite novo login.
- [ ] Conta docente não recebe alunos/observações de colegas nem altera aulas alheias.

## Planejamento

- [ ] Conferir turno, datas, carga horária e aulas por dia.
- [ ] Distribuir duas UCs em blocos distintos no mesmo dia.
- [ ] Conferir contagem de aulas e encontros equivalentes na saída correta.
- [ ] Verificar pausa NEM, Diurno, horários vazios, feriados e bloqueios.
- [ ] Verificar conflito real e horários que apenas se encostam.
- [ ] Confirmar salvamento de lote completo e rollback de lote com erro.
- [ ] Simular edição concorrente em homologação e tratar 409 sem sobrescrever silenciosamente.

## Reservas e notificações

- [ ] Cadastrar ambiente ativo e bloquear manutenção.
- [ ] Solicitar uma aula/bloco válido; impedir pedidos por outro docente.
- [ ] Aprovar, recusar com motivo, cancelar e reagendar.
- [ ] Alterar aula aprovada e conferir revisão e liberação da ocupação garantida.
- [ ] Conferir painel diário e privacidade de finalidade/histórico por perfil.
- [ ] Abrir notificação e conferir leitura individual.
- [ ] Conferir relatório sem duplicar a aula substituída por reserva.

## Calendário e arquivos

- [ ] Combinar filtros e limpar; verificar contador e estado sem resultados.
- [ ] Confirmar sala efetiva da reserva por bloco.
- [ ] Mostrar cancelamentos sem contá-los nas próximas aulas ativas.
- [ ] Abrir prévias por turma/docente; navegar em mês, planilha e zoom.
- [ ] Voltar às opções, reabrir e baixar XLSX válido.
- [ ] Alterar dados após abrir a prévia e exigir atualização antes do download.
- [ ] Testar a alternativa sem prévia em falha simulada.
- [ ] Conferir HTML independente, impressão PDF, CSV com textos especiais e ICS.

## Celular e acessibilidade

- [ ] Conferir larguras pequenas, grade de sete colunas e rolagem das tabelas.
- [ ] Navegar por Tab, setas, Enter/Espaço e Escape; conferir retorno do foco.
- [ ] Conferir rótulos, contraste, tema claro/escuro e destaque da próxima aula.
- [ ] Testar com o leitor de tela usado pela unidade, além das verificações automáticas.

## Backups e operação

- [ ] Criar e baixar backup; conferir escopo v1/v2 e presença de contas.
- [ ] Ensaiar restauração em banco separado e conferir remoções/recuperações.
- [ ] Validar nova sessão após restauração de contas.
- [ ] Conferir logs e execução do agendamento das 23:00 UTC.
- [ ] Validar remetente/template/destinatários antes de envio real autorizado.
- [ ] Conferir respostas da API e limites da hospedagem após nova implantação.
- [ ] Registrar itens pendentes, evidências e responsável pela liberação.
