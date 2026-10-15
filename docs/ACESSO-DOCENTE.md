# Acesso privado dos docentes

## Configurar na coordenação

1. Entre em `/#login` com a senha mestre.
2. Na aba **Docentes**, confira o cadastro profissional do professor.
3. Na aba **Acesso**, crie uma conta com usuário, nome, senha de pelo menos oito caracteres e perfil **Docente**.
4. Abra **Ambientes e vínculos de docentes**. Em **Contas e vínculos**, selecione o docente correspondente e clique em **Salvar vínculo**.
5. Entregue as credenciais ao titular por um canal privado. Não use a senha mestre para docentes.

Criar o cadastro profissional não cria automaticamente uma conta. Uma conta sem vínculo não recebe aulas e não pode solicitar reservas para aulas alheias. Renomear o cadastro mantém o vínculo por identificador permanente.

## Entrar e reservar

1. Na página inicial, clique em **Sou docente** e entre com seu usuário e senha.
2. O sistema abre seu calendário pessoal, com suas disciplinas em todas as turmas vinculadas.
3. Clique em **Reservar salas e laboratórios**.
4. Selecione uma aula programada, o ambiente e a finalidade; envie para aprovação.
5. Acompanhe a decisão em **Reservas** e **Notificações**. Pedidos seguem as regras existentes de conflito, manutenção, cancelamento e reagendamento.
6. Use **Voltar** para retornar ao calendário e **Sair** para encerrar a sessão.

## Privacidade e mudanças de comportamento

A restrição é aplicada no servidor. Trocar o nome ou identificador no endereço não libera calendários de colegas. Em uma turma com vários docentes, a conta recebe apenas suas disciplinas e posições de horário. Na ocupação diária, horários de terceiros aparecem como ocupados, sem nome, turma ou disciplina.

Agendas anônimas e ICS públicos foram desativados para impedir acesso alternativo às informações. Links antigos exigem login. A visão do aluno exige um código de turma; consulte ACESSO-ALUNOS.md. A coordenação continua consultando calendários completos.

O docente pode exportar sua agenda anual em Excel e obter seu ICS autenticado, mas não exportar o calendário completo da turma. Importações de ICS no Google Agenda/Outlook são cópias: não há assinatura pública com atualização automática nesta versão. Respostas da API não são armazenadas pelo service worker.

A senha é protegida por scrypt com salt; a sessão dura até 12 horas em cookie HttpOnly. Alterar a senha ou remover a conta invalida a sessão. A troca de vínculo é reavaliada no servidor. Recuperação automática de senha e autenticação em duas etapas não estão incluídas.

## Publicação e validação

Publique os arquivos atualizados e execute o build. Mantenha as variáveis ADMIN_PASSWORD, SESSION_SECRET e a configuração do banco. Não execute a importação inicial para atualizar uma instalação existente.

Os testes cobrem login, contas sem vínculo, aulas compartilhadas, bloqueio de exportação de terceiros, ICS autenticado, privacidade de ocupação e o fluxo de reserva/aprovação. Foram executados em banco temporário, sem alterar os dados originais.
