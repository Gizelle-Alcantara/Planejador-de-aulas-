# Acesso dos alunos por código de turma

## Gerar e compartilhar

1. Entre como coordenação e selecione a turma correta.
2. Abra a aba **Compartilhar**.
3. Em **Acesso dos alunos**, clique em **Gerar ou substituir código** e confirme.
4. Copie o código exibido. Por segurança, ele aparece somente nesse momento.
5. Compartilhe o endereço do site e o código com os alunos daquela turma.

O aluno clica em **Sou aluno**, digita o código e entra. Pode consultar calendário, próximas aulas, disciplinas, horários e filtros. Não pode trocar de turma, editar dados, reservar ambientes ou acessar a gestão. O acesso é da turma; não cria cadastro individual de aluno.

## Trocar ou desativar

**Gerar ou substituir código** invalida o código anterior e suas sessões. **Desativar acesso dos alunos** encerra o acesso da turma até a geração de outro código. A atualização é verificada nas requisições; uma tela já aberta percebe a mudança na próxima atualização automática. Conteúdo já visualizado não pode ser recolhido.

Se o código for perdido, gere outro. Ele é compartilhado por toda a turma e pode ser repassado; entregue-o apenas ao grupo correto. O sistema não verifica individualmente a matrícula de quem recebe o código.

## Regras técnicas e implantação

- Códigos aleatórios com 20 caracteres hexadecimais, exibidos em cinco grupos, gerados com aleatoriedade criptográfica. A digitação aceita minúsculas, espaços e hífens.
- O banco armazena somente SHA-256 do código, junto ao identificador da turma e uma chave de versão da sessão, na tabela `student_access` criada automaticamente.
- Sessão assinada em cookie HttpOnly/SameSite=Lax, Secure em HTTPS, com duração de até 12 horas. Código nunca vai na URL.
- O servidor entrega apenas a turma autorizada, sem listas de alunos, faltas individuais, contatos ou observações privadas. Alterar endereço ou parâmetros não libera outra turma.
- Exportações da API, gestão de ambientes e operações de escrita são bloqueadas para o perfil aluno. A coordenação continua exportando calendários completos.
- Respostas da API não são guardadas pelo service worker.
- Exclusão da turma apaga seu código. Restauração de documentos por backup desativa todos os códigos: gere e distribua novos códigos após restaurar. Códigos não integram o backup exportado.
- A publicação usa o banco existente; não é necessário reimportar dados. Execute o build e publique também o backend.

## API

POST `/api` com JSON:

- `student_code_generate`, `turmaId`: coordenação gera/substitui e recebe `code` uma única vez.
- `student_code_revoke`, `turmaId`: coordenação desativa o código.
- `student_login`, `code`: valida o código e cria a sessão de aluno. Código inválido retorna 401.
- GET `/api`: aluno recebe apenas sua turma e ambientes aprovados nela. Demais consultas parametrizadas retornam 403.
- `logout`: encerra a sessão atual sem desativar o código compartilhado.

## Validação

Testes em banco temporário verificam geração, código incorreto, leitura exclusiva, proibição de alterações e reservas, renovação, revogação e exclusão/recriação da turma. A interface verifica geração pela coordenação, entrada pelo código, troca indevida de endereço e apresentação móvel.
