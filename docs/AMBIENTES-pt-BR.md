# Ambientes e vínculo de docentes — primeira etapa

## Como usar
1. Execute `npm install`, `npm run build` e inicie o servidor com as variáveis descritas no guia de instalação.
2. Abra a aba **Ambientes** e clique em **Abrir gestão de ambientes**, ou acesse `/ambientes.html`.
3. Entre com a conta da coordenação para cadastrar nome, tipo, capacidade e disponibilidade. Use **Editar** para alterar ou desativar um ambiente.
4. Para vincular um professor, entre com a senha mestre. Na seção **Vincular contas aos docentes**, selecione o nome já cadastrado em **Docentes** e salve. Crie as contas de docente pela aba **Acesso**, se necessário.
5. O docente entra na mesma página com sua conta e consulta os ambientes e suas aulas programadas. A seleção das aulas usa o vínculo da conta, sem permitir escolher a identidade de outro professor.

## Preservação e funcionamento
O cadastro é armazenado no documento `ambientes` do banco utilizado pela API e participa dos backups e do histórico existentes. Uma nova coluna opcional `docente` é criada na tabela `users` automaticamente; contas anteriores continuam funcionando sem vínculo.
Os vínculos pertencem à tabela de contas: o backup JSON atual de documentos não inclui as contas nem seus vínculos. Para preservar ambos, guarde também uma cópia integral do banco utilizado em produção.
Os ambientes já escritos nas disciplinas não são convertidos nem renomeados automaticamente. Cadastre os nomes usados pela unidade. Capacidade e disponibilidade são informativas nesta etapa.
A lista de aulas usa os horários do turno definidos no calendário atual. Feriados e aulas marcadas como não dadas são excluídos da consulta.

## Permissões
Coordenação cadastra e edita ambientes; docente consulta. Somente a senha mestre vincula contas. A API recusa dados inválidos, nomes duplicados e gravações com revisão desatualizada. Contas de docente mantêm as permissões anteriores de chamada e alunos.

## Próxima etapa
Solicitação por aula, decisão pela coordenação, cancelamento e histórico agora estão disponíveis. Veja RESERVAS-pt-BR.md. Um perfil separado de administrador de ambientes e uma grade diária de ocupação permanecem como possíveis evoluções.

## Validação
27 testes de API aprovados, incluindo permissões, validação, concorrência e vínculo da conta. Geração do site e sintaxe JavaScript verificadas. Páginas do módulo servidas pelo servidor local com HTTP 200. Não houve teste visual no navegador nesta etapa, pois o executável do navegador não estava disponível no ambiente.
