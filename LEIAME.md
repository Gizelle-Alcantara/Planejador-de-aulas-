# Planejador de Aulas SENAI

A documentação atual está em **[docs/MANUAL-COMPLETO.md](docs/MANUAL-COMPLETO.md)** e **[docs/MANUAL-COMPLETO.html](docs/MANUAL-COMPLETO.html)**. Abra o HTML para ler com sumário ou imprimir. O [índice](docs/README.md) reúne os guias, a referência técnica e o checklist de homologação.

## Iniciar localmente

Use Node.js com suporte a `--env-file`, como Node.js 22, para estes comandos. Configure `.env` com ADMIN_PASSWORD, SESSION_SECRET e o banco escolhido; crie `data/` se usar SQLite local.

```bash
npm ci
npm run build
node --env-file=.env server.js
```

Acesse `http://localhost:3000/#login`. A raiz do projeto contém `package.json`; `public/` é saída de build. Na hospedagem, publique o projeto completo e use banco remoto. Não publique segredos. Para importação e restauração, leia o manual antes de executar os scripts.

## Testes

```bash
npm test
npx playwright install chromium
npm run test:ui
```

A versão com correções da auditoria passou em 67 testes automatizados e integração de navegador em bancos temporários. A agenda pública publicada foi consultada; fluxos autenticados e provedores reais da hospedagem do usuário não foram validados nessa consulta.

As abas Chamada e Alunos foram removidas. Dados antigos permanecem preservados. A confirmação ainda é por dia; novas funcionalidades por bloco não fazem parte desta edição.

## Conteúdo do pacote

`src/`: fonte da interface; `lib/`: API/regras/modelos; `scripts/`: build/importação/restauração; `public/`: saída; `api/` e `netlify/functions/`: hospedagem; `tests/`: testes; `docs/`: documentação; `banco/` e `dados-atuais/`: arquivos de origem preservados.

O banco JSON utilizado pela API e os arquivos relacionais de `banco/` têm estruturas diferentes. Novas colunas/identificadores da aplicação são migrados automaticamente. Após atualizar a versão de segurança, entre novamente.
