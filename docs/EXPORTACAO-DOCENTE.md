# Excel no modelo anual do docente

A exportação usa o arquivo `Gizelle Karine Santos Alcantara.xlsx` enviado como referência, instalado em `lib/assets/calendario-docente-modelo.xlsx`. O arquivo enviado permanece intacto.

## Como baixar

1. Entre como coordenação e clique em **Exportar calendário**.
2. Na seção **Agenda anual do docente — modelo enviado**, escolha o docente e o ano.
3. Informe o vínculo, se conhecido, e clique em **Prévia do Excel do docente**. Confira a planilha e clique em **Baixar Excel**.

O docente autenticado também encontra o botão **Exportar calendário** na própria agenda e pode baixar somente o calendário vinculado à sua conta. O administrador de ambientes não acessa esta exportação. A exportação exige que os dados estejam salvos.

## O que vai para a planilha

- Cabeçalho do docente e e-mail cadastrado, logotipo e legenda do modelo.
- Uma aba anual com janeiro a dezembro, dias nas colunas e aulas de manhã, tarde e noite.
- Sigla da disciplina na linha da aula e turma na linha abaixo.
- Resumo com disciplina, sigla, carga horária, curso, turma, turno, início, fim, situação e aulas alocadas/pendentes.

As aulas do ano escolhido são reunidas de todas as turmas. Aulas marcadas como não realizadas são excluídas. Os lançamentos do ano são considerados mesmo quando estão fora do período configurado da turma. A carga horária no resumo é a carga completa da UC, enquanto aulas alocadas e datas refletem o ano exportado; disciplinas que atravessam anos podem ter pendências nesse resumo anual.

Quando a mesma sigla aparece em turmas diferentes, a exportação cria códigos curtos como `LOG.1` e `LOG.2`; o quadro inferior mostra a turma correspondente. O cadastro do sistema não é alterado.

A grade por horário atribui cada aula a uma disciplina. Duas UCs no mesmo dia, em posições diferentes, não produzem conflito na exportação. Lançamentos antigos sem grade ainda representam o turno inteiro; quando há disciplinas sobrepostas, a célula apresenta **CONFLITO** e conserva os códigos e as contagens. Redistribua esses dias no Calendário antes de usar o documento como programação final. Consulte `HORARIOS-POR-AULA.md`.

O modelo tem cinco linhas de manhã, cinco à tarde e quatro à noite. Se a programação precisar de mais linhas, elas são ampliadas com a mesma estrutura e as referências do resumo são ajustadas. Fevereiro e anos bissextos são tratados sem datas inexistentes.

## Dados e cálculos

Os dias disponíveis consideram segunda a sexta, feriados registrados nas turmas e bloqueios/indisponibilidades cadastrados no docente. Não são criados feriados ou férias ausentes no sistema.

O vínculo segue as regras do modelo: Mensalista = dias disponíveis × 8; Horista = 90; Intermitente = parte inteira de dias disponíveis × 8 × 0,909. Sem vínculo ou para RSA, capacidade e ocupação ficam em branco. O campo Meu SENAI fica em branco quando não estiver cadastrado; o e-mail pessoal do exemplo não é copiado para outros docentes.

Contagens, pendências, totais, capacidade, ocupação e situação são fórmulas. As datas de início e fim são preenchidas com os lançamentos salvos na exportação. Alterações no Excel não retornam ao sistema. Salas e reservas constam no Excel por turma, que continua disponível separadamente em **Prévia do Excel da turma**.

## Instalação e validação

Atualize os arquivos, execute `npm install` e `npm run build`, e reinicie o servidor pelo procedimento habitual. O recurso do modelo já está abrangido pelas configurações Vercel/Netlify existentes.

Os testes cobrem permissões, modelo e logotipo, turnos, ano bissexto, aulas canceladas, siglas repetidas, conflitos, sexto horário do NEM, mais de 35 disciplinas, ordem das células e tamanho das fórmulas. O fluxo do navegador verifica downloads pela coordenação e pelo docente. A conferência de recálculo em uma cópia isolada alterou a quantidade alocada de 8 para 7 e de volta para 8, com atualização das pendências. Microsoft Excel de desktop não foi executado neste ambiente.
