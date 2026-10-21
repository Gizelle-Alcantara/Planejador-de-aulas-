# Segurança, backup e recuperação

Edição: 19/10/2026. Descreve implementação e procedimentos; não é certificação jurídica ou auditoria independente.

## 1. Acesso

Contas usam scrypt/salt aleatório; mestre vem de ADMIN_PASSWORD. Cookie plan_sess assinado, HttpOnly, SameSite=Lax, Secure em HTTPS, até 12 horas. session_key permite invalidar conta após troca de senha/restauração. O servidor reconsulta perfil e vínculo. Tokens mestre carregam uma versão aleatória persistida no banco; a impressão da senha fica apenas no servidor e usa HMAC com SESSION_SECRET. Trocar a senha mestre invalida suas sessões na próxima requisição. Sessões mestre anteriores à atualização exigem novo login.

Mestre é coordenação com master. Coordenação comum não administra contas. As abas Dados, Publicação e Diagnóstico aparecem somente no acesso com a senha mestre; tentativas de abrir essas abas diretamente retornam ao Painel. Ambientes não recebe edição acadêmica geral. Docentes recebem projeções próprias; alunos, só sua turma. Não há MFA. Login comum, de aluno e do terminal possuem limite persistente de 10 tentativas por conta/código e 100 por IP em 15 minutos, com HTTP 429 e Retry-After. Sucessos limpam o contador da conta e descontam sua tentativa no contador do IP; tentativas em andamento também contam. O IP encaminhado deve ser definido por proxy confiável da hospedagem. Limites de recuperação/diagnóstico continuam específicos.

POSTs exigem Content-Type application/json, rejeitam Origin diferente da origem da requisição e Fetch Metadata cross-site/same-site. Clientes sem cabeçalhos de navegador podem usar JSON; não habilite CORS para origens externas. Não há token CSRF separado. HTTPS deve ser preservado na URL recebida pelo backend e pelo proxy.

## 2. Recuperação por e-mail

Requer provedor, PUBLIC_URL válida e e-mail cadastrado pelo mestre. Resposta genérica reduz exposição da existência da conta. Token aleatório tem hash armazenado, expira em 15 minutos, é de uso único e depende da versão de sessão.

Limites de solicitação: 5 por login e 50 por IP na janela de 15 minutos. Confirmação troca hash/salt/session_key e apaga token. Falha de envio invalida token preparado. Senha mestre é alterada na hospedagem. Não registre links/tokens reais em suporte.

## 3. Códigos, QR e assinaturas

Código de aluno: 20 caracteres hexadecimais aleatórios; banco guarda hash/versão. Troca/revogação encerra acesso anterior; não identifica matrícula individual. Restauração desativa códigos.

QR da chave: token aleatório de 64 caracteres hexadecimais; não substitui login. Não exponha em TV pública ou antes da identificação. No terminal autenticado, o QR é exibido somente para a alocação do próprio docente. Assinatura exige docente vinculado, propriedade, QR e aceite. Traços são normalizados/validados.

Comprovantes incluem identidade, data, movimento, referências, assinatura e hash encadeado. O encadeamento ajuda a conferir integridade; acesso total ao banco/código pode recalcular hashes. Não há carimbo externo, ICP-Brasil ou prova biométrica.

## 4. Proteção dos dados

Cadastros, contatos, assinaturas, reservas, contas e alunos exigem acesso controlado. Exportações deixam o controle da sessão: distribua em locais autorizados. Evite backups em repositórios e capturas públicas. API não é armazenada pelo service worker; instalação mobile não habilita edição offline.

Política institucional deve abranger exportações, cópias externas e histórico Git, além do banco. Revise contas periodicamente e revogue as indevidas.

## 5. Escopo de backup

| Tipo | Conteúdo |
|---|---|
| Completo v2 pelo mestre | Documentos, contas com hashes/salts/vínculos, notificações e controle de chaves quando presentes |
| Download por coordenação comum | Escopo reduzido, sem contas, notificações individuais ou controle de chaves |
| E-mail | Documentos; opção sem alunos; não equivale ao completo mestre |
| Legado v1 | Documentos compatíveis; não assumir contas/chaves completas |

Não inclui variáveis de ambiente, senha mestre, códigos de alunos ou cópias recursivas de backups. Confira versão e conteúdo, não só nome. Preserve configuração/infraestrutura por meio seguro separado.

Retenção interna: últimas 30 cópias e primeira de cada um dos 12 meses distintos mais recentes com cópias. Agendamento pode evitar cópia sem mudanças. Mantenha arquivo externo atualizado.

## 6. Restauração

1. Identifique motivo, banco, data do snapshot e registros que podem ser perdidos.
2. Gere backup completo atual e preserve configuração separadamente.
3. Ensaie em banco isolado.
4. Confira contas/vínculos, turmas, ambientes, reservas, chaves e comprovantes.
5. Execute na janela de manutenção autorizada pela interface ou script.
6. Entre novamente, gere novos códigos de aluno e execute aceite.
7. Registre operação e guarde cópia anterior.

Exemplo com ambiente de teste:

```powershell
node --env-file=.env.teste scripts/restore-backup.js caminho/backup-completo.json
```

O comando altera o banco configurado; não execute apenas para conferir sintaxe. O sistema gera cópia prévia e usa transação. v2 pode substituir o conjunto do snapshot/remover documentos e contas posteriores nos escopos incluídos. Restauração não é mesclagem livre.

## 7. Continuidade

### Terminal da secretaria

O painel `/secretaria-chaves.html` usa cookie HttpOnly/SameSite=Lax, Secure em HTTPS, exclusivo `plan_key_kiosk`, com token assinado de finalidade restrita e expiração de 5 minutos. Não reutiliza a sessão administrativa, aceita somente docentes e limita operações às próprias chaves. Após selecionar uma alocação, exibe o QR da chave e oferece assinatura no próprio terminal, sem celular. A API key_terminal_prepare exige sessão exclusiva do terminal, vínculo docente, propriedade e estado permitido. A confirmação continua exigindo assinatura desenhada, nome e aceite, e o comprovante registra method=terminal. Senhas não são gravadas pelo código em armazenamento local. O cliente limpa o conteúdo/assinatura ao encerrar e retorna ao início por conclusão ou inatividade.

Configurar perfil de navegador/equipamento dedicado, sem conta administrativa aberta ou salvamento de senhas. A separação dos cookies protege os fluxos da aplicação, mas não impede alguém de navegar manualmente para outra página com uma sessão administrativa já existente no mesmo perfil. **Tela cheia** é apresentação, não bloqueio do sistema operacional. O limite absoluto do servidor permanece mesmo se os temporizadores da página forem interrompidos.

Defina responsáveis, RPO (perda tolerável) e RTO (prazo de retorno) com a unidade e meça em ensaio. Agendamento diário não assegura esses compromissos sozinho. Registre quem administra hospedagem, banco, e-mail e cópias, sem escrever credenciais.
