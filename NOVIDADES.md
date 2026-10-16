# Novidades desta versão

## Central de conflitos
- **Ocorrências no painel.** A turma aberta é comparada com as demais por data e horário. A central identifica docente em duas turmas, ambientes definidos nas disciplinas ou no local da turma, indisponibilidade de docentes e distribuição antiga com disciplinas simultâneas.
- **Detalhes e filtros.** Cada ocorrência mostra o intervalo em conflito e as turmas, disciplinas, docentes e ambientes envolvidos. O filtro separa os tipos de ocorrência.
- **Revisão direta.** Revisar lançamento abre o calendário da turma escolhida no mês e dia corretos, com o editor do dia. A navegação não altera os dados; as ocorrências são recalculadas após a edição.
- **Horários efetivos.** A comparação respeita blocos de aulas, intervalos e cancelamentos. Horários consecutivos sem sobreposição não geram conflito.

## Menus e formulários
- **Áreas identificadas.** As abas agora ficam agrupadas em Acadêmico, Ambientes e Administração. A navegação por setas e as restrições por perfil foram preservadas.
- **Validação junto ao campo.** Campos obrigatórios recebem um asterisco. Erros de preenchimento são associados ao campo para leitores de tela e desaparecem ao corrigir o valor.
- **Cadastro de contas.** O formulário valida usuário e senha antes do envio, impede envios duplicados e mantém os dados quando o servidor recusa o cadastro ou a conexão falha.
- **Dados da turma.** Alterações inválidas de campos obrigatórios, datas, e-mail e quantidade de aulas não são gravadas. O estado de salvamento aparece junto ao formulário.

## Painel da coordenação e navegação
- **Prioridades com atalhos.** O painel destaca aulas para planejar, disciplinas sem docente, erros no calendário e reservas pendentes ou em revisão. Os três primeiros indicadores se referem à turma aberta; reservas incluem todas as turmas acessíveis à coordenação.
- **Reservas atualizadas.** Alterações nas reservas atualizam o painel na próxima sincronização, mesmo sem mudanças nas turmas.
- **Retorno ao calendário.** O botão Voltar da gestão de ambientes respeita a aba indicada no endereço. Atalhos de reservas levam à seção correspondente e posicionam o foco para navegação por teclado.
- **Carregamento independente do QR code.** A biblioteca externa de QR code carrega em paralelo, sem bloquear a inicialização do sistema.

## Segurança e trabalho em equipe
- **Contas por coordenador.** Aba *Acesso*: a senha mestre (`ADMIN_PASSWORD`) cria contas com usuário e senha (mín. 8 caracteres). Cada pessoa entra em `/#login` com o próprio usuário. Só a senha mestre cria, troca senha e remove contas.
- **Histórico e desfazer.** Cada gravação guarda uma versão (últimas 60 por turma), com data e autor. Aba *Acesso → Histórico → Restaurar* volta a turma ou a lista de docentes àquele ponto. Turmas excluídas também ficam no histórico.
- **Edição simultânea.** Se duas pessoas editam a mesma turma ao mesmo tempo, a segunda gravação é recusada, a versão mais recente é carregada e aparece um aviso. Ninguém sobrescreve o trabalho do outro sem perceber.

## Regras do calendário
- **Choque de sala/laboratório.** Duas turmas não ocupam a mesma sala no mesmo dia em horários que se sobrepõem (campo *Sala/Lab.* em Disciplinas).
- **Código da turma.** Ao mudar o código na aba Turma, o identificador interno e os links acompanham (os links antigos dessa turma deixam de valer).

## Para alunos e docentes
- **Agenda assinável.** Aba *Compartilhar*: link `/api?ics=turma-<id>` (e um por docente) para assinar no Google Agenda, Outlook ou iPhone. Atualiza sozinho.
- **App instalável (PWA).** O site pode ser instalado na tela inicial do celular e abre sem internet com os últimos dados vistos.

## Para a coordenação
- **Relatórios.** Andamento por turma, carga por docente em todas as turmas e ocupação por mês (dias livres para reposição).
- **Imprimir / salvar em PDF** na aba Enviar e **backup completo** em arquivo na aba Dados.
- **Testes automáticos** da API: `npm test`.

## Chamada, faltas e reposição (nova rodada)
- **Aba Chamada.** Lista as aulas do calendário e registra cada uma como *dada* ou *não dada* (com motivo). Mostra aulas passadas sem registro, encontros já dados e aulas não dadas sem reposição.
- **Aba Alunos.** Cadastro da turma (cole a lista, com matrícula opcional). Ao registrar uma aula dada, informe a falta de cada aluno (0 a todas as aulas do dia). A tabela soma as faltas por disciplina, compara com o limite de 25% e marca *Atenção* (a partir de 75% do limite) e *Limite excedido*. Exporta a frequência em CSV.
- **Reposição automática.** Aula marcada como não dada deixa de contar como encontro realizado. O sistema sugere datas livres (sem feriado, sem choque de docente, de sala ou de disciplina; sábados opcionais) e o botão *Repor tudo automaticamente* lança a primeira data de cada aula. A reposição aparece no calendário como "Reposição de dd/mm". Mudar o registro depois remove a reposição.
- **Conta de docente.** Na aba Acesso, o tipo *Docente* só pode lançar chamada e alunos. O servidor recusa qualquer outra alteração. O docente vê apenas as abas Chamada, Alunos e Relatórios.
- **Privacidade.** Visitantes (alunos e quem abre os links públicos) não recebem nomes de alunos, faltas nem motivos: só se a aula foi dada e a reposição. Trate a lista de alunos conforme a LGPD da instituição.

## Avisos por e-mail e WhatsApp (nova rodada)
- **Aba Avisos.** Alterações do calendário (diário, 20h), lembrete na véspera de cada aula, aviso imediato e mensagem livre. Canal: e-mail (Resend), WhatsApp (API oficial da Meta) ou ambos; grupos: alunos, docentes e lista extra.
- **Contatos** de alunos (aba Alunos) e docentes (aba Docentes). Visitantes dos links públicos não recebem e-mails, telefones nem a lista de destinatários.
- **Histórico** de envios com falhas registradas; falha mantém as alterações pendentes para a próxima tentativa.
- **Modo simulado** quando as chaves não estão configuradas. Guia completo: `docs/AVISOS-pt-BR.md`.

## Backup agendado (nova rodada)
- **Diário (20h):** cópia completa guardada no banco quando algo mudou (últimas 30 + a primeira de cada mês por 12 meses).
- **Semanal por e-mail:** arquivo anexo aos domingos, com opção de omitir dados de alunos.
- **Aba Dados:** fazer backup agora, baixar e restaurar (com cópia automática "antes de restaurar").
- **Recuperação total:** `scripts/restore-backup.js`. Guia: `docs/BACKUP-pt-BR.md`.

## Ainda não incluído
Divisão do código em módulos e acessibilidade completa.

## Validação de integração — 10/10/2026
- Correção de perda de alterações em gravações concorrentes.
- Dois testes adicionais de concorrência; 22 testes aprovados.
- Diagnóstico e próximos módulos em `docs/VALIDACAO-INTEGRACAO.md`.

## Ambientes e vínculo de docentes — primeira etapa
- Cadastro de salas e laboratórios com capacidade e disponibilidade pela coordenação.
- Vínculo de contas aos docentes, gerenciado pela senha mestre.
- Consulta das aulas do docente vinculado na nova tela `/ambientes.html`.
- Validação na API, histórico e proteção contra revisão desatualizada.
- Guia: `docs/AMBIENTES-pt-BR.md`; 24 testes aprovados.
- Solicitações e aprovações serão adicionadas na próxima etapa.

## Solicitações e aprovação de reservas
- Professor solicita um ambiente para uma aula do próprio calendário.
- Coordenação aprova, recusa com motivo e cancela.
- Histórico e proteção de privacidade por conta.
- Validação de ocupação do calendário e reservas aprovadas no servidor.
- Aprovações concorrentes protegidas por revisão; 27 testes de API aprovados.
- Guia: docs/RESERVAS-pt-BR.md.

## Gestão integrada de ambientes — 12/10/2026
- Perfil próprio de administrador de ambientes com permissões restritas.
- Painel diário horários × ambientes, com aprovadas amarelas e pendentes laranja.
- Sincronização: mudanças de calendário/disponibilidade exigem revisão da reserva e avisam o professor.
- Notificações internas com leitura individual e acesso à reserva.
- Bloqueios por ambiente, datas, horários e motivo.
- Reagendamento volta a pendente e registra a seleção anterior.
- Relatórios por ambiente/docente/período, CSV e impressão em PDF, incluindo ocupações do calendário sem duplicação.
- Backup v2 com contas, vínculos e notificações; restauração transacional com cópia anterior.
- 36 testes da API e fluxo de navegador aprovados, incluindo uso no celular.
- Chamada e Alunos continuam removidas da navegação.

## Exportação no padrão SENAI e retorno
- Botão Exportar calendário no cabeçalho e na aba Enviar.
- Excel preenchido no modelo original SENAI, com imagens, estilos, datas, docentes e ambientes aprovados.
- PDF/HTML mensal com controles de impressão e retorno.
- Opção de incluir lançamentos fora do período, preservando as datas do cadastro.
- Botão Voltar na gestão de ambientes e na navegação do planejador.
- 41 testes automatizados, fluxos de navegador e conferência visual/recalculo do Excel aprovados.

## Acessibilidade e celular

Navegação por teclado nas abas e dias, foco das janelas, link para pular ao conteúdo, escolha do mês na entrada, próxima aula destacada e agenda móvel em cartões. Texto das disciplinas com contraste e sem truncamento na agenda. Testes automáticos com axe e teclado documentados em `docs/ACESSIBILIDADE.md`.

## Correção da exportação do calendário

Excel: ordem correta das células, limpeza de caracteres inválidos no XML, tratamento de datas inválidas e bloqueio de exportação com dados ainda não salvos. O HTML exportado volta a ser independente do CSS externo do sistema.

## Celular com o mesmo padrão do site

Calendário mensal preservado em sete colunas, com todos os dias da semana visíveis. Próximas aulas e disciplinas permanecem em tabelas, com rolagem lateral quando necessário. Removidas a agenda em lista, a conversão de aulas em cartões e a opção de ocultar dias sem aula. A próxima aula é destacada na tabela e no calendário; teclado, leitores de tela e escolha do mês permanecem disponíveis.

## Exportação no modelo anual do docente

Adicionado o modelo `Gizelle Karine Santos Alcantara.xlsx`, com escolha de docente, ano e vínculo. O Excel reúne todas as turmas do docente, preserva a grade mensal por turno e o resumo de disciplinas. Há tratamento de códigos repetidos, conflitos, anos bissextos e turnos que exigem mais linhas. A exportação por turma continua separada. Consulte `docs/EXPORTACAO-DOCENTE.md`.

## Programação por horário de aula

A coordenação pode distribuir várias disciplinas no mesmo dia por aula, com horários e quantidades próprios. A carga horária passa a contar as aulas individuais; conflitos, reservas, avisos e exportações seguem os intervalos da grade. Os lançamentos antigos são preservados até serem redistribuídos. Guia: `docs/HORARIOS-POR-AULA.md`.

## Prévia do Excel
Exportações da turma e do docente agora abrem uma prévia do arquivo gerado. Inclui seleção de planilha, mês e zoom, retorno às opções sem perder escolhas e download com conferência de versão. Alterações posteriores exigem atualizar a prévia. Navegação por teclado e leitura no celular verificadas.

## Cadastro completo do docente
Formulário com matrícula, contatos, unidade, área, formação, Meu SENAI, vínculo e observações, com validação e preservação dos cadastros existentes. Consulte `docs/CADASTRO-DOCENTE.md`.

## Filtros do calendário
Filtros combinados por docente, disciplina, sala/laboratório e situação, com contador mensal e limpeza. A agenda do docente também permite turma e turno. Consulte `docs/FILTROS-CALENDARIO.md`.

## Correção da abertura da prévia
O código da prévia agora acompanha a página principal, evitando depender de um arquivo JavaScript separado. Falhas aparecem na janela de exportação, com opção **Baixar Excel sem prévia**. A prévia mostra o andamento e limita a espera por resposta do servidor.

## Correções da auditoria
Permissões por docente, privacidade, invalidação de sessões, identificadores permanentes, salvamento em lote com rollback, filtros de cancelamento e ambiente aprovado, e proteção dos CSVs. ADMIN_PASSWORD e SESSION_SECRET são obrigatórios. Após atualizar, entre novamente. Consulte `docs/CORRECOES-AUDITORIA.md`.

## Documentação completa
Manual operacional em português, referência técnica da API e banco, checklist de homologação e versões HTML navegáveis para leitura e impressão. Instalação e backups revisados conforme a versão atual.

## Responsividade no celular
Estilos compartilhados carregados após os estilos principais: filtros em duas colunas (uma em telas até 360px), formulários em uma coluna, campos de 16px, botões com área de toque de pelo menos 44px, janelas limitadas à altura visível e navegação de ambientes sem sobreposição fixa no celular. Calendário preservado em sete colunas e tabelas com rolagem interna. Cache atualizado para a nova versão.

Validação: teste de interface completo, acessibilidade em temas claro/escuro e verificações de largura de 320, 360, 390, 430 e 768px nas telas de coordenação, docente e ambientes. Validação automatizada em Chromium; não substitui teste em aparelho iOS físico.

## Autenticação e agenda privada de docentes
Entrada por usuário e senha, agenda pessoal obrigatória, botão de reservas, filtragem no servidor por docente e anonimização da ocupação de terceiros. Agendas públicas desativadas; ICS autenticado e exportação completa de turma restrita à coordenação. Consulte docs/ACESSO-DOCENTE.html.

## Alunos: acesso por código de turma
Coordenação gera, substitui e desativa códigos na aba Compartilhar. Cada sessão de aluno consulta somente a turma do código, sem edição, reservas ou exportações da API. Consulte docs/ACESSO-ALUNOS.html.
