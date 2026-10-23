# Documentação do Agenda SENAI

Edição: **19/10/2026**, baseada no código desta pasta e na implantação de referência `385c590361d9a7438c680fe315297bc71d4ba3fc`. A versão `1.0.0` do package.json não identifica sozinha uma implantação: registre também o commit e a data.

| Público | Documento |
|---|---|
| Coordenação, docentes, ambientes e alunos | [Manual completo](MANUAL-COMPLETO.md) |
| Administrador e coordenadores | [Cursos, modelos e vínculos de acesso](CURSOS-E-COORDENACAO.md) |
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

Para consulta no navegador e impressão, abra [DOCUMENTACAO.html](DOCUMENTACAO.html). Use Imprimir → Salvar em PDF. O HTML é um documento local; sua criação não publica uma nova página no sistema.

Estes documentos constituem a edição consolidada atual. Os demais guias desta pasta são complementos históricos: confirme suas instruções nesta edição antes de operar. Relatórios registram execuções específicas, não uma garantia sobre implantações futuras.

Ao alterar comportamento, atualize o manual e a referência correspondente; ao alterar endpoints, atualize API.md. Regenere o HTML com `node scripts/build-docs.js` e confira os links com `node scripts/check-docs.js`. Não inclua credenciais, códigos de alunos, QR de chaves, assinaturas ou backups reais.
