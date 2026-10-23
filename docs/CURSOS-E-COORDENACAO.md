# Cursos e coordenação

Edição: 23/10/2026. Código funcional de referência: f816e609a5dce02e3e04d58db4169cf8805b7ff0.

Na aba **Cursos**, cada curso técnico ou rápido tem sua própria tela com unidades curriculares, professores sugeridos e lista de turmas.

## Configuração pelo administrador

1. Cadastre os professores na aba **Docentes**. Os modelos usam esse cadastro; não criam professores duplicados.
2. Abra **Cursos**. Cursos das turmas existentes já aparecem. Abra um deles para cadastrar seu modelo ou clique em **Novo curso**.
3. Cadastre sigla, nome, carga horária, módulo opcional e professor sugerido de cada unidade. Salve o modelo. Em **Começar a partir de uma turma**, selecione uma turma de origem do próprio curso e clique em **Importar unidades da turma** para usar sua estrutura como ponto de partida. A importação preenche um rascunho e só altera o modelo depois de salvar.
4. Em **Acesso**, crie as contas de coordenação, se necessário.
5. Em **Cursos → Acessos por curso**, marque e salve os cursos de cada coordenador. Um coordenador pode atender vários cursos.
6. Confira os vínculos e clique em **Ativar restrições por curso**. Coordenadores sem vínculo deixam de acessar turmas. O administrador continua com acesso completo.

Os acessos atuais são mantidos até essa ativação explícita. Não há exclusão ou migração automática das turmas existentes. Variações de espaços e maiúsculas no nome são agrupadas; nomes diferentes continuam como cursos separados. O nome de um curso existente é preservado para manter os vínculos.

## Uso diário

A antiga aba principal **Disciplinas** agora fica em **Cursos → Abrir curso → Unidades curriculares**. Use **Modelo do curso** para preparar as próximas turmas e **Ajustes por turma** para selecionar uma turma e editar suas unidades, professores, cargas horárias e ambientes. Os ajustes da turma são salvos automaticamente. Atalhos antigos de disciplinas levam a essa mesma área dentro do curso.

Abra um curso e escolha **Nova turma deste curso**. A opção **Usar modelo do curso selecionado** copia suas unidades, cargas horárias e professores sugeridos. Cada turma pode ajustar essa cópia, inclusive trocar professores; mudanças não se propagam para o modelo nem para outras turmas. O calendário começa vazio.

Em **Professores**, confira os docentes sugeridos pelo modelo e os professores vinculados às turmas, com as respectivas quantidades de unidades e turmas. Em **Turmas**, busque por código, turno ou módulo e use **Abrir calendário** ou **Ajustar unidades**. O professor sugerido é opcional e pode ser definido depois na turma.

As alterações do modelo são mantidas como rascunho enquanto você navega pelas seções do curso. Use **Salvar modelo do curso** para gravar ou **Descartar alterações** para voltar à versão salva. Recarregar ou fechar a página com rascunhos pede confirmação do navegador. Esses rascunhos não são uma cópia persistente e não substituem o salvamento.

Uma conta de coordenação sem restrições por curso ativadas consulta o modelo, com aviso explícito sobre a permissão de edição. O administrador edita todos os modelos; após a ativação, coordenadores vinculados editam os modelos de seus cursos. Os campos de consulta ficam identificados e desabilitados; os ajustes das turmas seguem as permissões existentes.

Depois da ativação, o coordenador vê somente cursos e turmas vinculados à sua conta. O servidor também protege operações diretas, exportações, histórico e relatórios. Cadastros globais, frequência, ambientes, envio de avisos, exportação global de docente e backups permanecem com o administrador ou os perfis específicos desses módulos.

## Manutenção

Os vínculos podem ser alterados a qualquer momento em **Acessos por curso**. A autorização é atualizada a cada requisição; a tela detecta a alteração e recarrega. Revogar todos os cursos deixa a conta sem turmas, sem apagar seus dados.

Backups completos preservam modelos e vínculos. Restaurar contas encerra suas sessões; faça novo login. Backups antigos sem vínculos restauram as contas com lista vazia: se as restrições estiverem ativas, o administrador deve atribuir os cursos novamente.

Validação automatizada: `npm test` e `npm run test:ui:courses`. O teste de navegador usa banco temporário, cobre criação de modelo, professor, atribuição de coordenador, ativação, criação de turma, persistência, conta sem curso, acessibilidade e larguras de 320, 768 e 1280 px. Isso não substitui homologação em celulares físicos.
