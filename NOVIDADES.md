## Estabilidade do banco local sob carga

- Transações do banco em arquivo reutilizam uma conexão, evitando a abertura repetida de conexões nativas.
- Leituras de outras requisições aguardam o término da transação; confirmação, rollback e conflitos de edição são preservados.
- O cliente web usado no Turso permanece com seu tratamento original.
- Atualizações da tela Acesso preservam o formulário de criação de conta, inclusive durante um envio em andamento; os campos são limpos após sucesso.
- Testes de carga locais incluem repetição sustentada com 50 requisições simultâneas e verificação de integridade das edições.

## Controle de chaves por QR code

- Gestão cadastra chaves, imprime etiquetas e aloca docentes a salas ou laboratórios de aulas presenciais.
- Docente registra retirada e devolução com QR code, conta autenticada e assinatura desenhada na tela.
- Comprovantes com horário do servidor, identificação da aula e hash de integridade; consultas por data e backup completo.
- Leitura local por câmera, foto ou endereço da etiqueta; câmera requer HTTPS ou localhost.

## Docentes com visual simplificado

- Cartão por docente com disciplinas, carga horária, aulas lançadas e próxima aula.
- Cadastro, contatos e disponibilidade agrupados em uma área expansível, sem repetir a lista de docentes.
- Busca, filtros, edição automática e bloqueios preservados, com adaptação para celular.

## Tela inicial padronizada

- Entrada sem o seletor de mês do calendário; seleção continua disponível no painel da coordenação.
- Identidade visual alinhada a Salas e Laboratórios, com logo SENAI, detalhe vermelho, cartões e temas claro e escuro.
- Acessos por perfil preservados e descrição do docente atualizada para ocupação diária e reservas de laboratórios.

## Importação de ambientes por Excel

- Administrador importa .xlsx de até 2 MB e 500 ambientes, com modelo disponível para download.
- Prévia identifica novos cadastros, atualizações e erros antes de confirmar a gravação.
- Atualização por nome preserva identificadores e ambientes ausentes na planilha; nenhuma exclusão automática.
- Importação e modelo protegidos no servidor, exclusivos da conta administradora.

## EAD sem horário livre e visual compacto

- Planejamento EAD utiliza dias com aulas presenciais já lançadas, sem sobrescrever a grade nem exigir disponibilidade de horário.
- Calendários da coordenação, alunos e docentes mostram EAD como uma anotação menor, com indicação de atividade online sem horário fixo.
- Quantidade parcial de aulas EAD é preservada ao editar, renomear ou excluir disciplinas.

## Programação diária para TVs e Excel

- Gestão exporta um painel HTML independente, com logo SENAI, páginas por turno, rotação automática e tela cheia.
- Exportação Excel real (.xlsx) com aulas planejadas, reservas aprovadas, docentes, turmas, horários e ambientes efetivos, incluindo EAD sem ambiente.
- Exportações respeitam data e ambiente selecionados; os arquivos são retratos dos dados salvos e precisam ser reexportados após alterações.
- Painel externo não inclui pendências, contas, alunos, finalidades ou observações internas.

## Agendamento de salas pela gestão

- Docentes solicitam e reagendam somente laboratórios; salas de aula ficam fora das opções.
- Gestão de ambientes agenda salas para aulas e docentes, com confirmação direta após validação de conflitos.
- O professor acompanha a reserva da sala, mas alterações e cancelamento ficam com a gestão. A regra também é aplicada no servidor.

## Exclusão de ambientes e planejamento EAD

- Gestão pode excluir ambientes com confirmação. Reservas, bloqueios e aulas presenciais atuais ou futuros impedem a exclusão até serem ajustados; o histórico permanece.
- Planejamento assistido de disciplinas com docente EAD dispensa sala ou laboratório e não é bloqueado por ocupação física.

## Ambientação e atividades EAD

- Ambientação permitida antes do início da turma, sem alerta de período, incluindo planejamento e exportação.
- Editor do dia permite disciplinas com docente identificado por EAD em paralelo às aulas presenciais.
- EAD mantém a contagem de aulas sem bloquear salas nem gerar conflitos com aulas presenciais.

## Exclusão e detecção automática de avisos

- Exclusão individual de avisos sem afetar os outros destinatários, com confirmação.
- Central verifica novos avisos a cada 30 segundos, ao retornar à janela e ao recuperar a conexão.
- Alerta de novos avisos preserva a lista e os filtros até o usuário atualizar.

## Visualização do docente em Salas e Laboratórios

- Docentes visualizam somente Ocupação diária e Reservas no módulo.
- Navegação e atalhos administrativos removidos desse perfil; links antigos dessas seções retornam à ocupação diária.
- Solicitação, consulta e reagendamento das próprias reservas preservados.
- Consulta ao cadastro de bloqueios restrita à gestão no servidor; a ocupação diária mantém os horários bloqueados visíveis.

## Legibilidade da ocupação diária

- Colunas dimensionadas por ambiente para evitar sobreposição dos nomes em grades extensas.
- Nomes longos com quebra de linha e coluna de turnos fixa durante a rolagem horizontal.

## Identidade visual de Salas e Laboratórios

- Cabeçalho com a logo SENAI já usada no calendário e nova organização visual do módulo.
- Tema claro, escuro e automático, com preferência compartilhada com o calendário e persistida no navegador.
- Cores adaptadas em formulários, tabelas, avisos, ocupação e status; impressão em fundo claro.

## Ocupação diária por turnos

- Grade simplificada em Matutino, Vespertino e Noturno, com horários nos detalhes das atividades.
- Atividades que atravessam turnos aparecem em todos os turnos afetados.
- Exportação da programação filtrada em CSV e impressão para PDF, incluindo ambientes livres ou indisponíveis.

## Gestão de ambientes

- Resumo de ambientes e capacidade, ordenação por nome e status com destaque.
- Edição identificada, cancelamento e validação de nomes duplicados antes de salvar.
- Consulta de ocupação a partir da lista e navegação por dia.
- Filtros de busca e status nas reservas; data e ambiente da grade preservados ao salvar.

## Aba Docentes

- Removido o botão Cadastro completo; os dados complementares ficam em Dados adicionais, na própria lista.
- Busca ampliada para contatos, área e unidade; filtros por vínculo e disciplinas.
- Contagem de aulas corrigida e validação de matrícula duplicada na edição direta.

# Novidades desta versão

## Diagnóstico e monitoramento de falhas
- **Área da senha mestre.** Administração → Diagnóstico reúne falhas de servidor, salvamento, exportações, serviços externos, interface e conexão. A equipe pode enviar eventos técnicos; alunos não enviam e apenas a senha mestre consulta ou trata os registros.
- **Registros sem conteúdo pessoal.** Guarda apenas códigos fixos, operação, origem, status, datas, contagem e referência da última ocorrência. Não guarda URLs, mensagens brutas, pilhas de execução, destinatários, dados de alunos ou credenciais.
- **Retenção e análise.** Repetições são agrupadas, com retenção de 30 dias e até 500 grupos; a tela mostra os 100 mais recentes com os filtros escolhidos. Marcar como tratada registra a análise. Uma nova ocorrência reabre o grupo e uma atualização concorrente exige nova conferência.
- **Conexão e serviços.** Falhas do navegador aguardam reconexão apenas na memória da aba e são limitadas a 10 registros por conta a cada 10 minutos. Falhas de envio e da rotina diária também alimentam o diagnóstico, sem acrescentar envios externos.
- **Limites operacionais.** Se o banco estiver indisponível, não há garantia de persistência; o servidor emite somente código e referência no console quando possível. Os registros operacionais não fazem parte dos backups de dados do sistema.

## Uso no celular
- **Menu compacto.** Em telas de até 620 px, o seletor “Seções do sistema” reúne as mesmas áreas permitidas para a conta. Os menus completos continuam disponíveis no computador.
- **Atalhos fixos.** Coordenação tem acesso rápido ao painel, calendário e notificações; docentes têm atalhos para calendário, reservas e notificações. Os atalhos são ocultados enquanto uma janela de edição está aberta.
- **Mês ou agenda.** O calendário oferece uma lista de aulas com data, disciplina, docente, sala, horário e indicação de cancelamento. A visualização escolhida é mantida durante a sessão e respeita os filtros existentes.
- **Edição explícita.** Somente a coordenação pode abrir a edição pela agenda ou escolher uma data vazia. Alunos e docentes continuam em consulta. As ações dos formulários ficam acessíveis no rodapé das janelas em telas pequenas.

## Relatórios gerenciais
- **Período e turma.** A aba Relatórios da coordenação reúne aulas programadas, realizadas, canceladas, sem confirmação, conflitos e reservas para analisar, em intervalos de até 366 dias.
- **Carga corrigida.** Horas por docente usam a duração de cada aula, sem multiplicar novamente pelas aulas do dia. O intervalo do Matutino NEM não entra na carga de ensino. Aulas futuras não contam como realizadas.
- **Ocupação sem duplicidade.** Une horários de calendário e reservas aprovadas por ambiente e considera a sala efetiva da reserva. Mostra horas ocupadas; não presume horários de funcionamento para calcular percentuais.
- **Exportação e impressão.** CSV e visualização para impressão/PDF usam o resultado gerado. Não incluem alunos, contatos ou observações privadas. A carga a planejar e as disciplinas sem docente referem-se à turma inteira, com identificação explícita nas tabelas.

## Planejamento assistido
- **Prévia antes de gravar.** Em Calendário → Planejamento assistido, selecione disciplina, intervalo, quantidade e dias da semana. Confira as sugestões e aplique quando estiverem adequadas.
- **Disponibilidade por horário.** Considera o cadastro do docente, seus bloqueios, aulas de outras turmas, ambientes ativos, bloqueios de ambientes e reservas aprovadas. A disciplina precisa ter docente e ambiente cadastrados.
- **Carga e registros preservados.** Usa somente dias vazios, preserva observações e dias com registros, respeita o período da turma e limita a quantidade à carga ainda pendente. Suporta a conversão de aulas e o intervalo do Matutino NEM.
- **Conferência ao aplicar.** Se os documentos mudarem desde a prévia, é necessário gerar sugestões novamente. A aplicação grava uma versão no histórico e alimenta os avisos internos. As sugestões não criam reservas de ambientes.
- **Limites da sugestão.** Planeja uma disciplina por vez em intervalos de até 366 dias e pedidos de até 1000 aulas. Mostra os horários descartados e o que ficou pendente quando não há disponibilidade suficiente.

## Central de notificações
- **Acesso unificado.** O atalho Notificações no planejador e na gestão de ambientes abre uma central com contador de não lidas, filtros por tipo e situação e paginação.
- **Leitura individual.** Marque um aviso ou os avisos exibidos como lidos. A leitura de uma conta não altera a leitura das demais; avisos que chegam depois não são marcados pelo lote anterior.
- **Mudanças de aulas.** A partir desta versão, inclusões, remoções e alterações em aulas atuais ou futuras geram avisos internos para a coordenação e para as contas dos docentes afetados. Dados de alunos e observações privadas não entram nas mensagens. Não há envio externo nesta central.
- **Reservas preservadas.** Os avisos existentes continuam disponíveis e os novos metadados acompanham o backup e a restauração.

## Histórico detalhado
- **Comparação de versões.** Em Acesso, use “Ver alterações” para consultar os campos anteriores e novos, junto do autor, data e hora da edição.
- **Inclusões e remoções.** As comparações identificam campos incluídos, removidos e alterados; códigos e credenciais são protegidos.
- **Limites explícitos.** Até 200 campos por comparação. Se a versão anterior já saiu da retenção, a tela informa que ela não está disponível. A restauração continua acessível.

## Preparação para publicação
- **Aba Publicação.** Disponível apenas à senha mestre, reúne configuração, conexão com o banco e verificação do último backup completo.
- **Backup conferido.** Verifica leitura, hash, idade e correspondência com os dados atuais. A criação de backup exige clicar no botão; a consulta não modifica registros.
- **Checagem por comando.** `npm run check:publish` verifica variáveis e arquivos sem acessar banco ou serviços externos e sem imprimir segredos. Use `-- --serverless` para hospedagem sem servidor.
- **Homologação explícita.** Entrega de e-mail, agendamento, cópia externa e restauração no destino permanecem na lista manual. Consulte [Publicação](docs/PUBLICACAO.md).

## Recuperação de acesso
- **Esqueci minha senha.** Os acessos de coordenadores, docentes e ambientes levam à página de recuperação. Informe usuário e o e-mail cadastrado para a conta.
- **Cadastro pela senha mestre.** Na aba Acesso, a senha mestre cadastra ou altera o e-mail de recuperação. O campo é independente do contato do cadastro docente.
- **Link temporário.** O link expira em 15 minutos, funciona uma única vez e é substituído quando outro é solicitado. Trocar a senha encerra as sessões anteriores da conta.
- **Configuração de envio.** Exige PUBLIC_URL em HTTPS (localhost aceita HTTP), RESEND_API_KEY e MAIL_FROM. Sem o serviço configurado, o sistema informa a indisponibilidade e orienta procurar a coordenação; não simula envio em produção.
- **Proteções.** Somente o hash do token fica no banco. O token é removido do endereço assim que a página abre. Respostas de solicitação não identificam contas existentes; limites são persistidos no banco. Alterar e-mail, senha ou restaurar contas invalida links pendentes.
- **Senha mestre.** Continua gerenciada na configuração do servidor e não pode ser redefinida pelo link de recuperação.

## Visão geral da coordenação
- **Todas as turmas.** A aba Visão geral consolida aulas para planejar, excedentes, disciplinas sem docente, conflitos e reservas para análise.
- **Conflitos sem duplicação.** Uma ocorrência entre duas turmas aparece nas duas linhas, mas é contada uma única vez nos indicadores e na central global.
- **Acompanhamento com filtros.** Busque por código ou curso e combine turno e situação. Os filtros se aplicam à lista; os totais e a central abrangem todas as turmas.
- **Atalhos de revisão.** Abra o painel, calendário ou disciplinas da turma e retorne à visão geral pelo botão Voltar. Reservas são atualizadas pela sincronização já existente.

## Busca rápida
- **Turmas.** No Painel, pesquise por código ou curso e combine a busca com o turno.
- **Docentes.** Na aba Docentes, pesquise por nome ou matrícula. A edição continua vinculada ao cadastro correto após filtrar.
- **Ambientes.** Na gestão de ambientes, combine nome, tipo e disponibilidade.
- **Uso contínuo.** As buscas ignoram acentos e maiúsculas, aceitam várias palavras e mostram a quantidade de resultados. Limpar busca restaura a lista e devolve o foco ao campo. A digitação não recria formulários nem altera dados; os filtros permanecem ao alternar abas na mesma página.

## Duplicação de turmas
- **Entrada no painel e na aba Turma.** Duplicar turma atual abre um formulário com novo código, curso e período. Códigos já utilizados são recusados.
- **Cópia seletiva.** Escolha configurações de ensino, disciplinas e cargas horárias, docentes, ambientes e feriados. Sem disciplinas, a opção de docentes fica desabilitada.
- **Novo planejamento independente.** Aulas, alunos, chamadas, faltas, reservas, histórico de envios e códigos de acesso não são copiados. Avisos automáticos começam desativados, e os destinatários ficam vazios.
- **Feriados com datas explícitas.** Quando selecionados, somente feriados e dias sem aula nas mesmas datas dentro do novo período são copiados. O sistema não desloca datas de um ano para outro.

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
