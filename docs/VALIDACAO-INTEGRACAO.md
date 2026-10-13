# Validação da versão — 12/10/2026

## Resultado
36 testes automatizados da API aprovados e teste de integração da interface aprovado em navegador Chromium, em computador e celular (390 × 844). Geração do site concluída.

## Verificações
- Login, contas, papéis e vínculo de docentes.
- Privacidade, histórico e proteção de edições concorrentes.
- Solicitação, aprovação, recusa, cancelamento e reagendamento.
- Bloqueios, sincronização e revisão de reservas afetadas pelo calendário.
- Corridas entre aprovações e alterações de calendário.
- Grade diária, notificações e leitura individual.
- Relatórios por ambiente e docente, com deduplicação de ocupações.
- CSV, impressão/PDF e layout móvel (sem transbordamento da página).
- Backup completo, recuperação de contas e vínculos, compatibilidade com cópias antigas e rollback de restauração inválida.
- As abas Chamada e Alunos permanecem removidas da navegação.

## Preservação
Os arquivos de banco/ e dados-atuais/ foram comparados byte a byte com o ZIP originalmente enviado e permanecem iguais. Todos os testes utilizaram bancos temporários isolados. Não foram criados registros de demonstração nos dados entregues.
Não houve publicação nem envio de mensagens externas. Os testes de serviços de e-mail e WhatsApp usam chamadas simuladas.

## Reproduzir
O teste de interface usa Playwright e exige Node.js 20 ou superior. O servidor mantém seu requisito Node.js 18+; para instalar somente as dependências de produção, use `npm ci --omit=dev`.
```bash
npm ci
npm test
npx playwright install chromium
npm run test:ui
```
O teste de interface inicia seu próprio servidor e banco temporário. A porta padrão é 3198; defina UI_TEST_PORT se estiver ocupada. Para usar um Chromium já instalado, informe BROWSER_EXECUTABLE_PATH.

## Limites
Teste visual e de fluxos realizado em Chromium; Safari e Firefox não foram testados. Serviços externos reais, hospedagem de produção e banco remoto Turso não foram exercitados nesta execução. Relatórios apresentam ocupação prevista, não confirmação de utilização.
