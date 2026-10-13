# Novidades desta versão

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
