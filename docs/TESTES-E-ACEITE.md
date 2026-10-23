# Testes, homologação e aceite

Edição: 23/10/2026. Código funcional de referência: f816e609a5dce02e3e04d58db4169cf8805b7ff0. Resultados valem para o código e ambiente de cada execução; histórico não equivale a nova homologação.

## 1. Execução

Use banco separado e contas fictícias. Os testes fornecidos criam cenários locais descartáveis. Não envie mensagens ou registre assinaturas reais durante homologação.

```powershell
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:ui
```

Alternativa Windows, ajuste o caminho ao Edge instalado:

```powershell
$env:BROWSER_EXECUTABLE_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run test:ui:mobile-app
npm run test:ui:keys
```

Instalar navegador pode exigir rede/dependências de sistema. A suíte UI padrão não roda automaticamente todas as demais.

## 2. Matriz de comandos

| Área | Scripts npm run |
|---|---|
| API/domínio | test |
| Fluxos gerais/axe | test:ui |
| Docentes/ambientes | test:ui:docentes, test:ui:ambientes |
| EAD/Ambientação | test:ui:education |
| Importação | test:ui:environment-import |
| Chaves/QR/assinatura | test:ui:keys |
| Painel compartilhado da secretaria | test:ui:kiosk |
| Mobile/instalação | test:ui:mobile, test:ui:mobile-app |
| WhatsApp | test:ui:whatsapp |
| Recuperação | test:ui:recovery |
| Busca/cópia/histórico | test:ui:search, test:ui:copy, test:ui:history |
| Avisos/planejamento | test:ui:notifications, test:ui:planning |
| Relatórios/diagnóstico | test:ui:reports, test:ui:diagnostics |
| Formulário de conta | test:ui:accounts |
| Cursos, modelos e acesso por coordenador | test:ui:courses |
| Carga/concorrência local | test:load:stability |

Use testes pertinentes à mudança; em entrega ampla, rode a matriz completa. Os arquivos tests/*.test.mjs e *.ui.mjs contêm cenários e asserções; package.json lista os comandos efetivos.

## 3. Última auditoria registrada

### Validação mais recente — melhorias de cursos (23/10/2026)

Build aprovado e **191 testes de unidade/API em 26 arquivos aprovados, sem falhas**. O teste ampliado de cursos cobre criação/edição do modelo, maiúsculas e siglas duplicadas, rascunho entre seções, remoção/descarte, consulta sem permissão, vínculo/ativação/revogação por coordenador, criação de turma, importação sem alterar a origem, professores, busca e ajustes por turma. As seções Unidades curriculares, Professores e Turmas foram verificadas nos temas claro e escuro e em larguras de 320, 768 e 1280 px; auditoria automatizada WCAG 2 A/AA e 2.1 AA sem violações nesses cenários. Regressões de Ambientação/EAD e navegação móvel aprovadas.

Evidências locais: artifacts/cursos/melhorias-testes.log, melhorias-ui.log, melhorias-ead.log, melhorias-mobile.log e melhorias/VALIDACAO.md. Usam dados fictícios e bancos temporários. Esta execução não repetiu a auditoria de carga nem substitui testes em celulares físicos, câmera, envio real de e-mail ou Excel desktop.

Após publicar f816e609, a implantação Vercel foi concluída e foram conferidos os arquivos JavaScript/CSS e a API anônima em produção. Não havia sessão administrativa no navegador nessa conferência, portanto os fluxos privados em produção não foram novamente homologados; foram testados em ambiente isolado. A atualização documental valida geração, conteúdo, links e publicação da documentação, sem alegar uma nova execução dos 191 testes.

### Auditoria histórica — edição de 19/10/2026

Antes da publicação de referência: build aprovado, **163 testes de unidade/API em 21 arquivos**, **19 suítes UI** e **30.822 requisições medidas de carga local sem erros/falhas de processo**. Estágio sustentado: 50 requisições HTTP concorrentes, 30,11 s, 624,12 req/s, p95 152,1 ms. Concorrência de revisão: uma gravação aceita e 24 conflitos esperados para 25 tentativas.

Isso descreve carga local com sessão compartilhada, não capacidade garantida da Vercel/Turso ou 50 usuários reais. Evidências locais: artifacts/auditoria-final/RELATORIO.md, consolidado.json, interfaces.json, carga.json.

Na publicação foram conferidos Minhas chaves com sessão docente, ausência de administração de chaves, ação de devolução existente e scripts mobile/WhatsApp carregados. Não se fizeram movimentos reais, assinaturas ou envios. Arquivos baixados foram inspecionados tecnicamente; impressão no Excel desktop continua sendo validação específica.

## 4. Aceite por perfil

| Perfil | Critérios |
|---|---|
| Mestre | Contas, vínculos, diagnóstico, Publicação e backup completo |
| Coordenação | Antes da ativação, acessos legados e consulta dos modelos; depois, somente cursos vinculados, com leitura/escrita/exportação/histórico limitados e recusa de operações globais |
| Ambientes | Manutenção, sala, decisão de reserva, Excel/HTML diário e alocação de chave |
| Docente | Própria agenda, laboratório no pedido, próprias reservas/Minhas chaves, sem administração |
| Aluno | Só turma do código, sem escrita/gestão/exportações de API |

### Cenários de negócio

1. Salvar/recarregar programação e conferir persistência.
2. Criar conflito em teste e conferir resposta sem gravação parcial de lote.
3. Lançar Ambientação antes do período e EAD paralela sem ambiente.
4. Aprovar reserva e conferir ambiente efetivo sem dupla contagem.
5. Alterar aula reservada e conferir revisão/aviso.
6. Importar Excel: prévia, inválidos, aplicação e revisão antiga.
7. Em teste, alocar, retirar com QR/assinatura e devolver; negar QR errado, conta alheia e retirada futura.
8. Exportar programação planejada com reservas/bloqueios.
9. Restaurar backup de teste e conferir contas, vínculos, chaves e comprovantes.
10. Atribuir cursos a duas contas, ativar restrições e confirmar isolamento, conta sem curso, alteração de vínculo com sessão aberta e recusa de turma alheia por URL/API.
11. Importar unidades de uma turma do curso com outro curso ativo no cabeçalho; conferir que modelo só muda ao salvar e que a turma de origem não muda.
12. Editar rascunho, alternar seções, descartar ou salvar; rejeitar siglas duplicadas sem perder campos. Ajustar uma turma e conferir que o modelo e outras turmas permanecem iguais.

### Dispositivos e serviços

Conferir Android/iPhone reais: instalação, navegação, câmera, QR, assinatura, orientação, contraste e teclado. Viewport/axe não comprovam câmera física.

E-mail real exige domínio verificado e destinatário de teste autorizado. Conferir recuperação, uso único/expiração e falha de envio. WhatsApp manual: conferir conversa/texto, mantendo envio com o responsável.

## 5. Registro

Validação adicional do painel em 20/10/2026: build e 168 testes de API/domínio aprovados, incluindo 5 testes do novo modo de sessão. Suítes UI de painel e chaves verificam isolamento de cookies, restrição a docente, dados pessoais ausentes antes do login, filtros de retirada/devolução, QR/assinatura, saída após conclusão e inatividade, temas, responsividade e acessibilidade. Os cenários usam contas, assinaturas e banco fictícios; não movimentam chaves reais.

Registre data, commit, URL/ambiente, Node/navegador, banco isolado, comandos/resultados, cenários manuais, pendências, responsável e liberação. Não inclua senhas, tokens, códigos ou assinaturas reais.
