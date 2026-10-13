# Avisos automáticos por e-mail e WhatsApp

O sistema monta e envia dois tipos de aviso por turma:
- **Alterações do calendário:** todo dia às 20h (horário de Salvador), se algo mudou de hoje em diante (aula nova, cancelada, trocada, não dada, reposição, feriado).
- **Lembrete de véspera:** às 20h do dia anterior a cada aula, para alunos e para o docente daquela aula.

Também há **aviso imediato** (botão *Avisar agora*) e **mensagem livre**, na aba **Avisos**. Tudo fica no histórico, com falhas registradas.

> Sem as chaves abaixo, o sistema funciona em **modo simulado**: monta, conta destinatários e registra, mas nada é enviado. A aba Avisos mostra esse alerta.

## 1. Quem recebe
- **Alunos:** e-mail e WhatsApp na aba *Alunos* (preencha só com autorização do aluno ou do responsável, conforme a LGPD).
- **Docentes:** e-mail e WhatsApp na aba *Docentes*.
- **Lista extra:** e-mails da aba *Enviar*.
Na aba *Avisos* você escolhe o canal (e-mail, WhatsApp ou ambos) e quais grupos recebem. Visitantes dos links públicos nunca recebem esses contatos.

## 2. E-mail (Resend)
1. Crie conta em **resend.com** e, em *Domains*, adicione e verifique o domínio de onde os e-mails sairão (cadastre os registros DNS que ele mostrar).
2. Em *API Keys*, crie uma chave.
3. Cadastre no servidor (Vercel/Netlify → variáveis de ambiente):
   - `RESEND_API_KEY` = a chave
   - `MAIL_FROM` = `Calendário SENAI <avisos@seudominio.com.br>`
4. Faça novo deploy. O plano gratuito tem limite diário de envios: confira na página de preços do Resend se atende ao tamanho das suas turmas.

## 3. WhatsApp (API oficial da Meta)
O WhatsApp só permite que uma empresa inicie conversa com **modelos de mensagem aprovados**. Por isso o sistema usa um modelo com **uma variável**.
1. Em **business.facebook.com** crie (ou use) uma conta Meta Business e, em **developers.facebook.com**, um app do tipo *Business* com o produto **WhatsApp**.
2. Adicione e verifique o número que enviará os avisos (um número que não esteja em uso no app comum do WhatsApp).
3. Em *WhatsApp Manager → Modelos de mensagem*, crie o modelo:
   - Nome: `aviso_calendario` · Idioma: Português (BR) · Categoria: *Utilidade*
   - Corpo: `Aviso do SENAI: {{1}}`
   - Envie para aprovação (costuma ser rápido).
4. Gere um **token permanente** (Configurações do negócio → Usuários do sistema → gerar token com a permissão `whatsapp_business_messaging`).
5. Cadastre no servidor:
   - `WHATSAPP_TOKEN` = o token
   - `WHATSAPP_PHONE_ID` = o *Phone number ID* (aparece em WhatsApp → API Setup)
   - `WHATSAPP_TEMPLATE` = `aviso_calendario`
   - `WHATSAPP_LANG` = `pt_BR`
6. Novo deploy. A Meta cobra por mensagem de modelo enviada: confira a tabela de preços vigente antes de ativar para turmas grandes.
O texto do aviso vai numa linha só (a Meta não aceita quebra de linha na variável), com os itens separados por " • ".

## 4. Agendador (envio automático diário)
- **Vercel:** já vem configurado em `vercel.json` (todo dia 23:00 UTC = 20:00 em Salvador). Cadastre a variável `CRON_SECRET` (texto longo e aleatório): a Vercel a envia sozinha no agendamento. O plano gratuito aceita um agendamento por dia.
- **Netlify:** a função agendada `netlify/functions/cron.js` já está pronta (mesmo horário). Nada a configurar além do deploy.
- **Servidor próprio:** `node server.js` já roda o agendador sozinho às 23:00 UTC.
- Variável opcional `PUBLIC_URL` = endereço do site, usada nos links das mensagens (se vazia, usa o endereço salvo no sistema).

## 5. Como usar
1. Aba **Alunos/Docentes:** preencha e-mail e WhatsApp.
2. Aba **Avisos:** marque *Avisar alterações* e/ou *Lembrete*, escolha canal e grupos. Ao ativar, o sistema passa a acompanhar as alterações **a partir daquele momento** (não avisa o passado).
3. Para testar antes, use *Mensagem livre* enviando só para você (deixe apenas a lista extra com o seu e-mail).

## 6. Observações
- Se o envio falhar (chave errada, número sem WhatsApp, limite), o aviso fica no histórico como *Falha* e as alterações continuam pendentes: o agendador tenta de novo no dia seguinte.
- Só aulas de hoje em diante entram no aviso de alterações.
- Chamada e faltas **não** são enviadas a ninguém por esses avisos.
