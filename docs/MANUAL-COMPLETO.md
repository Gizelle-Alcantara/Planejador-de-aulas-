# Manual de utilização — Agenda SENAI

Edição: 19/10/2026. Consulte o [índice](README.md) para instalação e documentação técnica.

## 1. Finalidade e entrada

O sistema organiza turmas, disciplinas, docentes, calendários, ambientes, reservas e movimentações de chaves. A ocupação apresentada é planejada: reserva aprovada não comprova presença física. A retirada da chave tem registro próprio.

Abra o endereço da unidade. Gestores e docentes entram com usuário e senha. Alunos escolhem **Sou aluno** e informam o código da turma. A sessão dura até 12 horas; encerre-a em equipamentos compartilhados. Revogação de acesso ou troca de senha pode exigir novo login.

| Perfil | Responsabilidades |
|---|---|
| Administrador mestre | Planejamento e gestão; contas, vínculos, importação Excel de ambientes, diagnóstico e Publicação |
| Coordenação | Turmas, docentes, disciplinas, calendário, relatórios, reservas, chaves e códigos de alunos |
| Administração de ambientes | Ocupação, cadastro/manutenção, reservas, programação externa e controle de chaves |
| Docente | Sua agenda, ocupação diária, suas reservas de laboratórios e Minhas chaves |
| Aluno | Consulta exclusiva da turma autorizada pelo código |

O docente não recebe catálogo geral de chaves nem ferramentas de cadastro/alocação. A autorização também é verificada no servidor.

## 2. Preparação pela administração

1. Cadastre docentes, contatos e disponibilidade.
2. Em **Acesso**, com a senha mestre, crie contas com o perfil correto.
3. Vincule cada conta docente ao seu cadastro. Login e nome profissional são informações diferentes.
4. Cadastre ambientes e confira disponibilidade.
5. Configure turmas, disciplinas e calendário.
6. Revise pendências/conflitos antes de compartilhar códigos ou exportações.

Preserve os cadastros existentes ao corrigir nomes; não duplique pessoas para resolver vínculos. Uma conta sem vínculo pode entrar sem encontrar suas aulas/chaves.

## 3. Turmas, disciplinas e programação

As unidades curriculares ficam em **Cursos → Abrir curso → Unidades curriculares**. Escolha **Modelo do curso** para definir a estrutura das novas turmas ou **Ajustes por turma** para editar uma turma existente. Essa área substitui a antiga aba principal Disciplinas; alterar uma turma preserva o modelo e as demais turmas.

Selecione a turma e confira código, curso, módulo, turno, início/término e aulas por dia. Cadastre disciplinas com sigla, nome, carga horária, docente e ambiente quando necessário. O local padrão da turma pode atender disciplinas sem local específico.

No calendário, abra o dia e distribua disciplinas pelas posições de aula. Um bloco reúne posições consecutivas da mesma disciplina; pausas podem separar blocos. Revise os totais, salve e aguarde a confirmação antes de exportar ou sair.

Confira a prévia das ferramentas de planejamento antes de aplicar. Ao copiar uma turma, revise datas, docentes e ambientes: a cópia não assegura disponibilidade no novo período.

### Ambientação e EAD

A disciplina reconhecida como **Ambientação** pode ser lançada antes do início do período. Essa exceção não libera outras disciplinas de todas as validações.

Disciplinas reconhecidas pela regra de docente **EAD** podem entrar em paralelo às presenciais, sem ambiente e sem exigir horário presencial livre. Use a opção EAD no editor e informe a quantidade quando disponível. Aparecem como citações menores e não ocupam salas. Se a opção não aparecer, confira o cadastro do docente; o reconhecimento técnico está em `lib/schedule.js`.

### Conflitos e revisões

Confira sobreposições de docente/ambiente e indisponibilidades. Se houver conflito de revisão, outra atualização mudou o documento: recarregue, compare e refaça a alteração necessária. Não repita indefinidamente um envio de tela antiga.

## 4. Docentes, busca e calendário

A aba Docentes usa busca e cartões com detalhes recolhíveis. Abra apenas o cadastro necessário e confira contatos e disponibilidade. Limpe os critérios para recuperar a visão completa.

Os filtros combinam disciplina, docente, ambiente e situação; na agenda docente, podem incluir turma e turno. Filtrar a tela não significa filtrar a exportação completa.

| Situação | Significado |
|---|---|
| Programada | Sem confirmação de realizada/não dada |
| Realizada | Registro do dia marcado como dado |
| Cancelada / não dada | Registro do dia marcado como não dado |
| Com conflito | Sobreposição/indisponibilidade identificada |

A reserva aprovada define o local efetivo do bloco quando existe; não muda automaticamente o ambiente padrão da disciplina.

## 5. Salas, laboratórios e ocupação diária

Na gestão de ambientes, escolha data e filtro em **Ocupação diária**. A programação é agrupada por turnos. O computador oferece grade comparativa; o celular apresenta cartões com leitura vertical. Use o tema claro ou escuro conforme necessário.

O cadastro reúne nome, tipo, capacidade e disponibilidade. Capacidade é informativa: não há contagem automática de participantes no pedido. Nomes/IDs repetidos são rejeitados. Desativar impede novos usos e pode exigir revisão das reservas. Exclusão pode ser bloqueada por aulas/reservas futuras ou chaves vinculadas; resolva as dependências com a gestão.

Bloqueios/manutenção exigem ambiente, datas, horários e motivo. Remover um bloqueio não reaprove automaticamente pedidos em revisão.

### Importação Excel — somente mestre

1. Abra a importação de ambientes com a senha mestre.
2. Baixe o modelo do sistema.
3. Preencha Nome, Tipo, Capacidade e Disponibilidade conforme os exemplos.
4. Selecione o arquivo e confira inclusões, atualizações, registros inalterados e erros na prévia.
5. Corrija o arquivo se necessário e aplique a prévia válida.
6. Confira cadastro e ocupação após a aplicação.

A prévia não salva. Se o cadastro mudar durante a conferência, gere outra prévia.

## 6. Reservas

O docente escolhe uma aula própria atual/futura, bloco, laboratório ativo e finalidade e envia para aprovação. A conta precisa estar vinculada. Salas de aula são agendadas pela gestão e não aparecem como opção de solicitação docente. EAD não exige ambiente.

A gestão confere aula, finalidade, horário, ocupação e manutenção antes de aprovar. Recusa exige motivo. Para salas, a gestão pode agendar a partir das aulas disponíveis. O servidor revalida a disponibilidade ao gravar.

| Status | Efeito |
|---|---|
| Pendente | Aguarda decisão; não garante local |
| Aprovada | Ocupa o intervalo validado |
| Recusada | Encerra com motivo |
| Cancelada | Libera a reserva, preservando histórico |
| Revisão | Exige nova análise/reagendamento |

Reagendamento volta a pendente. Mudança de aula, docente, horário ou disponibilidade pode levar a revisão; leia o motivo e não considere o pedido antigo como autorização vigente.

## 7. Chaves — gestão

1. Cadastre identificação única de chave e ambiente ativo.
2. Gere/imprima o QR e fixe na chave correta.
3. Selecione docente com conta vinculada, aula presencial atual/futura e chave ativa.
4. Confira ambiente/horário e confirme a alocação.
5. Acompanhe retiradas, devoluções e comprovantes.

A alocação utiliza reserva aprovada compatível ou cria agendamento validado. O sistema impede conflitos. Só se cancela alocação ainda não retirada. Chaves com alocações ou devoluções pendentes não podem ser livremente ativadas/desativadas.

O QR identifica a chave e não autentica o portador. Proteja a etiqueta contra cópia/troca e confira a chave física na entrega.

## 8. Minhas chaves — docente

Na sua agenda, abra **Minhas chaves**; no celular há também **Chaves** na navegação. Você vê apenas suas alocações, inclusive futuras pendentes e devoluções em aberto. O leitor aparece ao escolher a ação.

A tela **Retirada e devolução de chaves** apresenta o autoatendimento e as quantidades para retirar, devolver e devolvidas na lista. Ao selecionar uma chave, mostra as etapas de conferência, leitura do QR e assinatura. **Voltar às minhas chaves** cancela a seleção e limpa o QR lido, sem registrar movimento. Ler a etiqueta de outra alocação não muda automaticamente a chave selecionada.

### Retirada

1. Confira ambiente, disciplina, data e intervalo.
2. No dia da aula, escolha **Retirar chave**.
3. Leia o QR pela câmera ou alternativa de foto oferecida.
4. Confira o nome, desenhe a assinatura e confirme o aceite.
5. Aguarde a conclusão e consulte o comprovante.

Retiradas futuras são bloqueadas. QR de outra chave, chave já retirada ou aula/reserva alterada exigem correção pela gestão. Não assine por outra pessoa.

### Devolução

Escolha **Devolver chave**, leia o QR correspondente e recoloque a chave na posição correta do ponto autorizado. Assine e confirme a devolução no local e confira o comprovante antes de sair. A devolução continua disponível para a retirada em aberto mesmo após mudança ou passagem da aula. A guarda física é feita pelo próprio docente: o registro eletrônico não verifica a presença da chave no armário.

A assinatura é um desenho eletrônico associado à conta e ao comprovante com hash. Não há certificado ICP-Brasil ou validação biométrica implementada.

### Painel compartilhado da secretaria

Abra `/secretaria-chaves.html` no equipamento de autoatendimento. A gestão também encontra **Abrir painel da secretaria** no Controle de chaves. Na tela inicial, o professor escolhe **Retirar chave** ou **Devolver chave**, entra com sua conta docente individual e vê apenas as chaves pertinentes à opção: alocações liberadas para hoje ou retiradas em aberto.

O professor seleciona a chave, confere o QR e assina. Após gravar, o painel encerra a sessão e mostra uma confirmação breve; volta ao início em 10 segundos ou ao tocar em concluir. Também é possível **Encerrar atendimento** sem movimentar uma chave. A inatividade encerra o acesso após 90 segundos; a sessão tem limite de 5 minutos. Ao atingir o limite, identifique-se novamente.

Use **Tela cheia** para exibição ampliada. O painel não exibe um cadastro público de professores, não dispensa senha/assinatura e não abre o armário. Use perfil de navegador dedicado ao terminal, sem sessão administrativa ativa e sem salvamento de senhas. Tela cheia não bloqueia a navegação do equipamento: restrições do dispositivo dependem da configuração local.

A sessão do painel usa cookie separado do calendário. Cada professor usa sua própria conta; não disponibilizar senha mestre ou uma conta compartilhada para assinar. Se houver falha ao encerrar a sessão, o painel bloqueia novos atendimentos até confirmar a saída. Movimentação já gravada não deve ser repetida por falha de conexão na etapa de encerramento.

## 9. Avisos, WhatsApp e recuperação

Notificações internas avisam eventos como reservas e alocações. Marcar leitura/excluir um aviso pessoal não apaga a reserva ou registros de outros usuários. O sistema acompanha atualizações enquanto a tela está ativa.

Em **Avisos**, confira alterações, lembretes e destinatários antes de enviar. Simulação não comprova entrega real.

No WhatsApp manual, selecione docente ou informe número, revise o texto e abra a conversa. A pessoa conclui o envio no aplicativo. Não há confirmação automática de entrega nesse fluxo e não é necessária configuração Meta.

E-mail real exige domínio autorizado/verificado, RESEND_API_KEY e MAIL_FROM. Na entrega de 19/10/2026 essa configuração ainda depende da equipe responsável pelo domínio. Domínio fictício não habilita envio real.

Quando habilitada, a recuperação solicita os dados da conta e envia link de uso único, válido por 15 minutos. Defina nova senha e entre novamente. Se indisponível, procure a administração. A senha mestre é alterada no servidor, não por esse fluxo.

## 10. Exportações

Salve e espere a confirmação: o Excel usa os dados salvos no servidor.

| Necessidade | Procedimento |
|---|---|
| Calendário da turma | Coordenação → Exportar calendário → Prévia da turma → Baixar |
| Agenda anual docente | Docente/ano/vínculo autorizado → Prévia → Baixar |
| PDF | Imprimir → destino Salvar em PDF |
| Cópia mensal | Download HTML do calendário |
| TV/totem | Gestão → data/filtro → exportação HTML da programação diária |
| Excel diário | Mesmo painel → exportação Excel |
| Relatórios | Período/filtros → CSV ou impressão oferecida |
| ICS | Link autenticado permitido pela interface |

Se os dados mudarem, atualize a prévia; versão divergente pode bloquear o download com 409. A prévia não reproduz todos os detalhes do Excel desktop. Os modelos originais precisam estar instalados no servidor.

A planilha da turma e a anual docente usam resumos com unidades diferentes; confira cabeçalhos antes de comparar. HTML externo é uma cópia da programação planejada, não uma tela com atualização automática: exporte novamente após mudanças e distribua apenas em locais autorizados.

## 11. Celular e acessibilidade

Use o mesmo endereço. Em telas pequenas, Agenda é a visão inicial; você pode trocar. A navegação inferior e **Mais** reúnem as funções do perfil.

Quando oferecido, toque em instalar. Android: instalação/adicionar à tela inicial no navegador. iPhone: Safari → Compartilhar → Adicionar à Tela de Início. É uma aplicação web, sem APK. A sessão e as permissões são as mesmas do site.

Câmera depende de HTTPS, permissão e suporte do dispositivo. Use foto quando oferecida. Sem conexão, novas consultas e gravações exigem internet; não há fila de gravação offline.

Use Tab entre controles e Escape para fechar diálogos. Confira foco, contraste e ampliação de texto. A câmera e a assinatura precisam ser conferidas em celular real; testes de viewport não substituem isso.

## 12. Alunos por código

Na turma correta, a coordenação abre **Compartilhar → Acesso dos alunos → Gerar ou substituir código**. O código completo aparece na geração; distribua apenas à turma. O aluno consulta só essa turma, sem administração ou dados privados individuais.

Substituir o código invalida o anterior e suas sessões; desativar bloqueia o acesso. O código é compartilhado, não identifica matrícula individual. Após restauração de backup, gere novos códigos.

## 13. Suporte rápido

| Sintoma | Primeira verificação |
|---|---|
| Docente sem aulas/chaves | Cadastro, vínculo, disciplinas, datas e alocações |
| Reserva em revisão | Motivo; corrigir/reagendar e aguardar decisão |
| Conflito ao salvar | Conexão, versão; recarregar e comparar |
| Modelo Excel ausente | Equipe técnica deve conferir lib/assets na implantação |
| QR não corresponde | Etiqueta e alocação com a gestão |
| Assinatura rejeitada | Limpar, desenhar assinatura completa e confirmar aceite |
| E-mail não chega | Serviço habilitado, endereço cadastrado e spam |
| Tela antiga | Recarregar e conferir versão publicada |

Informe perfil, tela, ação, mensagem exata, horário e referência do erro. Capturas devem evitar dados privados. Nunca envie senha, token ou backup completo em atendimento público.
