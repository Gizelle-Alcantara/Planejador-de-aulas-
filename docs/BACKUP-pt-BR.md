# Backup e restauração — versão atual

## 16. Backup, restauração e atualização

Backups agendados são criados se houve alterações. A retenção mantém as últimas 30 cópias e a primeira de cada mês dos últimos 12 meses. A lista da interface exibe até 60 registros. Cópias dentro do mesmo banco não substituem uma cópia externa.

| Tipo | Conteúdo e comportamento |
|---|---|
| Backup completo v2 pela senha mestre | Documentos, contas com hashes/salts/vínculos e notificações; não inclui senha mestre, variáveis de ambiente ou cópias recursivas de backups |
| Download por coordenação comum | Retira contas e notificações individuais do arquivo |
| Backup enviado por e-mail | Documentos; não envia credenciais das contas; opção sem alunos remove seus dados dessa cópia |
| Restauração v2 | Recupera o conjunto do snapshot e remove documentos/contas posteriores quando incluídos no escopo do arquivo |
| Backup antigo v1 | Compatibilidade com documentos; não equivale à restauração completa de contas |

Antes de restaurar, o sistema cria uma cópia do estado atual. A restauração é transacional; uma falha desfaz as mudanças. Sessões de contas restauradas exigem novo login. O histórico existente não é importado do arquivo e não deve ser confundido com a lista de backups.

Para um arquivo externo:

```bash
node --env-file=.env scripts/restore-backup.js caminho/backup-completo.json
```

Confira o destino, o arquivo e seu conteúdo antes de executar. Preserve as variáveis da hospedagem separadamente. Depois de restaurar, confira docentes, vínculos, ambientes, reservas, datas e exportações.

Para atualizar: gere backup externo; teste o pacote em banco separado; mantenha o banco e as variáveis de produção; atualize código/funções/modelos; faça build e implantação; entre novamente; valide os fluxos. Não altere manualmente identificadores para resolver problemas de vínculo.


As regras exatas de retenção e as tabelas estão em [REFERENCIA-TECNICA.md](REFERENCIA-TECNICA.md). A cópia enviada por e-mail não contém credenciais das contas. Não use instruções antigas de restauração v1 como se valessem para v2.
