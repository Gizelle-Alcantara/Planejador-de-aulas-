# Correções da auditoria

## Permissões e privacidade
A conta docente registra somente dias cujas disciplinas pertencem integralmente ao docente vinculado. Não altera registros de outras turmas/docentes nem a lista de alunos. Dias com disciplinas de docentes diferentes exigem registro pela coordenação, pois a confirmação ainda é por dia.

Dados de alunos, destinatários, envios e observações internas de outros docentes não são enviados à conta docente. A coordenação mantém acesso completo. A consulta pública recebe apenas o ambiente aprovado necessário ao calendário, sem login, finalidade ou histórico da reserva.

## Sessões e configuração
Trocar a senha ou restaurar contas invalida sessões anteriores. A atualização também exige novo login nas contas existentes. A sessão mestre é invalidada quando ADMIN_PASSWORD muda. ADMIN_PASSWORD e SESSION_SECRET são obrigatórios; não há chave padrão. Reinicie ou faça nova implantação após configurar as variáveis. Use valores fortes e diferentes.

## Identificadores e salvamento
Cadastros antigos recebem identificadores permanentes automaticamente. Contas, disciplinas e reservas passam a guardar a referência do docente. Renomear atualiza os vínculos e os nomes de exibição dentro da mesma transação. Remover o docente desvincula sua conta. Novos links de agenda usam o identificador; links antigos por nome continuam funcionando quando não são ambíguos.

O planejamento é salvo em lote. Erro, conflito de versão ou falha de validação desfaz o lote inteiro. Exclusões verificam a versão. Em conflito, recarregue e confira a versão atual antes de editar novamente. O navegador avisa ao fechar com alterações pendentes ou erro de gravação.

## Calendário e CSV
A agenda do docente mostra aulas canceladas e permite filtrá-las, sem somá-las como aulas ativas. Filtros de sala, agenda, cronograma e CSV usam o ambiente da reserva aprovada por bloco, com a sala da disciplina como alternativa. A consulta pública recebe somente a projeção desses ambientes.

Os CSVs de turma e docente escapam aspas, separadores e quebras de linha e neutralizam textos que poderiam ser interpretados como fórmulas.

## Verificação
67 testes automatizados passaram, incluindo restrições por docente, privacidade, troca de senha, vínculos, rollback de lote, links com nomes de mesmo slug e configuração sem segredo. Os testes de navegador verificaram cadastro, reservas, horários, acessibilidade, filtros, cancelamentos, links permanentes e exportações com prévia e alternativa direta. A execução usou bancos temporários. A hospedagem publicada não foi alterada.
