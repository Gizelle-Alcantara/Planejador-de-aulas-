# Solicitações e aprovação de reservas

## Professor
1. Acesse a aba Ambientes → Abrir gestão de ambientes e entre com sua conta.
2. A conta precisa estar vinculada ao nome cadastrado do docente pela senha mestre.
3. Em Minhas solicitações, escolha uma aula atual ou futura, um ambiente disponível e a finalidade.
4. Clique em Solicitar reserva. O pedido começa pendente.
5. Consulte o status e o histórico; use Cancelar para liberar uma reserva aprovada ou desistir de um pedido pendente.

## Coordenação
Entre com a conta de coordenador ou a senha mestre na mesma tela. A seção Solicitações e reservas permite Aprovar, Recusar (com motivo obrigatório) ou Cancelar. Nesta versão, as contas de coordenação exercem a aprovação; não há um perfil separado de administrador de ambientes.

## Regras
- A identidade, a turma, a disciplina e os horários vêm da aula do calendário; o professor não informa o nome de outro docente nem escolhe horários livres.
- Solicitações pendentes não bloqueiam o ambiente. Ao aprovar, o servidor verifica novamente a aula e impede sobreposição com reservas aprovadas ou com ocupações do calendário de outras aulas.
- Só existe uma solicitação pendente/aprovada por aula. Uma solicitação recusada ou cancelada permite um novo pedido.
- O docente só consulta e cancela seus próprios pedidos; coordenação consulta todos.
- Datas, horários e autoria ficam registrados no histórico. Não há envio automático de e-mail ou WhatsApp de reservas nesta etapa; consulte Atualizar reservas.
- Cancelamento libera o ambiente. Reagendamento é feito cancelando e solicitando novamente.

## Integração e limites
Reservas são armazenadas no documento reservas do banco usado pela API, incluídas no backup de documentos e protegidas por revisão para impedir duas aprovações simultâneas conflitantes. Os dados originais do pacote não foram alterados.
A aprovação não reescreve o campo Sala/Lab das disciplinas nem altera o calendário da turma. A ocupação aprovada é consultada na tela de ambientes. Alterações posteriores da coordenação no calendário não cancelam automaticamente reservas já aprovadas: cancele a reserva afetada e faça uma nova solicitação. A verificação usa o intervalo completo do turno, conforme o calendário existente.
A disponibilidade de ambientes é verificada no pedido e na aprovação. A capacidade é informativa.

## Validação
27 testes de API aprovados: permissões, privacidade, calendário alterado, duplicidade, recusa, cancelamento e aprovação concorrente. Site gerado e JavaScript verificado. Revisão visual de navegador permanece pendente por ausência do executável de navegador neste ambiente. Nenhuma publicação ou mensagem externa realizada.
