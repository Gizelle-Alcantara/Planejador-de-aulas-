# Processos físicos — autoatendimento do docente

Complemento ao [plano de implementação](PLANO-DE-IMPLEMENTACAO.md), de 20/10/2026, revisado conforme o processo definido pela unidade: **o docente autorizado realiza integralmente sua retirada e devolução, sem intermediário presencial**. [Abrir protótipo visual](PROTOTIPO-OPERACAO.html).

Revisão documental: **23/10/2026**. O protótipo é um arquivo demonstrativo para consulta/baixar no repositório, sem conexão com dados reais. Com restrições por curso ativas, o perfil de coordenador restrito não administra ambientes ou chaves; essa gestão cabe ao administrador ou ao perfil específico de ambientes. O fluxo individual do docente e o terminal conservam suas próprias permissões.

## 1. Responsabilidades

| Participante | Responsabilidade |
|---|---|
| Coordenação acadêmica | Conferir a programação e as aulas |
| Gestão de ambientes | Autorizar/alocar ambiente e chave, manter cadastro e etiquetas, acompanhar pendências e resolver divergências |
| Docente autorizado | Acessar o local autorizado, conferir sua alocação, ler QR, assinar, retirar, guardar durante o uso e devolver à posição correta |

A gestão não participa obrigatoriamente de cada movimentação. Sua atuação é de preparação, acompanhamento e tratamento de exceções. O docente não ganha permissão para cadastrar/alocar chaves ou movimentar chaves de colegas.

O software registra os movimentos, mas não abre armário/porta, não detecta a presença física da chave e não verifica fechamento da sala. A assinatura eletrônica não substitui a conferência física pelo próprio docente.

## 2. Estação de autoatendimento

Para o painel compartilhado, utilizar `/secretaria-chaves.html`. O professor escolhe retirada/devolução, autentica sua conta e conclui sua própria movimentação. Preparar navegador dedicado, sem sessão administrativa e sem salvar senhas. O painel retorna ao início após a conclusão e encerra sessões inativas; a organização física da guarda continua sob definição da unidade.

| Recurso | Organização proposta |
|---|---|
| Ponto de acesso | Local definido pela unidade, com circulação acessível e instruções visíveis |
| Armário/claviculário | Posições identificadas; procedimento de acesso físico limitado aos docentes autorizados |
| Identificação | Chaveiro com código legível e QR correspondente ao ambiente |
| Dispositivo | Celular do docente ou equipamento compartilhado autorizado, com internet |
| Apoio | Canal para comunicar divergências e formulário de contingência autorizado |

A unidade deve definir o mecanismo de acesso físico antes do piloto. Login e QR não destravam o armário nem impedem fisicamente alguém de pegar outra chave. Se for necessário liberar eletronicamente apenas um compartimento por docente, isso exige hardware e integração próprios, ainda não implementados.

O acesso ao local não autoriza usar todas as chaves: o docente só retira a que está alocada à sua aula. Em dispositivo compartilhado, cada docente usa sua própria conta e encerra a sessão ao concluir. Não compartilhar senhas.

## 3. Inventário e preparação

1. Gestão identifica ambientes, chaves, cópias e posições de guarda.
2. Confere funcionamento da chave/fechadura conforme autorização da unidade.
3. Cadastra ambiente e chave, gera QR e fixa etiqueta legível/protegida.
4. Compara etiqueta, chave física, porta, cadastro e posição.
5. Define quem pode acessar o local e como reportar ausência/defeito.
6. Confere aula presencial, reserva e conta vinculada antes da alocação.

Exemplo fictício do ensaio: **Alex Exemplo**, turma **PILOTO-01**, ambiente **LAB-01**, chave **CH-01**, posição **A-01**. Não usar tokens reais em mural público ou no protótipo.

| Chave | Ambiente | Posição | Cópias | Estado físico | Conferente/data |
|---|---|---|---|---|---|
| CH-01 (fictício) | LAB-01 | A-01 | A levantar | A conferir | A preencher |

Posição de guarda e inventário físico são controles operacionais propostos, não campos/telas existentes no produto. Cópias de reserva devem ser identificadas separadamente, sem duas chaves indistinguíveis usando o mesmo registro de retirada.

## 4. Retirada pelo docente

| Passo | Ação física do docente | Ação/conferência no sistema |
|---|---|---|
| 1 | Dirigir-se à estação pelo acesso autorizado | Entrar na própria conta e abrir Minhas chaves |
| 2 | Localizar posição/chave correta sem retirar outras | Conferir nome, data, aula, ambiente e alocação |
| 3 | Ler o QR da chave correspondente no local | Escolher Retirar chave e validar QR por câmera/foto |
| 4 | Permanecer junto à chave | Conferir nome, desenhar assinatura e confirmar aceite |
| 5 | Após confirmação, retirar a chave e levá-la ao ambiente | Verificar sucesso e comprovante, não apenas o clique |

Retirada só no dia da aula e para alocação válida. Sem alocação, chave correta ou confirmação, interromper o fluxo e comunicar a gestão. Não pegar chave de outra sala nem alterar datas para contornar validações.

Se o sistema confirmar e a retirada física não acontecer, informar a divergência imediatamente. Não registrar devolução fictícia de uma chave que não chegou a ficar sob sua guarda nem assinar por outro docente. A gestão define o tratamento após conferir o ocorrido.

## 5. Uso do ambiente

O docente mantém a guarda da chave, segue as orientações locais de abertura, equipamentos e fechamento e retorna no prazo combinado. Não transfere diretamente a chave a colega; o próximo docente precisa de alocação e retirada próprias.

Perda, dano ou impossibilidade de retorno devem ser comunicados à gestão. A alocação/retirada não certifica que equipamentos ou ambiente estão em condições de uso; essa conferência segue o procedimento da unidade.

## 6. Devolução pelo docente

| Passo | Ação física do docente | Ação/conferência no sistema |
|---|---|---|
| 1 | Retornar à estação com a chave | Abrir retirada pendente e Devolver chave |
| 2 | Conferir identificação e posição original | Conferir ambiente/chave da retirada |
| 3 | Ler QR e recolocar a chave na posição correta | Validar o QR correspondente |
| 4 | Permanecer na estação e conferir guarda física | Assinar e confirmar a devolução com a própria conta |
| 5 | Conferir a chave guardada antes de sair | Verificar sucesso/comprovante e encerrar sessão compartilhada |

A assinatura de devolução corresponde à chave fisicamente devolvida. O produto não detecta o retorno ao armário. Caso a guarda aconteça e a gravação falhe, informar imediatamente local, identificação e situação à gestão, sem levar outra chave ou considerar a divergência resolvida.

## 7. Acompanhamento pela gestão

Realizar conferências periódicas de posições físicas e retiradas em aberto, investigar ausências/presenças incompatíveis com o registro e acompanhar próximas utilizações. Definir canal e responsável por exceções em cada período, sem exigir presença na estação para o fluxo normal.

Não há alerta automático de atraso assumido neste plano. A gestão acompanha as pendências e comunica o docente pelo canal autorizado. Uma divergência de guarda precisa de investigação antes de permitir que a chave afetada circule novamente.

## 8. Contingências

| Situação | Conduta do docente |
|---|---|
| Sem autorização física ou alocação | Não acessar/retirar; solicitar regularização à gestão |
| QR ilegível ou de outra chave | Interromper, conferir identificação e comunicar; usar foto apenas quando adequada |
| Disponível no sistema, ausente fisicamente | Não substituir por outra chave; reportar à gestão |
| Presente, mas marcada retirada | Não assumir que está livre; reportar divergência |
| Sem internet ou dispositivo | Não presumir gravação offline; seguir contingência previamente autorizada pela gestão |
| Assinatura inacessível/indisponível | Usar recurso acessível ou contingência autorizada; nunca assinatura de terceiro |
| Devolução física sem confirmação digital | Informar à gestão e registrar exceção com posição/data/hora |
| Perda ou dano | Comunicar imediatamente à gestão/manutenção e seguir procedimento local |
| Mudança de ambiente após retirada | Devolver chave anterior e obter nova alocação validada |

Registro de contingência sugerido: número, data/hora física, docente, aula/turma, ambiente, chave/posição, ação, motivo, autorização aplicável, declaração do próprio docente e responsável pela conciliação. Guardar com acesso restrito conforme política da unidade.

Não existe lançamento administrativo retroativo de assinatura docente no sistema atual. Se o fato não puder ser representado fielmente depois, preservar a exceção e encaminhar à gestão/equipe técnica. Não editar banco, trocar data ou fabricar assinatura para fechar pendência.

## 9. Ensaio de autoatendimento

O [protótipo](PROTOTIPO-OPERACAO.html) é local, fictício e não acessa câmera, assinatura ou servidor. Mostra o processo proposto, sem implementar destravamento físico.

Preparar estação, chaveiro de demonstração, posição A-01 e identificação LAB-01. A gestão organiza a simulação; o docente executa todas as etapas físicas e digitais sozinho, primeiro com orientação e depois sem intervenção.

| Cena | Demonstração | Aceite |
|---|---|---|
| Planejamento | Gestão reserva/aloca | Aula, chave e titular correspondem |
| Acesso | Docente acessa estação e sua conta | Autorização física e alocação verificadas |
| Conferência | Localiza chave e lê QR | Etiqueta, posição e ambiente correspondem |
| Retirada | Assina, confirma e retira | Chave sai da guarda após registro confirmado |
| Uso | Leva ao ambiente | Custódia e retorno compreendidos |
| Devolução | Lê QR, guarda, assina e confirma | Posição física e estado digital conciliados |
| Encerramento | Verifica conclusão e sai da conta | Sem pendência não comunicada |

Ensaiar QR errado, chave ausente e falta de conexão. Repetir controles reais em homologação com conta/QR de teste e data apropriada. Antes de ampliar, validar acesso físico, correspondência físico-digital e contingência sem intermediário presencial.

## 10. Dimensionamento

Levantar armário, chaveiros, etiquetas, conexão, dispositivo de apoio, sinalização e registro de contingência. Medir tempo de autoatendimento, falhas de leitura, acesso simultâneo, devoluções pendentes e divergências. Quantidades/metas dependem do piloto; este plano não comprova capacidade ou tempo de operação nem autoriza aquisição de hardware.
