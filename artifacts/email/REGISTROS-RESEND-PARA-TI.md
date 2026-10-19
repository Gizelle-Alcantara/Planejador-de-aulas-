# Ativação de e-mail — registros para avaliação da TI

Data da conferência: 19/10/2026.

## Situação

O sistema Agenda SENAI já possui integração com Resend para avisos e recuperação de senha. Os seis testes automatizados de recuperação foram aprovados, com envio simulado. A entrega real ainda não está habilitada.

A conta Resend acessada contém o domínio senai.br com status “not started”. Os servidores DNS públicos informados são ns1.f5clouddns.com e ns2.f5clouddns.com. O solicitante informou que não possui acesso ao painel DNS.

## Avaliação solicitada à TI

Confirmar se o uso de Resend para os e-mails deste sistema está autorizado e definir o domínio ou subdomínio remetente e o endereço de envio. Se o uso do domínio senai.br for aprovado, os registros abaixo são os exibidos pelo Resend nessa conta.

| Tipo | Nome relativo | Nome completo | Conteúdo | TTL |
|---|---|---|---|---|
| TXT | resend._domainkey | resend._domainkey.senai.br | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUbuNd5kICRz2JtB/uv8XjcdgzNFPHNAzehz6f3TvenYcddIeDmsbYswZtxyV8FxmznU+p2LrtCxTJlTL4F0TCoH/c/IW3Gx0+g+Ne6e+5+IRnVrTk4MneKw2e1L7HoiS/56U7C1/2OGpztkm6vOWz3m3eBF8bbk8itrN00csMRwIDAQAB` | Auto |
| CNAME | rsend | rsend.senai.br | `rsend-sae1.forge.rmta.net` | Auto |
| CNAME | send | send.senai.br | `send.forge.rmta.net` | Auto |

O campo Name do provedor pode exigir o nome relativo ou o nome completo. Usar somente um deles, conforme a interface, sem duplicar senai.br. Antes da inclusão, conferir a zona DNS vigente e possíveis conflitos. A consulta pública feita pelo resolvedor do Windows nesta conferência retornou NAME_ERROR para os três nomes; a TI deve validar a zona autoritativa.

Não é necessário habilitar recebimento de e-mail no Resend para este recurso. Esta solicitação não inclui alterações dos registros MX do domínio principal. Os registros de envio acima foram copiados da tela atual do Resend, não de exemplos genéricos.

Caso a instituição prefira um subdomínio autorizado, ele deverá ser cadastrado no Resend e os registros novos deverão ser obtidos dessa configuração; os valores desta tabela não devem ser reaproveitados automaticamente.

## Após a configuração DNS

1. Abrir o domínio no Resend e executar Verify DNS Records.
2. Aguardar a confirmação de domínio verificado.
3. Definir o endereço remetente autorizado.
4. Criar uma chave de API com permissão de envio, preferencialmente restrita ao domínio aprovado. Não enviar a chave por chat nem incluí-la neste documento.
5. Cadastrar RESEND_API_KEY como Secret em Production na Vercel, diretamente pela pessoa autorizada.
6. Cadastrar MAIL_FROM com o nome e endereço aprovados, por exemplo: Agenda SENAI <endereco-aprovado@dominio-verificado>.
7. Efetuar novo deploy.
8. Conferir Publicação e testar a entrega para um destinatário de teste autorizado. Conferir entrega no Resend e recebimento na caixa postal.
9. Conferir o e-mail de recuperação das contas na aba Acesso. A recuperação da senha mestre continua sendo administrativa.

## Limites desta preparação

Nenhum DNS foi alterado e nenhum e-mail real foi enviado. A presença das variáveis na Vercel, sozinha, não comprova domínio autorizado nem entrega. O remetente de testes resend.dev é limitado ao endereço da própria conta e não serve para ativar os avisos e a recuperação dos demais usuários.

## Referências oficiais

- Domínios verificados: https://resend.com/docs/dashboard/domains/introduction
- Limitações do remetente de testes: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
