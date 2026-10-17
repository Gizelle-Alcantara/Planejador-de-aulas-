# Controle de chaves

Abra **Salas e laboratórios → Controle de chaves**.

## Preparação pela gestão

1. Cadastre as salas e laboratórios em Ambientes.
2. O administrador do sistema cria a conta do docente e faz o vínculo na aba Acesso. Uma conta sem vínculo não pode assinar por um docente.
3. Em **Cadastro de chaves e etiquetas QR**, informe a identificação física e o ambiente de destino. Cada chave possui um QR exclusivo. Imprima e fixe a etiqueta na chave.
4. Em **Alocar docente e chave para uma aula**, selecione o dia, a aula presencial e a chave do ambiente. A alocação cria uma reserva aprovada, verificando conflitos. Uma reserva aprovada existente para a mesma aula e ambiente pode ser reaproveitada. EAD não utiliza chaves.

As etiquetas usam o endereço do site aberto no momento da impressão. Gere-as no endereço definitivo, acessível pelo celular. Para a câmera funcionar fora de localhost, publique com HTTPS. A leitura também aceita uma foto da etiqueta ou o endereço completo do QR code.

## Retirada e devolução pelo docente

1. Entre com sua conta e leia o QR code. Também é possível abrir diretamente o endereço da etiqueta usando a câmera do celular.
2. Confira a chave, o ambiente e a aula em **Minhas chaves**.
3. No dia da aula, selecione **Assinar retirada**, desenhe sua assinatura e confirme seu nome e o aceite de responsabilidade.
4. Na devolução, leia novamente o QR code e selecione **Assinar devolução**, com uma nova assinatura.
5. Consulte os comprovantes para imprimir ou salvar em PDF.

A assinatura é eletrônica desenhada na tela, associada à conta autenticada, ao docente vinculado, à aula, à chave e ao horário do servidor. Não usa certificado digital. O comprovante contém identificador e hash SHA-256 do registro; os registros também encadeiam o hash anterior. A confirmação deve ser feita após a efetiva entrega ou devolução física da chave.

## Acompanhamento

- A gestão consulta as movimentações por data e usa **Atualizar** para obter os registros mais recentes.
- Chaves em uso continuam visíveis mesmo após o dia da aula, até a devolução.
- Uma chave não pode ter duas retiradas em aberto. Alocações com horários sobrepostos da mesma chave são recusadas.
- Alterações ou cancelamentos da aula/reserva impedem uma nova retirada até a gestão corrigir a alocação. Uma chave já retirada pode ser devolvida mesmo após essas alterações.
- Cancelar uma alocação ainda não retirada preserva a reserva do ambiente. Para alterar a reserva, use Reservas. Uma alocação com chave em uso exige devolução antes de ser encerrada.
- Cadastre uma chave por conjunto físico entregue. Desative as chaves sem alocações ou retiradas pendentes quando saírem de uso.
- Docentes consultam somente suas alocações e comprovantes. A gestão pode consultar todos.
- O backup completo da conta administradora inclui chaves, QR codes, alocações e assinaturas. Backups anteriores à criação deste recurso preservam o controle existente ao restaurar.

## Validação técnica

`npm test` inclui permissões, conflitos, concorrência, assinaturas obrigatórias, devolução após cancelamento e backup/restauração. `npm run test:ui:keys` valida etiquetas reais, leitura por foto, assinaturas e comprovantes no navegador, incluindo temas e visualização móvel. A câmera física depende do dispositivo e de sua permissão no navegador.
