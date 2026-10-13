# Reservas, aprovação e reagendamento

## Professor
1. Entre com sua conta vinculada em `/ambientes.html`.
2. Em **Nova solicitação**, escolha uma aula atual/futura do calendário, um ambiente disponível e a finalidade.
3. Clique em **Enviar para aprovação**. O pedido começa pendente.
4. Acompanhe status e decisões na seção **Reservas** e os avisos em **Notificações**.
5. Para alterar aula ou ambiente, clique em **Reagendar**, preencha a nova seleção e envie. O pedido volta a pendente e libera a ocupação anterior; a mudança exige nova aprovação.
6. **Cancelar** encerra o pedido ou reserva e libera a ocupação.

## Gestão de ambientes
Coordenação e contas de administrador de ambientes podem aprovar, recusar ou cancelar. A recusa exige motivo. O histórico registra autor, data, decisão e dados anteriores do reagendamento.

## Regras de disponibilidade
A identidade do solicitante e os horários são obtidos pelo servidor a partir da conta e da aula escolhida. O professor não solicita em nome de outra pessoa.
O pedido e a aprovação verificam disponibilidade, bloqueios, reservas aprovadas e outras aulas já ocupando o espaço. Horários que apenas se encostam não conflitam. Pedidos pendentes não garantem ocupação. Só existe um pedido ativo por aula.
As operações de escrita usam transações para proteger a validação contra aprovação, alteração de calendário ou bloqueio simultâneos.

## Sincronização com o calendário
Alterações de aula, docente, turno, sala, curso ou turma; exclusão/cancelamento da aula; desativação do ambiente; bloqueios ou conflitos novos marcam pedidos futuros afetados como **Precisa de revisão**.
Uma reserva nesse estado deixa de garantir o horário e não pode ser aprovada diretamente. O professor deve reagendar usando os dados atuais; a gestão pode recusá-la ou cancelá-la. O aviso e o motivo ficam registrados.
A sincronização ocorre ao salvar/excluir/restaurar dados do calendário e ao consultar reservas, grade ou relatórios. Alterações feitas diretamente no banco são reconhecidas na próxima consulta dessas telas. Reservas passadas preservam seu histórico.
A reserva aprovada não altera o campo Sala/Lab. da disciplina: a grade combina a ocupação do calendário e das reservas, usando a reserva aprovada no lugar da sala original daquela aula.
Os horários seguem o intervalo do turno, conforme o calendário existente.

## Notificações
Novos pedidos e reagendamentos avisam a gestão; decisões, cancelamentos e necessidade de revisão avisam o professor. Clique no aviso para ir à reserva e use **Marcar como lida**. A leitura é individual, inclusive para contas de gestão.
Os avisos são internos. São atualizados ao executar ações e a cada 30 segundos enquanto a tela permanece ativa. Não há envio de e-mail ou WhatsApp de reservas nesta implementação.

## Relatórios
A gestão seleciona um período, gera o relatório e consulta pedidos/aprovações por ambiente, horas de reservas, horas do calendário e horas totais de ocupação prevista; a segunda tabela agrupa por docente.
Aulas do calendário e reservas aprovadas entram nas horas, com deduplicação da aula já reservada. Pendentes, recusadas, canceladas e em revisão não somam horas de reserva. Os indicadores medem a ocupação prevista, sem confirmar presença física.
Use **Exportar CSV** para registros detalhados e **Imprimir / salvar PDF** para o relatório formatado. Escolha Salvar como PDF no diálogo de impressão do navegador.
