# Validação da versão mobile — 19/10/2026

Resultado: build aprovado, 163 testes de lógica/API e 19 suítes de interface aprovadas.

## Entrega

Versão web mobile com agenda em lista como padrão em telas pequenas; escolha entre Agenda e Mês preservada na sessão. Menu Mais com destinos derivados dos controles autorizados, atalhos inferiores e áreas seguras da tela. Ações secundárias da turma ficam acessíveis pelo menu no celular. Controles principais têm altura mínima de 44 pixels.

Ocupação diária em cartões por ambiente e turno para telas de até 620 pixels; a grade permanece no desktop e na impressão. Os cartões usam a mesma resposta autorizada da API, inclusive a ocultação de informações de outras pessoas definida pelo servidor.

Manifesto atualizado, ícone de tela inicial, metadados para iPhone e botão para o evento de instalação dos navegadores compatíveis. Orientação manual para Android/iPhone quando o evento não está disponível. Banner informa falta de conexão; a API não é adicionada ao cache do aplicativo.

## Verificações

- 320, 390 e 620 pixels, além do retorno à visualização desktop em 1280 pixels, sem transbordamento horizontal da página.
- Agenda como padrão no celular, preferência da sessão, navegação por Mais e atalhos.
- Cartões com os três turnos; filtros e exportações existentes preservados. Grade com muitos ambientes segue testada no computador.
- Temas claro e escuro com auditoria de acessibilidade WCAG 2 A/AA e 2.1 AA nas telas cobertas.
- Evento de instalação simulado, orientação sem evento, manifesto e ícones disponíveis. Nenhum aplicativo foi instalado em dispositivo real.
- Conexão interrompida e retomada no contexto do navegador de teste.
- Docente não recebe entradas de administração no menu de ambientes.
- Fluxo completo com login, cadastro, reserva, aprovação, reagendamento, QR codes, assinatura, notificações, exportações e acesso restrito do aluno, conforme as suítes existentes.

## Suítes de interface

- account-draft.ui.mjs: aprovada.
- ambientes.ui.mjs: aprovada.
- diagnostics.ui.mjs: aprovada.
- docentes.ui.mjs: aprovada.
- education-rules.ui.mjs: aprovada.
- environment-import.ui.mjs: aprovada.
- history.ui.mjs: aprovada.
- key-control.ui.mjs: aprovada.
- management-report.ui.mjs: aprovada.
- mobile-app.ui.mjs: aprovada.
- mobile.ui.mjs: aprovada.
- notifications.ui.mjs: aprovada.
- planning.ui.mjs: aprovada.
- recovery.ui.mjs: aprovada.
- search.ui.mjs: aprovada.
- turma-copy.ui.mjs: aprovada.
- ui.smoke.mjs: aprovada.
- whatsapp-integration.ui.mjs: aprovada.
- whatsapp-manual.ui.mjs: aprovada.

Os testes antigos da ocupação foram adaptados para conferir os cartões no celular e a grade no computador. O teste de calendário agora seleciona explicitamente Mês antes de verificar as sete colunas. A nova suíte mobile verifica Agenda como padrão e instalação orientada.

## Evidências e limites

Logs, interfaces.json e imagens nesta pasta. Imagens utilizam dados fictícios de teste. Testes executados no Microsoft Edge com larguras simuladas e bancos temporários locais, sem tocar nos dados de produção e sem enviar mensagens reais. Não houve teste em aparelho físico Android ou iPhone nesta execução. A versão ainda não foi publicada no site.
