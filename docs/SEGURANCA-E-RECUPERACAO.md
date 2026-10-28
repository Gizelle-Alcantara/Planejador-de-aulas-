# Segurança, backup e recuperação

Edição: 28/10/2026. Descreve implementação e procedimentos; não é certificação jurídica ou auditoria independente.

## 1. Acesso

Contas usam scrypt/salt aleatório; mestre vem de ADMIN_PASSWORD. Cookie plan_sess assinado, HttpOnly, SameSite=Lax, Secure em HTTPS, com limite absoluto de 1 hora para o master e 12 horas para as contas comuns. A atividade não prorroga esse prazo. O servidor valida a emissão e expiração do token master e rejeita os tokens antigos de 12 horas. session_key permite invalidar conta após troca de senha/restauração. O servidor reconsulta perfil e vínculo. Tokens mestre carregam uma versão aleatória persistida no banco; a impressão da senha fica apenas no servidor e usa HMAC com SESSION_SECRET. Trocar a senha mestre invalida suas sessões na próxima requisição. Sessões mestre anteriores à atualização exigem novo login.

Mestre é coordenação com master. Coordenação comum não administra contas. Histórico, comparação de versões, restauração e todas as operações backup_* exigem master no servidor, inclusive para coordenadores com acesso global. As abas Dados, Publicação e Diagnóstico aparecem somente no acesso com a senha mestre; tentativas de abrir essas abas diretamente retornam ao Painel. Ambientes não recebe edição acadêmica geral. Docentes recebem projeções próprias; alunos, só sua turma. O master pode ativar autenticação em dois fatores na aba Acesso. Login comum, de aluno e do terminal possuem limite persistente de 10 tentativas por conta/código e 100 por IP em 15 minutos, com HTTP 429 e Retry-After. Sucessos limpam o contador da conta e descontam sua tentativa no contador do IP; tentativas em andamento também contam. O IP encaminhado deve ser definido por proxy confiável da hospedagem. Limites de recuperação/diagnóstico continuam específicos.

POSTs exigem Content-Type application/json, rejeitam Origin diferente da origem da requisição e Fetch Metadata cross-site/same-site. Clientes sem cabeçalhos de navegador podem usar JSON; não habilite CORS para origens externas. Não há token CSRF separado. HTTPS deve ser preservado na URL recebida pelo backend e pelo proxy.

### Dois fatores do administrador master

Na aba Acesso, informe a senha mestre atual, clique em Configurar autenticador e escaneie o QR em um aplicativo autenticador (ou cadastre a chave manualmente). Confirme o primeiro código de seis dígitos dentro de 10 minutos. Somente essa confirmação ativa o segundo fator. Guarde os dez códigos de recuperação antes de sair da tela: são exibidos uma única vez, cada um pode ser usado uma vez e sempre exige também a senha mestre.

O login solicita o segundo fator somente depois de validar a senha mestre. O código TOTP usa SHA1, seis dígitos, janela de 30 segundos e tolerância de um intervalo em cada direção, conforme RFC 6238. Códigos já aceitos não podem ser reutilizados, inclusive em requisições concorrentes. Se acabou de usar um código, aguarde o próximo no aplicativo. Um código de recuperação substitui o TOTP no login. Para trocar de aparelho, use um código de recuperação para entrar e outro código ainda não usado para desativar; depois configure o novo autenticador e guarde os novos códigos.

Configuração e desativação exigem sessão master, senha mestre atual e limite de tentativas persistente. A desativação também exige TOTP ou recuperação. A ativação e a desativação revogam as outras sessões master; a sessão que confirmou recebe um cookie novo de uma hora. As outras contas não usam este segundo fator.

A tabela master_mfa guarda a chave com AES-256-GCM e uma chave derivada de SESSION_SECRET; recuperação fica somente como HMAC. Não altere SESSION_SECRET sem planejar a migração do segundo fator: essa variável também é necessária para descriptografar o autenticador. Faça backup seguro da configuração da hospedagem. A troca de ADMIN_PASSWORD não remove o segundo fator. Se perder o celular e todos os códigos, a recuperação exige o responsável pela hospedagem/banco; não há desativação pública por e-mail.

O estado MFA não faz parte das exportações da aplicação e não é substituído ao restaurar documentos e contas, evitando que um backup antigo desative a proteção. Na recuperação de um banco novo, configure o segundo fator antes de liberar a administração. Backups completos do banco pelo provedor devem preservar master_mfa e auth_state. Nenhuma chave ou código vai para logs ou armazenamento local do navegador.

Referência: https://www.rfc-editor.org/rfc/rfc6238

### Escopo de cursos

O administrador atribui cursos por conta de coordenação em user_courses e ativa a proteção com course_enable. Antes da ativação, os acessos existentes são preservados; os modelos ficam em consulta para coordenadores comuns. Depois, users.course_ids define os cursos autorizados. O servidor reconsulta a lista por requisição, inclusive para sessões anteriores, e a interface detecta mudanças e recarrega. Lista vazia não autoriza turmas. O administrador mantém todos os cursos.

Leitura, gravação individual/lote, exclusão, códigos de alunos, planejamento, exportação de turma e relatórios verificam o curso. Lotes com itens proibidos são recusados integralmente. Conflitos entre cursos continuam sendo verificados sem expor a turma protegida na mensagem. Coordenadores restritos não usam operações globais de cadastros, ambientes, frequência, avisos, contas, backups ou exportação de docente; perfis próprios de docente/ambientes/aluno conservam suas regras.

O catálogo cursos não pode ser sobrescrito por set, excluído por delete ou restaurado pelo histórico genérico. Atualizações passam pelas operações de cursos; conflitos de modelo retornam revisão, sem conteúdo de outros cursos. Consulte o [guia de cursos](CURSOS-E-COORDENACAO.md) e a [API](API.md).

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
| Completo v2 pelo administrador | Documentos, incluindo modelos de cursos; contas com hashes/salts e vínculos docentes/de cursos; notificações, controle de chaves e folhas de frequência quando presentes |
| Download por coordenação antes da ativação por curso | Escopo reduzido, sem contas, notificações individuais, controle de chaves ou folhas de frequência |
| Coordenação restrita por curso | Operações globais de backup/download/restauração recusadas; solicitar ao administrador |
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

Backups completos incluem os modelos e users.course_ids. Restaurar contas encerra as sessões afetadas. Backups antigos sem vínculos de cursos restauram as contas com lista vazia; se a proteção estiver ativa, o administrador deve atribuir os cursos novamente antes do uso pela coordenação. Inclua esse cenário no ensaio isolado.

## 7. Continuidade

### Terminal da secretaria

O painel `/secretaria-chaves.html` usa cookie HttpOnly/SameSite=Lax, Secure em HTTPS, exclusivo `plan_key_kiosk`, com token assinado de finalidade restrita e expiração de 5 minutos. Não reutiliza a sessão administrativa, aceita somente docentes e limita operações às próprias chaves. Após selecionar uma alocação, exibe o QR da chave e oferece assinatura no próprio terminal, sem celular. A API key_terminal_prepare exige sessão exclusiva do terminal, vínculo docente, propriedade e estado permitido. A confirmação continua exigindo assinatura desenhada, nome e aceite, e o comprovante registra method=terminal. Senhas não são gravadas pelo código em armazenamento local. O cliente limpa o conteúdo/assinatura ao encerrar e retorna ao início por conclusão ou inatividade.

Configurar perfil de navegador/equipamento dedicado, sem conta administrativa aberta ou salvamento de senhas. A separação dos cookies protege os fluxos da aplicação, mas não impede alguém de navegar manualmente para outra página com uma sessão administrativa já existente no mesmo perfil. **Tela cheia** é apresentação, não bloqueio do sistema operacional. O limite absoluto do servidor permanece mesmo se os temporizadores da página forem interrompidos.

Defina responsáveis, RPO (perda tolerável) e RTO (prazo de retorno) com a unidade e meça em ensaio. Agendamento diário não assegura esses compromissos sozinho. Registre quem administra hospedagem, banco, e-mail e cópias, sem escrever credenciais.
