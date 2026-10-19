# Atualização da publicação — 17/10/2026

Site: https://planejador-de-aulas-zowu.vercel.app/

## Correção aplicada

O repositório conectado à Vercel continha arquivos gerados atuais e fontes antigos. O build recriava a interface a partir desses fontes e removia parte das melhorias. Foram sincronizados 19 arquivos divergentes, preservando os demais arquivos do repositório.

- Repositório: `Gizelle-Alcantara/Planejador-de-aulas-`, branch `main`.
- Commit anterior: `4f35d921ad3efc307ed5c700012c9beeb66a12f8`.
- Commit publicado: `d9f202237a3022157ce46914a4915375726f0193`.
- Deploy inicial aprovado: https://vercel.com/gizellereis-7743s-projects/planejador-de-aulas-zowu/B3eAStjtXfQyPmuji7i7QXtAqXu8
- Redeploy de produção aprovado, com PUBLIC_URL: https://vercel.com/gizellereis-7743s-projects/planejador-de-aulas-zowu/Bmb8BKGacyBCerGG8MBcWMPbbdTK

## Validação após o deploy

Os 19 arquivos públicos comparados têm conteúdo idêntico ao build local, por SHA-256. Os resultados atuais estão em `publicacao-apos-deploy.json`. O arquivo `publicacao.json` e as cópias `publicado-*` foram atualizados pela nova execução; o relatório inicial `RELATORIO.md` descreve o estado anterior à correção e deve ser lido como histórico.

Na sessão autenticada do site, foi confirmado:

- Docentes: cinco cartões, cinco áreas de cadastro recolhidas e nenhuma tabela na aba.
- Ambientação: o aviso incorreto da aula anterior ao período deixou de aparecer na turma conferida.
- EAD: seis citações compactas na visualização conferida, com indicação de atividade online.
- Ambientes: controle de chaves carregado, cadastro de chaves e alocação disponíveis, importação de Excel disponível ao administrador e exclusão de ambientes presente.
- Notificações: exclusão individual disponível e verificação automática de novos avisos ativa.
- Programação diária: painel HTML para TV/totem e Excel diário baixados para 19/10/2026.
- Excel diário: arquivo OOXML válido, com oito linhas de planilha na exportação conferida.
- Painel HTML: contém logo embutida e rotação automática, sem chamadas de API para sua apresentação.
- Modelo de importação: planilha `.xlsx` baixada com sucesso.
- Requisições de consulta protegidas continuam recusando acesso sem autenticação.

O teste de assinatura, cadastro e movimentação de chaves com dados de teste permanece validado nas suítes locais. Não foram criadas chaves ou assinadas movimentações fictícias no banco de produção.

## Backup e configuração

Antes da publicação, foi baixado e validado `C:/Users/gizel/Downloads/backup-completo-2026-10-17.json`, versão 2, com oito documentos, quatro contas e 22 notificações. O backup não foi enviado ao repositório nem incluído no pacote de publicação.

`PUBLIC_URL` foi cadastrado como configuração de Production com o endereço HTTPS definitivo. O redeploy para aplicar essa variável foi concluído com status Ready.

O usuário concluiu a atualização de `SESSION_SECRET` e o cadastro de `CRON_SECRET`, sem compartilhar seus valores. As duas variáveis foram conferidas apenas por nome e ambiente na Vercel.

O redeploy de segurança foi concluído com status Ready em Production:
https://vercel.com/gizellereis-7743s-projects/planejador-de-aulas-zowu/72w9GGtmH9H2AVhQvKthsHFyPAAr

A sessão anterior do sistema foi encerrada após a troca da chave, como esperado. Após o novo login do usuário, a checagem autenticada da aba Publicação foi executada novamente em 17/10/2026 às 18:00, horário de Brasília: **zero bloqueios automáticos, oito itens conferidos e um alerta**. Chave das sessões, endereço público, configuração do agendamento, banco e backup foram aprovados pelas verificações automáticas. Os valores secretos não foram revelados nem lidos.

Depois do redeploy, o site respondeu HTTP 200; a API anônima retornou usuário nulo e zero documentos; o agendador sem autenticação retornou HTTP 401. A execução real do agendamento não foi antecipada nem disparada manualmente.

E-mail permanece opcional e não configurado: entrega real e recuperação por e-mail exigem `RESEND_API_KEY` e `MAIL_FROM` válidos.

O único alerta remanescente é de recuperação e avisos por e-mail. A execução efetiva do cron no horário agendado, a entrega de e-mails e a homologação manual com todos os perfis não são comprovadas pela checagem automática de configuração.

## Evidências

- `chaves-publicadas.png`: controle de chaves no site atualizado.
- `publicacao-sem-bloqueios.png`: resultado autenticado final, com zero bloqueios automáticos.
- `publicacao-apos-deploy.json`: comparação dos arquivos após o deploy.
- `RELATORIO.md`: auditoria anterior e testes locais (155 testes e 15 suítes de interface aprovados após reteste de notificações).
