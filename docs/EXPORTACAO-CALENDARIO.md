# Exportar calendário e voltar

## Onde exportar
Abra o planejador, escolha a turma no cabeçalho e clique em **Exportar calendário**. A mesma ação também fica na aba **Enviar**.

Escolha um formato:
- **Baixar Excel no padrão SENAI**: gera `.xlsx` na estrutura da planilha original, com cabeçalho, logo, dias em colunas, disciplina, instrutor, sala/laboratório e quadro de unidades curriculares.
- **Imprimir / salvar calendário em PDF**: abre o calendário mensal com cabeçalho SENAI, disciplinas, docentes e ambientes. No diálogo de impressão, escolha **Salvar como PDF**.
- **Baixar calendário mensal (HTML)**: salva a página do calendário para abrir no navegador e imprimir depois.

A exportação Excel usa os dados salvos no servidor e exige uma conta autenticada. Aguarde a indicação de que os lançamentos estão salvos antes de baixar. Ambientes de reservas aprovadas substituem a sala daquela aula no arquivo exportado.

## Lançamentos fora do período
Se existirem aulas fora das datas cadastradas na aba Turma, a janela mostra a quantidade de datas e a opção **Incluir lançamentos fora do período configurado**, selecionada inicialmente.
Com a opção selecionada, somente o período do arquivo exportado é ampliado para incluir os lançamentos. O cadastro e as datas da turma no sistema permanecem iguais. Desmarque para exportar apenas o intervalo configurado.

## Organização do Excel
A estrutura original tem 14 blocos mensais. Períodos maiores recebem abas adicionais, com meses consecutivos e sem repetir os dias. Meses fora do período exportado ficam ocultos; fevereiro e anos bissextos são ajustados. O quadro de disciplinas pode crescer além das 18 linhas originais.
A aba **Encontros** contém os registros detalhados e é a fonte das fórmulas de contagem. O resumo de unidades curriculares em cada bloco corresponde à turma inteira exportada; não some o mesmo resumo entre abas.
O arquivo é uma cópia do calendário: edições feitas no Excel não alteram automaticamente o sistema.

## Botão Voltar
- No cabeçalho do planejador, **Voltar** retorna à aba anterior; sem histórico, retorna ao Painel.
- Na janela de exportação, **Voltar** fecha a janela e mantém a aba atual.
- Na prévia PDF/HTML, **Voltar** retorna à janela do sistema; no HTML aberto como arquivo, abre o calendário do sistema.
- Na gestão de ambientes, **Voltar** abre o calendário da coordenação, a agenda do docente ou a visão de leitura do administrador de ambientes.

## Instalação desta atualização
Após atualizar os arquivos do projeto, execute `npm install` e `npm run build`. Reinicie o servidor pelo procedimento habitual, preservando a configuração do banco e do arquivo `.env`.
O modelo Excel fica em `lib/assets/calendario-senai-modelo.xlsx`; as configurações Vercel/Netlify incluem esse recurso no pacote da função.

## Validação
41 testes automatizados (API e exportação) aprovados; fluxo de navegador com downloads Excel/HTML, impressão PDF e retorno por perfil aprovado. Arquivo Excel importado, recalculado e renderizado para conferência; contagem verificada com alteração temporária de 2 para 1 e de volta a 2 encontros em uma cópia isolada.
O arquivo não foi aberto no aplicativo Microsoft Excel de desktop nesta execução. A revisão visual utilizou o renderizador de planilhas e a impressão PDF do Chromium. Hospedagens remotas não foram publicadas nem exercitadas.
