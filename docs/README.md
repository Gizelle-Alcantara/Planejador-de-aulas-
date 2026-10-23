# Documentação do Agenda SENAI

Edição consolidada: **23/10/2026**. Código de referência: `f816e609a5dce02e3e04d58db4169cf8805b7ff0`, com as melhorias de cursos publicadas nessa data. A versão `1.0.0` do package.json não identifica sozinha uma implantação: registre também o commit e a data. A publicação desta edição altera a documentação, sem mudar regras ou dados do sistema.

| Público | Documento |
|---|---|
| Coordenação, docentes, ambientes e alunos | [Manual completo](MANUAL-COMPLETO.md) |
| Administrador e coordenadores | [Cursos, modelos e vínculos de acesso](CURSOS-E-COORDENACAO.md) |
| Horistas e responsáveis pela conferência | [Frequência mensal](FREQUENCIA-HORISTAS.md) |
| Administrador e infraestrutura | [Instalação, publicação e manutenção](OPERACAO-E-MANUTENCAO.md) |
| Desenvolvedor | [Arquitetura e modelo de dados](REFERENCIA-TECNICA.md) |
| Integrações e endpoints | [Referência da API](API.md) |
| Responsável por acessos e dados | [Segurança e recuperação](SEGURANCA-E-RECUPERACAO.md) |
| Homologação e suporte | [Testes e aceite](TESTES-E-ACEITE.md) |
| Transferência para outra equipe | [Entrega técnica](ENTREGA-TECNICA.md) |
| Implantação na unidade | [Plano de implementação](PLANO-DE-IMPLEMENTACAO.md) |
| Atendimento presencial e guarda de chaves | [Processos físicos e simulação](PROCESSOS-FISICOS.md) |

[Protótipo visual da operação física](PROTOTIPO-OPERACAO.html): demonstração local do fluxo de alocação, retirada, uso e devolução, sem acesso ao sistema real.

Complemento de 20/10/2026: plano de implantação e adoção com cronograma proposto, responsáveis e critérios de avanço.

Para consulta online, abra a [documentação publicada](https://planejador-de-aulas-zowu.vercel.app/documentacao.html). Para consulta local, abra [DOCUMENTACAO.html](DOCUMENTACAO.html). Ambos incluem os doze capítulos desta edição. Use Imprimir → Salvar em PDF. Gere os arquivos com `node scripts/build-docs.js` e publique a saída `public/documentacao.html` para atualizar a página online.

Esta edição consolida Cursos → Unidades curriculares, modelos e ajustes por turma, importação por turma de origem, rascunhos, professores, busca de turmas, permissões por coordenador e os resultados atuais de validação. As auditorias antigas são preservadas como histórico e não representam uma nova execução de carga ou homologação física.

Estes documentos constituem a edição consolidada atual. Os demais guias desta pasta são complementos históricos: confirme suas instruções nesta edição antes de operar. Relatórios registram execuções específicas, não uma garantia sobre implantações futuras.

Ao alterar comportamento, atualize o manual e a referência correspondente; ao alterar endpoints, atualize API.md. Regenere o HTML com `node scripts/build-docs.js` e confira os links com `node scripts/check-docs.js`. Não inclua credenciais, códigos de alunos, QR de chaves, assinaturas ou backups reais.
