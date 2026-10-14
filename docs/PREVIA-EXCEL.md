# Prévia do Excel

> Guia especializado. Resultados de testes deste documento registram etapas anteriores. Para permissões, instalação e regras atuais, consulte o [Manual completo](MANUAL-COMPLETO.md), edição de 13/10/2026.


1. Abra **Exportar calendário** e escolha as opções da turma ou do docente.
2. Clique em **Prévia do Excel da turma** ou **Prévia do Excel do docente**.
3. Escolha a planilha, o mês e o zoom. Role a tabela para conferir todos os horários e o resumo.
4. Clique em **Baixar Excel**.

A prévia lê as células, valores calculados, cores e mesclagens do XLSX gerado pelo servidor. A apresentação no navegador adapta texto e contraste para leitura; imagens e todos os detalhes de impressão do Excel não são reproduzidos. O arquivo baixado preserva o modelo original.

**Voltar às opções** preserva as escolhas. **Atualizar prévia** consulta os dados atuais. Se o calendário mudar após a conferência, o download é bloqueado até atualizar a prévia. Alterações locais precisam estar salvas antes de abri-la.

O docente acessa somente o próprio calendário. A coordenação mantém seu acesso às turmas e aos docentes; o perfil de ambientes não acessa esta exportação. A prévia é somente para conferência, sem edição das células.

## Quando a prévia não abre
A mensagem de erro aparece na própria janela. Quando disponível, use **Baixar Excel sem prévia** para gerar o arquivo diretamente com as opções selecionadas. Essa alternativa mantém as permissões e exige dados salvos. Atualize o projeto inteiro e faça nova implantação para receber a correção; substituir apenas o HTML não atualiza a API.

O código da prévia acompanha a página gerada. O botão mostra **Preparando prévia…** durante a consulta e volta a ficar disponível ao retornar às opções.
