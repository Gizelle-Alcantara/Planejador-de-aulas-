> Atualização: as falhas deste ensaio inicial foram tratadas e os cenários repetidos. Consulte [o relatório da correção](../correcao-carga/RELATORIO.md). Este documento preserva o diagnóstico anterior.

# Teste de carga — 19/10/2026

Resultado geral: **não aprovado**. Há uma queda intermitente do servidor local em cenários que acessam o banco. O teste não determina a capacidade do site publicado.

## Ambiente e método

Node v24.18.0, Windows, 13th Gen Intel(R) Core(TM) i5-13420H, 12 processadores lógicos e 8 GB de RAM. Cliente de carga e servidor na mesma máquina. Banco SQLite/libsql em arquivo temporário, criado exclusivamente para cada perfil. Nenhum dado ou segredo de produção foi utilizado; credenciais de teste foram geradas aleatoriamente. Sem chamadas ao WhatsApp, Resend ou Vercel.

Massa sintética: 30 turmas, 20 docentes, 20 laboratórios e 60 datas por turma, com quatro aulas por data. Uma sessão de coordenação compartilhada nas requisições. Esse cenário mede operações HTTP concorrentes, não pessoas navegando com tempos de leitura e sessões individuais.

Aquecimento previsto de 2 segundos; etapas de 6 segundos com 1, 10, 25 e 50 requisições em andamento. Gravações em 10 turmas distintas por 5 segundos e disputa de 25 edições sobre a mesma revisão. Requisições com limite de 15 segundos. O tempo de resposta inclui leitura completa do corpo e validação básica do conteúdo. Os perfis foram executados em sequência. Não é teste de longa duração nem estimativa de capacidade máxima.

## Etapas concluídas

| Operação | Requisições simultâneas | Requisições na etapa | Req/s | p95 | Resultado |
| --- | ---: | ---: | ---: | ---: | --- |
| Entrega da página HTML | 50 | 8143 | 1353.78 | 51.1 ms | Concluído, sem erros |
| Leitura autenticada dos calendários | 50 | 2416 | 392.22 | 164.0 ms | Concluído, sem erros |
| Gravações em turmas distintas, na repetição | 10 | 447 | 87.52 | 147.7 ms | Concluído, sem erros |

p95 é o tempo em que terminaram 95% das requisições. As medições das etapas aprovadas não incluem respostas de um servidor indisponível.

## Falha encontrada

A carga mista inclui a página HTML, leitura dos calendários, ocupação diária e notificações. O servidor encerrou com código **3221225477 (0xC0000005)**, sem registrar uma exceção JavaScript. Uma rodada encerrou ao chegar à etapa de 10 requisições simultâneas; a repetição encerrou ainda no aquecimento com 2 requisições simultâneas, depois de 239 tentativas, das quais 12 falharam. Isso mostra instabilidade e impede declarar uma capacidade segura.

O perfil isolado de ocupação diária completou aquecimento e etapa com 1 requisição simultânea; encerrou na etapa com 10. Uma primeira tentativa de gravações concorrentes também encerrou; a repetição completou 447 gravações sem erros. Portanto, o problema é intermitente. A causa ainda não foi comprovada. O encerramento sem exceção JavaScript é compatível com falha em componente nativo, mas isso é uma hipótese, não um diagnóstico confirmado.

Na rodada de gravações concluída, a disputa da mesma revisão teve **1 edição aceita e 24 conflitos HTTP 409 esperados**. A revisão avançou uma única vez, o conteúdo vencedor foi conferido e as 30 turmas continuaram presentes. Esses conflitos representam a proteção de edição funcionando, não erros de carga.

## Limites e próximo passo

Investigar primeiro o encerramento do processo no caminho local de banco e sincronização de reservas. Repetir os perfis após a correção, incluindo uma execução de longa duração. Em seguida, medir em ambiente de homologação com a mesma plataforma e banco remoto da produção: a Vercel usa o cliente web/Turso, diferente do banco nativo local usado aqui. Nenhuma conclusão de capacidade do site publicado pode ser feita com estas medições.

Nenhuma mudança foi feita na lógica do sistema nesta tarefa. Foram acrescentados o executor de carga e o comando npm run test:load. O executor aceita --profile=static, --profile=calendar, --profile=board, --profile=mixed e --profile=writes; sempre inicia seu próprio servidor e banco local, sem aceitar URL externa.

## Evidências

Cada subpasta contém resultado.json e servidor.log. Os dados completos registram p50, p95, p99, códigos HTTP, erros, duração e requisições por operação. O arquivo consolidado consolidado.json reúne a última execução de cada perfil. As primeiras tentativas de diagnóstico foram substituídas pelas repetições no respectivo perfil; o resultado anterior de carga mista também está em resultado.json na raiz desta pasta.
