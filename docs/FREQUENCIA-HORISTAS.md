# Frequência mensal dos horistas

O módulo usa os horários reais do servidor nas retiradas e devoluções assinadas de chaves. O horário planejado da aula não substitui esses registros. O preenchimento inicia na retirada; a devolução fecha o período.

## Configuração inicial

1. Entre com a senha mestre e abra **Docentes → Cadastro e disponibilidade**.
2. Defina **Vínculo: Horista**, matrícula e unidade.
3. No campo **Login do coordenador da frequência**, informe o login de uma conta de coordenação existente. `admin` corresponde à senha mestre. O servidor verifica o perfil dessa conta. Somente a senha mestre pode alterar esse vínculo.
4. Vincule a conta individual do docente ao cadastro em Acesso, como no controle de chaves.

Nenhuma conta real é configurada automaticamente. Cadastros sem vínculo Horista não iniciam novas frequências. Não há importação geral das folhas históricas do arquivo de referência.

## Dia a dia

- O docente confirma retirada e devolução normalmente, com QR ou no terminal sem celular. A gravação da frequência ocorre na mesma transação da movimentação: se falhar, a movimentação não é confirmada.
- Os registros preservam identificadores dos eventos assinados, horários originais, chave, turma, disciplina e hashes dos eventos. A tela reúne os períodos por dia, em horário de Brasília.
- Sobreposições entre chaves contam uma única vez. Intervalos entre períodos não somam horas. Passagens pela meia-noite são divididas entre os dias e meses correspondentes.
- Uma devolução ausente fica pendente. Devoluções superiores a 48 horas exigem conferência explícita. Mais de dois períodos separados no dia também exigem ajuste, pois o modelo mensal possui duas faixas de entrada e saída.
- Atividades que não envolveram chave podem ser registradas por ajuste manual com justificativa. Ajustes não substituem a evidência original. Uma movimentação nova após um ajuste exige nova conferência.

## Envio e validação

O docente abre **Minha frequência** no calendário, ou a coordenação abre **Frequência → Abrir frequência de horistas**. Também há link em Ambientes e acesso direto em `/frequencia.html`.

Após encerrar o mês, o docente escolhe o mês, confere os horários e intervalos, marca o aceite e clica em **Enviar mês à coordenação**. Matrícula, unidade, coordenador e devoluções precisam estar resolvidos. O envio gera uma notificação interna para o coordenador vinculado, sem depender de e-mail. Enquanto aguarda análise, o docente não altera a folha.

O coordenador responsável pode consultar os registros, devolver com parecer ou validar. Ajustar uma frequência enviada a devolve para nova conferência do docente. Frequências validadas ficam bloqueadas; reabri-las exige justificativa e novo envio. Um movimento novo após envio ou validação reabre o mês e preserva o histórico anterior.

Coordenadores comuns só acessam seus docentes. O mestre consulta todos. Docentes só consultam o próprio cadastro. Perfis de aluno e ambientes, assim como a sessão restrita do terminal, não acessam o módulo mensal.

## Excel e pagamento

**Baixar frequência Excel** gera a folha mensal baseada nos campos do modelo fornecido: identificação, matrícula, unidade, duas entradas/saídas, observações, conferência do docente e total de horas. A aba **Registros** contém evidências e histórico de ajustes/envio/validação. O estado da folha aparece no arquivo, inclusive quando ainda não validada.

O aceite de envio e o parecer são registros eletrônicos identificados, não uma reprodução de assinatura manuscrita. A assinatura da chave não é reutilizada como assinatura automática da frequência mensal.

O módulo registra horas para conferência. Não calcula valores salariais, adicionais, horas extras, banco de horas ou pagamento e não envia arquivos ao RH ou a uma folha salarial externa. Esses itens não são inferidos das fórmulas históricas do modelo.

## Manutenção

Os dados ficam em `frequency_sheets`, separados dos documentos gerais. O backup mestre inclui `frequencySheets`; backups baixados por coordenadores comuns removem esse escopo. A restauração inclui frequências somente quando esse campo está presente, e não restaura a revisão anterior como uma autorização para sobrescrita concorrente.

API POST: `frequency_config`, `frequency_month`, `frequency_day_edit`, `frequency_submit`, `frequency_review`, `frequency_export`. Ações de gravação exigem `rev`. A exportação retorna XLSX, não JSON. Coordenador, mês, estado e propriedade são validados no servidor.
