# Validação da integração — 10/10/2026

## Resultado
27 testes automatizados aprovados e geração do site concluída.
Correção: gravações concorrentes usam comparação de revisão no UPDATE e criação protegida contra duplicidade. A edição perdedora recebe HTTP 409 com a versão atual e não cria histórico de uma edição que não foi salva.

## Preservação
Dados de dados-atuais/ e banco/ mantidos exatamente como no arquivo enviado. Nenhum aviso real enviado, nenhuma publicação realizada.

## Escopo verificado
API: login, papéis, privacidade dos visitantes, histórico, conflitos de versão, calendário ICS, avisos com serviços simulados, backups e restauração.
A interface visual e os serviços externos de produção não foram validados nesta etapa.

## Próxima etapa proposta
O pacote possui salas nas disciplinas e bloqueio de conflitos na interface. Agora possui cadastro próprio de ambientes e vínculo de contas aos docentes (guia: AMBIENTES-pt-BR.md). Agora também possui solicitação pelo professor e aprovação pela coordenação, com validação de conflitos; veja RESERVAS-pt-BR.md.
Implementar esses módulos exige definir o vínculo entre conta e docente, validar a disponibilidade no servidor e registrar as decisões, usando o calendário da coordenação como referência.
