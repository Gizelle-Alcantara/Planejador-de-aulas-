# Entrega técnica — Agenda SENAI

Edição documental: 23/10/2026.

## 1. Identificação

| Item | Referência |
|---|---|
| Produto | Agenda SENAI / Planejador de aulas |
| Pacote | planejador-senai, versão declarada 1.0.0 |
| Código funcional documentado | f816e609a5dce02e3e04d58db4169cf8805b7ff0 (melhorias de cursos publicadas em 23/10/2026) |
| Aplicação | https://planejador-de-aulas-zowu.vercel.app/ |
| Repositório | https://github.com/Gizelle-Alcantara/Planejador-de-aulas- |
| Hospedagem em uso | Vercel com banco remoto |
| Documentação | Markdown editável e HTML para consulta/impressão |
| Consulta online | https://planejador-de-aulas-zowu.vercel.app/documentacao.html |

Referências refletem a edição, sem monitoramento contínuo. A publicação documental tem seu próprio commit; o código funcional de referência acima identifica o comportamento descrito. Esta edição não modifica regras nem dados do sistema.

## 2. Escopo

Turmas/docentes/disciplinas; calendário; busca; relatórios; histórico; perfis; alunos por código; Excel/HTML/PDF/ICS por permissão; prévia versionada; ambientes/manutenção/reservas; programação diária externa; importação Excel mestre; EAD paralela/Ambientação; QR de chaves com assinatura e comprovantes; Minhas chaves; notificações; WhatsApp manual; recuperação por e-mail implementada; mobile instalável; backup/diagnóstico/Publicação.

Cursos técnicos/rápidos com unidades curriculares, professores sugeridos e turmas; modelos copiados e ajustáveis por turma; atribuição de cursos a coordenadores e ativação explícita da restrição; importação de unidades a partir de turma escolhida; rascunhos com descarte/aviso ao sair; professores do modelo e das turmas; busca e atalhos de edição. Frequência mensal de horistas integrada às chaves, com validação e exportação conforme permissões.

## 3. Pendências e limites

| Item | Próximo passo |
|---|---|
| E-mail real | Última conferência registrada em 22/10 indicou ausência de configuração. Autorizar/verificar domínio, configurar RESEND_API_KEY/MAIL_FROM e testar entrega; esta revisão documental não reinspecionou o provedor |
| Backup externo | Houve download/restauração isolada e atualização de backup registrados em 22/10; manter cópia externa atualizada e repetir ensaio após alterações relevantes, sem presumir atualidade permanente |
| Celular físico | Conferir instalação, câmera e assinatura em Android/iPhone |
| Excel desktop | Conferir paginação/impressão no aplicativo da unidade |
| Produção | Carga local não estabelece limite de usuários da hospedagem |
| Continuidade | Definir responsáveis/RPO/RTO e ensaiar recuperação |

Não há APK nativo, MFA, edição offline sincronizada, certificado digital, presença física automática ou envio automático pelo WhatsApp pessoal. API Meta depende de configuração própria.

Validação funcional mais recente registrada: 191 testes de unidade/API aprovados; teste ampliado de cursos com permissões, rascunhos, importação e temas, além de regressões de Ambientação/EAD e móvel. A auditoria de carga anterior continua histórica; não foi repetida para esta edição. Consulte [Testes e aceite](TESTES-E-ACEITE.md).

## 4. Transferência

A unidade deve indicar responsáveis por hospedagem/banco, contas, ambientes/chaves, domínio/e-mail, backups e suporte. Transfira acessos por meio seguro e revise permissões. Não há credenciais pessoais neste pacote.

A equipe deve conseguir instalar isoladamente, gerar build, testar, publicar commit identificado e restaurar cópia de teste. Operadores devem conhecer o manual e canal institucional de suporte.

## 5. Encerramento

- Confirmar implantação/versão.
- Guardar backup completo externo e configuração separada.
- Registrar responsáveis e suporte.
- Executar aceite de perfis/dispositivos utilizados.
- Registrar pendências aceitas, inclusive e-mail.
- Entregar [índice](README.md), manual, arquitetura, API e recuperação.

Aceite institucional deve ser registrado pelo responsável; este documento não presume aprovação em seu nome.
