# Preparação para publicação

Na aba **Publicação**, entre com a senha mestre e atualize a verificação. A consulta confere configuração, conexão com o banco e o último backup completo, sem criar ou restaurar dados automaticamente.

O backup precisa ser legível, ter o hash correto, corresponder aos dados atuais e ter até 48 horas. O botão **Criar backup completo** cria uma cópia no próprio banco; depois abra Dados para baixar e guardar uma cópia externa. Um hash correto não comprova que a restauração foi homologada.

## Checagem do pacote

Execute `npm run build` e depois `npm run check:publish`. Para Vercel/Netlify ou outra hospedagem sem servidor, execute `npm run check:publish -- --serverless`.

O comando usa as variáveis já definidas no processo, verifica os arquivos gerados e não acessa o banco nem serviços externos. Não imprime os valores de senhas, chaves, tokens ou endereços do banco. Ele retorna código 1 se houver bloqueios; alertas não alteram o código de saída.

Se as variáveis estiverem em `.env`, use `node --env-file=.env scripts/check-publication.js` (com `--serverless` quando aplicável). Não copie `.env` para `public/` nem inclua o arquivo em um pacote público.

## Homologação no destino

1. Configure as variáveis do destino, o domínio HTTPS e o banco persistente. Banco em arquivo local precisa de volume persistente; hospedagem sem servidor precisa do banco remoto.
2. Faça backup externo e restaure uma cópia em um banco isolado. Confira contas, vínculos, turmas, registros e reservas.
3. Execute os testes e siga o [checklist de validação](CHECKLIST-VALIDACAO.md), incluindo os quatro perfis, recuperação de senha, exportações e celular.
4. Homologue entrega real de e-mails e o agendador. A presença de credenciais não comprova envio ou execução do cron.
5. Só publique depois de avaliar os bloqueios, os alertas e os itens manuais. Esta etapa não faz deploy nem altera a hospedagem.
