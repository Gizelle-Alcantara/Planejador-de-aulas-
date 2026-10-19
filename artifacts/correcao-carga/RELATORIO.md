# Correção das falhas sob carga — 19/10/2026

Resultado: a queda não voltou a ocorrer nas três rodadas de carga mista após a correção. A ocupação diária e as gravações em perfis separados também concluíram sem erros. Build, 163 testes de lógica/API e 18 suítes de interface aprovados.

## Alterações

O cliente local de SQLite/libsql transferia a conexão para cada transação e criava novas conexões para as operações seguintes. Esse caminho coincidia com encerramentos nativos do processo (código 3221225477), sem exceção JavaScript. Foi acrescentada uma camada para o banco em arquivo que reutiliza uma conexão e organiza o acesso por fila. Uma transação mantém acesso exclusivo até confirmar ou desfazer as alterações; consultas de outras requisições aguardam e não veem dados pendentes. O encerramento da transação também libera a fila caso a limpeza falhe.

A correção contorna o caminho que reproduzia a queda. Sem um rastreamento nativo, não se afirma qual função interna do driver provocava o encerramento. O cliente web usado no Turso não usa essa nova camada local.

A regressão de interface revelou ainda perda de campos no cadastro de contas durante atualizações da tela Acesso. O formulário existente agora é preservado nessas atualizações, inclusive durante o envio. Dados são mantidos quando o usuário já existe ou há falha; os campos são limpos depois do sucesso. As senhas não são copiadas para armazenamento persistente.

## Carga final isolada

Massa: 30 turmas, 20 docentes, 20 ambientes e 60 datas por turma. Servidor e gerador de carga na mesma máquina Windows, com Node v24.18.0 e banco temporário. Os demais testes já haviam terminado nessa rodada.

| Etapa | Requisições simultâneas | Requisições | Req/s | p95 | Erros |
| --- | ---: | ---: | ---: | ---: | ---: |
| Aquecimento | 2 | 384 | 191.21 | 14.2 ms | 0 |
| Leituras mistas | 1 | 364 | 60.59 | 26.9 ms | 0 |
| Leituras mistas | 10 | 931 | 154.08 | 115.7 ms | 0 |
| Leituras mistas | 25 | 943 | 155.00 | 307.9 ms | 0 |
| Leituras mistas | 50 | 1017 | 155.43 | 585.8 ms | 0 |
| Sustentação mixed | 50 | 4852 | 160.23 | 630.2 ms | 0 |
| Gravações em turmas distintas | 10 | 266 | 51.10 | 224.8 ms | 0 |

Total: 8757 requisições medidas, mais 25 edições concorrentes para conferir integridade. Sustentação de 30.28 segundos com 50 requisições em andamento, 4852 respostas e zero erros. p95 significa que 95% das requisições terminaram até aquele tempo.

Nas 25 edições da mesma revisão, uma foi aceita e 24 receberam o conflito HTTP 409 esperado. A revisão avançou uma única vez, o conteúdo vencedor foi conferido e as 30 turmas continuaram presentes. Não houve falha inesperada nas gravações em turmas distintas.

As rodadas anteriores corrigidas estão em rodada-1.json e rodada-2.json; a segunda incluiu sustentação de 30 segundos enquanto havia testes de interface em execução. ocupacao.json e gravacoes.json registram os perfis separados. As medições em paralelo não são usadas como comparação direta de desempenho com a rodada final isolada.

## Regressão

- Build aprovado.
- 163 testes de lógica e API aprovados, incluindo quatro novos testes da conexão local: exclusão entre leitura e transação, rollback, liberação da fila após erros e 200 transações em SQLite real.
- 18 suítes de interface aprovadas. O fluxo completo foi repetido após corrigir a perda de campos no cadastro.
- Teste específico do cadastro reproduz atualização com campos preenchidos, atualização com envio pendente, usuário duplicado e limpeza após sucesso; verifica ausência da senha no armazenamento local.
- Login, permissões, reservas, chaves, notificações, importação/exportações, EAD, relatórios, backup, recuperação, busca, acessibilidade e celular continuam cobertos pelas suítes existentes.

## Execução futura

npm run test:load executa a carga mista em uma nova instância local e banco temporário. npm run test:load:stability inclui a sustentação de 30 segundos. Perfis separados: node scripts/load-test.js --profile=board ou --profile=writes. Nenhum desses comandos aceita um endereço externo como alvo.

## Limites

Correções prontas localmente; nenhuma publicação feita nesta tarefa. Nenhum dado de produção foi utilizado ou alterado. Nenhum e-mail ou WhatsApp real foi enviado. O ensaio mede requisições HTTP concorrentes com sessão compartilhada, não usuários ativos completos. Os resultados não medem a capacidade da Vercel/Turso, nem substituem um ensaio prolongado em homologação. O período de sustentação desta rodada foi de 30 segundos.
