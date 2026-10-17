# Auditoria do sistema — 17/10/2026

Site: https://planejador-de-aulas-zowu.vercel.app/

## Resultado

**As melhorias estão no projeto local, mas nem todas estão disponíveis no site publicado.** A publicação contém uma combinação de arquivos atuais e arquivos antigos. Além disso, a própria tela Publicação identifica três pendências de configuração.

No projeto local, os **155 testes automatizados passaram**. Foram executadas **15 suítes de interface**, aprovadas após o reteste de notificações. Esse teste tinha uma condição de corrida: o contador de avisos já havia sido atualizado pela verificação automática enquanto a lista ainda estava carregando. A espera do teste foi ajustada para conferir a lista após sua atualização; o código do produto não precisou de alteração para esse caso.

## O que foi verificado no site

Navegação pública e, após o usuário autenticar a sessão, consulta com a senha mestre. Foram conferidos docentes, busca, calendário, ambientes, reservas existentes, ocupação diária, exportações, relatórios, notificações, diagnóstico e preparação para publicação. A responsividade foi conferida em 320 px em notificações, sistema principal, docentes e ambientes, sem transbordamento da página; a grade de ambientes usa rolagem interna.

Os testes de gravação, exclusão, restauração, permissões de outros perfis e assinatura foram executados nos bancos temporários das suítes locais. Não foram executadas assinaturas, exclusões, restaurações ou alterações de dados acadêmicos no banco publicado. A sessão concedida no navegador era da senha mestre; não equivale à homologação dos demais perfis em produção.

## Matriz das melhorias

| Melhoria | Projeto local | Situação na publicação |
|---|---|---|
| Remover a escolha de mês da entrada | Validado na suíte principal | **Pendente:** a entrada pública ainda mostra “Escolher mês do calendário”. |
| Padronizar a entrada com Salas e Laboratórios | Validado em temas e celular | **Pendente:** cabeçalho e apresentação antigos. |
| Docentes em cartões, sem lista repetida de bloqueios | Suíte de docentes aprovada | **Pendente:** tabela editável antiga e seção repetida de bloqueios. |
| Retirar “Cadastro completo” da lista | Validado | Presente: botão ausente; dados adicionais recolhidos. |
| Busca de docentes, vínculo e disciplinas | Suítes de busca e docentes aprovadas | Busca por “EAD” testada: 1 de 5 resultados. Filtros disponíveis. |
| Logo SENAI e temas de ambientes | Suíte de ambientes aprovada | Logo e seletor de tema presentes. Alternância e persistência testadas localmente. |
| Ocupação diária por turnos | Suíte de ambientes e testes de programação aprovados | Presente: Matutino, Vespertino e Noturno. Consulta de 19/10 mostrou reserva aprovada. |
| Grade com colunas legíveis e rolagem | Validado em celular e computador | Presente: coluna Turno e rolagem interna; 33 ambientes no cadastro consultado. |
| CSV e impressão da programação | Suítes de ambientes e principal aprovadas | CSV baixado com sucesso. Comando de impressão presente; impressão/PDF validada localmente. |
| Painel externo HTML para TV/totem | Validado pelos testes de programação diária | **Pendente na tela:** nenhum comando de exportação para TV/totem. |
| Excel diário das aulas planejadas | Validado pelos testes de programação diária | **Pendente na tela:** há CSV e impressão, sem Excel diário. |
| Gestão agenda salas para docentes | Validado pelas suítes de API e ambientes | **Pendente na tela:** formulário “Agendar sala de aula” ausente na sessão mestre. |
| Docente solicita apenas laboratórios | Validado em API e interface locais | Não homologado com conta docente no site; tela publicada e regras recentes não estão sincronizadas. |
| Docente acessa ocupação e reservas; chaves acrescentadas no último pedido | Suítes de ambientes e chaves aprovadas | Perfil docente não autenticado nesta auditoria de produção; controle de chaves ausente da interface publicada. |
| Exclusão protegida de ambientes | Validada nas suítes de API e ambientes | **Pendente na tela:** cadastro apresenta Editar e Ver ocupação, sem Excluir. |
| Importação de ambientes por Excel, somente administrador | Testes de API e interface aprovados | **Pendente na tela:** formulário ausente inclusive para senha mestre. O arquivo auxiliar está publicado, mas não é importado por ambientes.js. |
| Cadastro de chaves e etiquetas QR | Testes de API e interface aprovados | **Pendente na tela:** seção e navegação de chaves ausentes. Arquivo auxiliar e bibliotecas estão publicados, mas não integrados ao ambientes.js publicado. |
| Alocação, leitura QR e assinaturas de retirada/devolução | Testados localmente, incluindo QR real lido por foto e nova leitura para devolução | Não disponíveis no fluxo da interface publicada; não se pode considerar homologados em produção. |
| Comprovantes e backup das movimentações | Testes locais de assinatura, consulta privada e backup/restauração aprovados | Sem interface publicada de chaves para validar o fluxo. |
| Ambientação antes do início da turma | Suíte de regras educacionais aprovada | **Parcial/inconsistente:** lançamento anterior existe, mas o painel e a exportação ainda o classificam como fora do período. |
| EAD sem horário, sem ambiente e em paralelo | Testes de regras educacionais aprovados | **Parcial/inconsistente:** a tela atribui horários fixos à EAD; prévia do Excel também os mostra. Fluxo recente não está integrado integralmente. |
| EAD como citação compacta | Suíte educacional aprovada | **Pendente:** calendário usa chip comum com intervalo de aulas e horário; apresentação compacta ausente. |
| Exclusão de avisos | Suítes de notificações e API aprovadas | **Pendente:** central não apresenta Excluir aviso. |
| Detecção automática de novos avisos | Suíte de notificações aprovada após corrigir a espera do teste | **Pendente:** código publicado não contém a rotina de verificação nem o aviso “Mostrar novos avisos”. |
| Central de notificações, filtros e leitura | Validado localmente | Central carregou 11 avisos e seus filtros; leitura não foi alterada nesta auditoria. |
| Correção do modelo Excel da turma | Testes de exportação e suíte principal aprovados | **Confirmado:** prévia e download concluídos, .xlsx válido com duas abas. |
| Correção do modelo anual do docente | Testes de exportação e suíte principal aprovados | **Confirmado:** prévia e download concluídos, .xlsx válido com uma aba. |
| Relatórios gerenciais | Suíte de relatórios aprovada | Geração concluída; indicadores e exportação CSV/impressão disponíveis. |
| Diagnóstico de falhas | Suíte de diagnóstico aprovada | Tela operacional; uma ocorrência de conexão registrada. Isso não comprova indisponibilidade atual do servidor. |
| Preparação para publicação | Testes locais aprovados | Tela operacional e com pendências reais de configuração, detalhadas abaixo. |
| Duplicação de turma | Suíte de duplicação aprovada | Não executada em produção para evitar criar turma real. |
| Histórico detalhado, restauração e concorrência | Suítes de histórico e API aprovadas | Restauração e gravações concorrentes não executadas no banco publicado. |
| Planejamento assistido e conflitos | Suítes de planejamento, API e educação aprovadas | Interface de planejamento e central de conflitos presentes; aplicação de sugestões não executada em produção. |
| Recuperação de senha | Suíte de recuperação aprovada | Arquivos atuais publicados, mas a configuração de e-mail está indisponível segundo Publicação. Entrega real não homologada. |
| Perfis coordenação, ambientes, docente e aluno | Suítes de API, ambientes, principal e celular aprovadas | Somente senha mestre autenticada nesta auditoria; demais perfis precisam de homologação após a publicação completa. |

## Evidência da publicação incompleta

Foram comparados os conteúdos de 19 arquivos públicos com a saída de `npm run build`: **9 iguais e 10 diferentes**. A comparação foi por SHA-256 do conteúdo, não apenas pelo nome do arquivo.

- `index.html`, `ambientes.html`, `ambientes.js`, `professional.css`, `ambientes.css`, `accessibility.js`, `notifications.js`, `notificacoes.html`, `schedule.js` e `sw.js` divergem da versão local.
- O cache publicado usa `planejador-v34-perfil-docente`; o projeto local usa `planejador-v44-controle-chaves`.
- `key-control.js`, `environment-import.js` e as bibliotecas de QR estão atuais na hospedagem, porém o `ambientes.js` publicado não importa esses módulos. A existência dos arquivos auxiliares não disponibiliza as funcionalidades na tela.
- A diferença também aparece em solicitações diretas dos arquivos públicos, além do navegador. Portanto, os resultados não podem ser atribuídos apenas a um cache antigo da aba.

Isso é compatível com publicação parcial ou uso de uma saída de build antiga. O mecanismo exato do envio não foi inspecionado. O código interno das funções da Vercel não é público; a comparação não comprova a versão integral do backend.

## Configuração apontada pela própria publicação

**Três itens “Corrigir”:**

1. **Chave das sessões:** revisar `SESSION_SECRET`; a verificação exige chave aleatória com pelo menos 32 caracteres, diferente da senha mestre.
2. **Endereço público:** configurar `PUBLIC_URL` com `https://planejador-de-aulas-zowu.vercel.app`.
3. **Agendamento de backups:** configurar `CRON_SECRET` com pelo menos 24 caracteres e homologar a rotina da hospedagem.

**Dois alertas:**

- E-mail: sem `RESEND_API_KEY` e `MAIL_FROM`, recuperação de senha e avisos por e-mail ficam indisponíveis.
- Atualidade do backup: o último backup está desatualizado em relação aos dados ou à janela verificada. A integridade do último arquivo passou, mas a restauração em ambiente isolado ainda precisa ser homologada para produção.

As variáveis secretas não foram lidas nem alteradas. A mensagem “Conferido” da senha mestre não demonstra a força das senhas das demais contas.

## Próximo passo recomendado

1. Gerar e publicar **o projeto completo**, com `npm run build` na Vercel e a saída `public`, junto às funções da API e suas dependências atuais.
2. Corrigir as três configurações pendentes e definir se os envios por e-mail serão habilitados.
3. Atualizar e guardar o backup completo antes de qualquer atualização que altere os dados do banco.
4. Repetir a comparação da publicação e homologar os quatro perfis, importação, exportações novas e o ciclo real de chaves no endereço definitivo.
5. Testar câmera física no celular com HTTPS e entrega real de e-mails; essas integrações não são comprovadas pelos testes locais.

## Evidências locais

- `publicacao.json`: códigos HTTP, tamanhos e hashes dos 19 arquivos, carga anônima e proteções sem login.
- `interface-local.json`: execução inicial das 15 suítes, com a falha inicial de sincronização no teste de notificações preservada.
- `test-ui-notifications-reteste.log`: reteste aprovado após correção da espera.
- `resultado-final.json`: consolidação final dos testes.
- `../auditoria-sistema-testes.log`: os 155 testes aprovados.

A auditoria não publicou uma nova versão nem modificou as configurações da Vercel.
