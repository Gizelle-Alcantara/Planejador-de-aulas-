# Plano de implementação — Agenda SENAI

Elaborado em **20/10/2026**. Escopo: implantação operacional e adoção do sistema existente na unidade. Prazos e responsáveis abaixo são propostas para organização; não representam atividades já executadas ou aprovação institucional.

Revisão documental: **23/10/2026**, alinhada ao código f816e609a5dce02e3e04d58db4169cf8805b7ff0. No piloto, incluir a configuração de cursos e modelos, atribuição dos coordenadores e teste com conta sem curso. A ativação das restrições só deve ocorrer após conferir os vínculos. Os prazos propostos neste plano não foram convertidos em atividades realizadas por esta revisão.

## 1. Objetivo

Colocar o planejamento acadêmico, a gestão de ambientes, as reservas e a retirada/devolução de chaves em uso controlado, com equipe treinada, dados conferidos e recuperação testada.

O sistema já está publicado. Este plano trata da preparação para uso institucional e da ampliação gradual da operação. Novas funcionalidades entram depois, conforme problemas observados no piloto.

## 2. Prazo e sequência

Previsão inicial: **quatro semanas**, contadas a partir da indicação dos responsáveis e disponibilidade da equipe. A etapa seguinte depende do aceite da anterior. A integração de e-mail depende da autorização do domínio e pode seguir em paralelo, sem bloquear o piloto dos recursos internos.

| Etapa | Janela sugerida | Entrega | Dependência |
|---|---|---|---|
| 1. Organização e proteção | Semana 1, dias 1–2 | Responsáveis, escopo do piloto, backup e ambiente de teste | Disponibilidade da coordenação e TI |
| 2. Conferência de cadastros | Semana 1, dias 3–5 | Contas, vínculos, ambientes e programação revisados | Etapa 1 |
| 3. Homologação e treinamento | Semana 2 | Fluxos aprovados e usuários do piloto capacitados | Etapa 2 |
| 4. Piloto acompanhado | Semana 3 | Uso real restrito, ocorrências e ajustes registrados | Etapa 3 |
| 5. Expansão e entrega operacional | Semana 4 | Liberação gradual, suporte e aceite documentados | Piloto aprovado |

Não há data de início assumida. Se autorização, equipamento ou correção necessária atrasar, reprograme a janela e registre o motivo.

## 3. Papéis propostos

| Papel | Responsabilidade |
|---|---|
| Coordenação da unidade | Definir escopo, validar programação e decidir liberação |
| Administrador mestre | Contas, vínculos, importações autorizadas e revisão de acessos |
| Coordenação de ambientes | Cadastro, manutenção, reservas, etiquetas e operação das chaves |
| Equipe técnica | Publicação, banco, backup, recuperação, diagnóstico e correções |
| TI responsável pelo domínio | Autorizar domínio/remetente e configurar os registros necessários ao e-mail |
| Docentes do piloto | Validar agenda, reservas e suas retiradas/devoluções |
| Responsável pelo suporte | Centralizar ocorrências, orientar usuários e acompanhar resolução |

Uma pessoa pode acumular funções se a unidade definir isso. Registrar nome e substituto em controle interno, sem incluir credenciais no plano. Docentes usam contas individuais; senha mestre não deve ser distribuída como acesso cotidiano.

## 4. Etapa 1 — organização e proteção

1. Confirmar a versão publicada e registrar commit, endereço e ambiente do banco.
2. Escolher um grupo inicial: sugestão de uma turma, dois docentes e dois ambientes, ajustando ao contexto da unidade.
3. Nomear responsáveis e canal de suporte; definir quem autoriza mudanças em produção.
4. Gerar backup completo atualizado pelo mestre e guardar cópia externa com acesso controlado.
5. Preparar ambiente de teste com banco separado e dados fictícios.
6. Definir perda de dados tolerável e prazo de recuperação (RPO/RTO), sem assumir que o cron diário garante esses objetivos.

**Critério para avançar:** versão identificada, cópia externa disponível, ambiente isolado acessível e responsáveis definidos. Ensaiar a recuperação antes de iniciar o uso real com chaves.

## 5. Etapa 2 — dados e acessos

### Cadastros acadêmicos

Conferir docentes, contatos, disponibilidade, disciplinas, carga horária, turmas, períodos e turnos. Revisar Ambientação antes do período e EAD em paralelo sem ambiente. Corrigir duplicações e vínculos preservando identificadores existentes.

### Contas e permissões

Criar ou revisar contas com o perfil mínimo necessário. Vincular docentes ao cadastro correto. Conferir que o docente veja sua agenda, reservas e Minhas chaves, sem cadastro/alocação de chaves. Confirmar que alunos só consultem a turma do código.

### Ambientes e chaves

Conferir tipo, capacidade, disponibilidade e manutenção. Se necessário, importar Excel pelo mestre, sempre conferindo a prévia antes de aplicar. Identificar chaves físicas, gerar etiquetas QR e conferir correspondência com cada sala/laboratório. Não expor tokens QR em telas externas.

**Critério para avançar:** todos os registros do piloto conferidos pelos responsáveis, sem vínculo incorreto ou conflito de recurso não resolvido. A conferência não exige recadastrar ou reimportar dados que já estejam corretos.

## 6. Etapa 3 — homologação e treinamento

Executar cenários em teste antes de movimentar chaves reais:

| Cenário | Resultado esperado |
|---|---|
| Salvar e recarregar programação | Dados persistem e aparecem no perfil correto |
| Ambientação e EAD | Exceções funcionam sem ocupação presencial indevida |
| Solicitação docente | Laboratórios disponíveis; salas agendadas pela gestão |
| Aprovar e alterar reserva | Ocupação correta; mudança relevante exige revisão |
| Alocar e retirar chave | Aula e docente corretos; QR/assinatura/aceite exigidos |
| Conta alheia, QR errado ou retirada futura | Operação recusada |
| Devolver chave | Registro e comprovante disponíveis, inclusive após a aula |
| Exportar Excel/HTML diário | Programação confere com data, ambiente e aulas planejadas |
| Acesso aluno | Uma turma, sem escrita ou gestão |
| Restaurar cópia de teste | Dados, contas, vínculos e chaves recuperados conforme escopo |

Conferir em **Android e iPhone reais**: instalação, navegação, câmera, leitura QR e assinatura. Conferir impressão de uma planilha no Excel utilizado pela unidade. Os testes automatizados anteriores ajudam, mas não substituem esses aceites.

Treinamento sugerido: 60 minutos para coordenação/administrador, 60 minutos para ambientes e 30 minutos para docentes. Usar exemplos fictícios e o [manual](MANUAL-COMPLETO.md). Cada participante deve conseguir executar seu fluxo principal sem intervenção técnica.

**Critério para avançar:** cenários críticos aprovados, restauração ensaiada e participantes do piloto treinados. Pendências menores precisam de responsável e prazo registrados.

## 7. Etapa 4 — piloto acompanhado

Operar por **cinco dias úteis**, com o grupo escolhido. No início de cada dia, conferir aulas, reservas, alocações e programação externa. No encerramento, conferir devoluções e incidentes. Não registrar assinatura em nome do docente para concluir um teste.

Manter um registro de ocorrências com data, perfil, tela, passos, mensagem/referência, impacto, responsável e situação. Evitar senhas, tokens, assinaturas e dados pessoais desnecessários. Corrigir falhas em teste e publicar versões identificadas.

| Indicador | Meta proposta para aprovação |
|---|---|
| Perfis do piloto | Todos com acesso e vínculo corretos |
| Programação do piloto | Sem divergência conhecida entre dados salvos e exportados |
| Movimentos de chave | Todos os movimentos reais do piloto registrados ou com exceção documentada pela gestão |
| Segurança e integridade | Nenhuma falha aberta de acesso indevido, perda de dados ou atribuição errada de chave |
| Usuários | Todos os participantes concluem o fluxo principal |

**Decisão ao final:** ampliar, prolongar o piloto ou suspender o fluxo afetado. Falha crítica não deve ser compensada apenas por uma orientação informal ao usuário.

## 8. Etapa 5 — expansão e operação assistida

1. Validar o resultado do piloto com coordenação, ambientes e equipe técnica.
2. Gerar nova cópia externa antes da ampliação.
3. Liberar novas turmas/ambientes em grupos, conferindo contas e dados a cada grupo.
4. Entregar manual, contatos de suporte e procedimento de contingência.
5. Acompanhar diariamente durante a semana de expansão e definir a rotina permanente.
6. Registrar versão, escopo liberado, pendências aceitas e responsável pela decisão.

**Critério de conclusão:** operação dos grupos liberados aceita, suporte estabelecido, backup externo e recuperação conferidos, responsáveis definidos e pendências registradas. A aprovação institucional deve ser dada pelo responsável da unidade.

## 9. E-mail — trilha paralela

1. A equipe autorizada escolhe domínio/subdomínio e remetente institucional.
2. TI configura os registros exigidos pelo provedor e confirma a verificação.
3. Administração técnica configura RESEND_API_KEY, MAIL_FROM e PUBLIC_URL no ambiente correto, sem compartilhar segredos em chat ou documento.
4. Realizar envio para destinatário de teste autorizado e homologar recuperação, expiração e uso único.
5. Liberar o serviço e orientar usuários.

Enquanto pendente, manter avisos internos, WhatsApp manual e redefinição de senha pelo administrador. A abertura da conversa no WhatsApp não comprova envio/entrega. Domínio fictício não habilita e-mail real. E-mail deve permanecer registrado como pendência se não for homologado até a expansão.

## 10. Riscos e contingência

| Risco | Tratamento |
|---|---|
| Falta de internet/câmera | Procedimento manual autorizado pela unidade, com conferência da chave física e registro da exceção; não presumir sincronização offline |
| Cadastro ou vínculo incorreto | Suspender a alocação afetada e corrigir cadastro/vínculo antes de continuar |
| Falha crítica na versão | Preservar logs/estado e avaliar retorno ao código anterior, conferindo compatibilidade do banco |
| Necessidade de restaurar | Backup atual, avaliação dos registros posteriores e procedimento de recuperação aprovado |
| Domínio não autorizado | Prosseguir com recursos internos; manter e-mail pendente |
| Adoção insuficiente | Reforçar treinamento e prolongar piloto |
| Exposição em TV/totem | Conferir conteúdo e local autorizado antes de distribuir o HTML |

O registro manual de contingência não deve gerar assinatura eletrônica retroativa em nome de outra pessoa. Definir com a gestão como reconciliar a exceção e preservar sua justificativa.

## 11. Melhorias após estabilização

Priorizar com base nas ocorrências, frequência, impacto e esforço. Candidatos para avaliação: autenticação multifator, monitoramento com alertas, automação de testes na publicação e aperfeiçoamento dos indicadores de operação. Essas propostas não fazem parte dos recursos já entregues nem são compromissos de implementação.

Evitar ampliar funcionalidades durante o piloto, salvo correção necessária para segurança, integridade ou execução do fluxo.

## 12. Implantação dos processos físicos

O piloto deve validar o atendimento presencial junto com o sistema. O detalhamento está no [Procedimento físico e roteiro de simulação](PROCESSOS-FISICOS.md); o [protótipo visual](PROTOTIPO-OPERACAO.html) permite percorrer o fluxo com dados fictícios.

| Etapa do plano | Preparação física obrigatória para o piloto |
|---|---|
| Organização | Definir estação de autoatendimento, guarda das chaves e acesso físico dos docentes autorizados |
| Cadastros | Inventariar chaves, conferir fechaduras e ambientes, identificar chaveiros e posições de guarda |
| Homologação | Fixar etiquetas QR de teste, testar leitura no local e ensaiar retirada/devolução pelo próprio docente |
| Piloto | Conferir fisicamente cada chave entregue/recebida e conciliar com as movimentações do sistema |
| Expansão | Dimensionar acesso ao ponto por turno, disponibilizar instruções e revisar inventário e pendências |

### Estrutura proposta

O painel de autoatendimento está em `/secretaria-chaves.html`, com opção de tela cheia. Incluir na homologação: escolha de retirada/devolução, login docente, exibição apenas das próprias chaves, assinatura, saída ao concluir e encerramento por inatividade. Preparar perfil de navegador dedicado ao painel, sem sessões administrativas ou senhas salvas.

Uma estação de autoatendimento com internet; armário/claviculário identificado, com acesso físico definido pela unidade para os docentes autorizados; chaveiros com identificação legível e QR protegido; celular do docente ou equipamento de apoio; instruções e registro de contingência. O próprio docente localiza, confere, retira e devolve sua chave, sem intermediário presencial.

A autorização no sistema não destrava o armário nem impede fisicamente o acesso a outras chaves. A unidade precisa definir como os docentes autorizados acessam o local e limitar a retirada à chave alocada. Controle físico eletrônico integrado não faz parte da implementação atual; se desejado, deve ser especificado separadamente.

As quantidades dependem do inventário e do pico de uso medido no piloto. Levantar itens disponíveis, faltantes, custo estimado e responsável antes de qualquer aquisição. Este plano não autoriza compras.

### Sequência presencial de referência

1. Coordenação planeja a aula; gestão valida ambiente e aloca a chave ao docente.
2. Docente consulta sua agenda/Minhas chaves e acessa o ponto de autoatendimento pelo procedimento autorizado da unidade.
3. Docente confere sua conta, aula, ambiente e identificação da chave na posição de guarda, sem levar outra chave.
4. Docente lê o QR correspondente, assina com sua conta e confirma a retirada.
5. Após confirmar o registro de retirada, docente retira a chave correspondente e segue para o ambiente; se houver interrupção, comunica a divergência à gestão.
6. Docente utiliza o ambiente e retorna à estação ao encerrar o uso, conforme horário combinado com a unidade.
7. Docente confere a chave, lê o QR e a recoloca na posição correta; assina e confirma a devolução no local.
8. Docente verifica a confirmação e a guarda física antes de sair. A gestão acompanha pendências e realiza conferências periódicas, sem participar obrigatoriamente de cada movimentação.

O sistema não detecta sozinho a retirada ou a presença da chave no armário. A conferência física de cada movimento é feita pelo próprio docente. Assinatura por terceiro e transferência direta entre docentes não fazem parte do fluxo proposto.

### Aceite físico antes da expansão

Inventário do piloto reconciliado; acesso físico autorizado definido; todas as etiquetas correspondem às chaves/ambientes; autoatendimento completo ensaiado; chave errada e falta de conexão tratadas; canal para divergências e procedimento de guarda disponíveis; nenhuma divergência de custódia sem investigação.

## 13. Próxima ação

**Começar pela etapa 1:** indicar responsáveis, escolher o grupo piloto e guardar backup externo atualizado. Depois, agendar a conferência dos cadastros com coordenação e ambientes.

Incluir nessa reunião o inventário físico e uma simulação de autoatendimento, usando uma chave de teste e o roteiro do protótipo. A simulação visual não grava reservas, movimentações ou assinaturas no sistema real.

Referências: [operação](OPERACAO-E-MANUTENCAO.md), [segurança e recuperação](SEGURANCA-E-RECUPERACAO.md), [testes e aceite](TESTES-E-ACEITE.md) e [entrega técnica](ENTREGA-TECNICA.md).
