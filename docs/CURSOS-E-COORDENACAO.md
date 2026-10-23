# Cursos e coordenação

Na aba **Cursos**, cada curso técnico ou rápido tem sua própria tela com unidades curriculares, professores sugeridos e lista de turmas.

## Configuração pelo administrador

1. Cadastre os professores na aba **Docentes**. Os modelos usam esse cadastro; não criam professores duplicados.
2. Abra **Cursos**. Cursos das turmas existentes já aparecem. Abra um deles para cadastrar seu modelo ou clique em **Novo curso**.
3. Cadastre sigla, nome, carga horária, módulo opcional e professor sugerido de cada unidade. Salve o modelo. Também é possível abrir uma turma do mesmo curso e usar suas unidades como ponto de partida.
4. Em **Acesso**, crie as contas de coordenação, se necessário.
5. Em **Cursos → Acessos por curso**, marque e salve os cursos de cada coordenador. Um coordenador pode atender vários cursos.
6. Confira os vínculos e clique em **Ativar restrições por curso**. Coordenadores sem vínculo deixam de acessar turmas. O administrador continua com acesso completo.

Os acessos atuais são mantidos até essa ativação explícita. Não há exclusão ou migração automática das turmas existentes. Variações de espaços e maiúsculas no nome são agrupadas; nomes diferentes continuam como cursos separados. O nome de um curso existente é preservado para manter os vínculos.

## Uso diário

Abra um curso e escolha **Nova turma deste curso**. A opção **Usar modelo do curso selecionado** copia suas unidades, cargas horárias e professores sugeridos. Cada turma pode ajustar essa cópia, inclusive trocar professores; mudanças não se propagam para o modelo nem para outras turmas. O calendário começa vazio.

Em **Professores**, confira os docentes sugeridos pelo modelo. Em **Turmas**, abra o calendário de uma turma daquele curso. O professor sugerido é opcional e pode ser definido depois na turma.

Depois da ativação, o coordenador vê somente cursos e turmas vinculados à sua conta. O servidor também protege operações diretas, exportações, histórico e relatórios. Cadastros globais, frequência, ambientes, envio de avisos, exportação global de docente e backups permanecem com o administrador ou os perfis específicos desses módulos.

## Manutenção

Os vínculos podem ser alterados a qualquer momento em **Acessos por curso**. A autorização é atualizada a cada requisição; a tela detecta a alteração e recarrega. Revogar todos os cursos deixa a conta sem turmas, sem apagar seus dados.

Backups completos preservam modelos e vínculos. Restaurar contas encerra suas sessões; faça novo login. Backups antigos sem vínculos restauram as contas com lista vazia: se as restrições estiverem ativas, o administrador deve atribuir os cursos novamente.

Validação automatizada: `npm test` e `npm run test:ui:courses`. O teste de navegador usa banco temporário, cobre criação de modelo, professor, atribuição de coordenador, ativação, criação de turma, persistência, conta sem curso, acessibilidade e larguras de 320, 768 e 1280 px. Isso não substitui homologação em celulares físicos.
