# Acessibilidade e uso no celular

- Link “Pular para o conteúdo”, idioma português do Brasil e identificação das regiões principais.
- Abas: Tab entra na aba selecionada; setas esquerda/direita, Home e End trocam as abas. O foco acompanha a seleção.
- Calendário: Tab entra nos dias; setas navegam (cima/baixo movem sete dias); Home e End levam ao início/fim. Na edição, Enter ou Espaço abre o dia. Datas completas e disciplinas são anunciadas pelos leitores de tela.
- Janelas de edição e exportação: foco inicial, contenção de Tab/Shift+Tab, Escape para fechar e retorno ao botão que abriu. O conteúdo de fundo fica inativo. Login também contém o foco e aceita Escape.
- Na entrada pública, escolha um mês antes de escolher aluno/docente. A escolha acompanha a navegação na sessão. No Painel da coordenação, “Abrir calendário” leva ao mês escolhido.
- Próxima aula ganha cartão de destaque e indicação escrita no calendário. Aulas registradas como não realizadas não aparecem na lista de próximas aulas.
- Até 620 pixels, os calendários do aluno e docente viram agendas em uma coluna. Cada dia mostra a data completa e as disciplinas sem truncamento. “Mostrar dias sem aula” permite consultar também os dias vazios.
- As próximas aulas aparecem em cartões no celular. Tabelas de disciplinas mantêm rolagem horizontal com foco pelo teclado. Botões e campos têm altura mínima de 44 pixels no celular.
- Temas claro/escuro mantêm texto independente das cores das disciplinas. Feriados, próxima aula e estados têm identificação escrita; o destaque não depende só da cor.

## Verificação

Execute `npm test` e `BROWSER_EXECUTABLE_PATH=/caminho/chromium npm run test:ui` (Node 20+ para as ferramentas de desenvolvimento).

O teste de interface usa banco temporário e verifica fluxos de reservas/exportação, teclado, foco de janela, escolha do mês, largura de 320 pixels e agenda em uma coluna. O axe verifica regras WCAG 2 A/AA e 2.1 AA nas visões do aluno, docente e calendário da coordenação, incluindo os temas claro/escuro do docente em várias larguras.

Esses testes automatizados não substituem uma sessão com NVDA ou VoiceOver nem comprovam conformidade integral. Recomenda-se validar com usuários de leitores de tela e dispositivos reais antes da publicação.
