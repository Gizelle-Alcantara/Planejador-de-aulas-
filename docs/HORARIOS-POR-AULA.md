# Divisão das aulas por horário

## Como distribuir o dia

1. Entre como coordenação e abra **Calendário**.
2. Com a ferramenta **Editar**, clique no dia.
3. Escolha a disciplina de cada aula. Por exemplo, em um turno de quatro aulas: LOG nas aulas 1 e 2; IHC nas aulas 3 e 4.
4. Deixe **Sem aula** nos horários não utilizados. Use **Preencher todas as aulas** para aplicar uma disciplina ao turno inteiro.
5. Clique em **Salvar** e aguarde a confirmação de gravação.

Os horários são os da configuração do turno. A quantidade vem de **Aulas por dia**, na aba Turma. A pausa do Matutino NEM e a divisão manhã/tarde do Diurno são consideradas. Configurações que fariam o turno ultrapassar a meia-noite precisam ser ajustadas antes de gravar a grade.

## Compatibilidade

Os registros antigos não são reescritos automaticamente: cada disciplina antiga continua representando o turno inteiro. Quando há várias disciplinas em um registro antigo, a janela mostra um aviso; confira a distribuição antes de salvar. A nova grade só é gravada quando você edita esse dia.

O calendário mensal e as tabelas continuam no padrão visual do site. No celular, os detalhes de horário estão na janela de edição e nas tabelas; a grade mensal permanece compacta.

## Carga horária e conflitos

A contagem da interface agora representa aulas individuais. LOG em dois horários acrescenta duas aulas à disciplina, não um turno inteiro. A carga em horas e a duração da hora-aula continuam sendo usadas para calcular o total exigido. O lançamento em lote usa essa mesma unidade e permite que o último dia fique parcialmente preenchido.

Duas UCs no mesmo dia, em horários diferentes, não são consideradas um choque. Conflitos de docente e ambiente são verificados somente quando há sobreposição dos horários. Bloqueios por data continuam valendo para o dia inteiro. A validação também ocorre no servidor, dentro da gravação transacional.

Ao renomear ou excluir uma sigla, suas referências na grade são atualizadas. Ao reduzir a quantidade de aulas do turno, ajuste antes os dias que já utilizam horários que seriam removidos.

## Reservas

A lista do docente apresenta os blocos efetivos de cada UC. Se a mesma disciplina aparecer em intervalos separados, escolha o bloco desejado; cada bloco pode ter uma reserva própria. Intervalos separados por pausas do turno também aparecem separadamente. Pedidos sem identificação do bloco são recusados quando há mais de uma possibilidade.

Reservas aprovadas ou pendentes que perderem o vínculo com a aula, ou tiverem seu horário alterado, passam para **revisão** conforme o fluxo existente. Aprovar um bloco não oculta os demais no painel diário.

## Exportações e avisos

- O Excel anual do docente preenche somente as posições de aula atribuídas àquela disciplina.
- O Excel da turma mostra os horários nos lançamentos divididos. A aba Encontros inclui quantidade de aulas, início e fim. O resumo desse modelo mantém encontros equivalentes: duas aulas em um turno de quatro equivalem a 0,5 encontro.
- HTML/PDF, CSV e agendas ICS usam os intervalos efetivos. Blocos separados geram eventos separados, com identificadores próprios.
- Avisos detectam mudanças de horário. Lembretes incluem todas as UCs do dia e os docentes correspondentes.

A confirmação de aula realizada permanece no formato existente por dia. A confirmação individual por docente/bloco é uma etapa futura; a divisão por horário não altera os registros antigos de realização ou faltas.

## Instalação e testes

Execute `npm install` e `npm run build`, depois reinicie o servidor. A construção gera `public/schedule.js` a partir de `lib/schedule.js`; as mesmas regras de horário são usadas no navegador e no servidor.

Os testes usam banco temporário e cobrem distribuição, compatibilidade, pausas, validação de grade, sobreposição entre turmas, reservas por bloco, revisão de reservas, painel diário, avisos e exportações. O teste de navegador grava duas UCs no mesmo dia, confere a contagem, os horários publicados ao docente e a acessibilidade da janela no celular.
