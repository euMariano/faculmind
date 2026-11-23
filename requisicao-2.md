# Requisição 2 — Preservação dos dados acadêmicos e sincronização seletiva do histórico

**Projeto:** FaculMind  
**Área:** integração SIGAA, persistência Firestore e serviço de sincronização  
**Prioridade:** Alta  
**Tipo:** Resiliência de dados e redução de requisições redundantes  
**Dependências:** Requisição 1 concluída e validada em uma sincronização real  
**Escopo desta requisição:** preservar dados acadêmicos já sincronizados quando uma consulta falhar e evitar baixar/processar o histórico escolar em toda sincronização quando os dados existentes ainda forem considerados válidos.

---

## 1. Objetivo

A sincronização atual extrai os dados do SIGAA e monta um novo objeto `student` a cada execução. Esse objeto é depois persistido no Firestore. Esse fluxo pode substituir dados anteriormente válidos por valores vazios ou `null` quando uma consulta falha parcialmente.

Além disso, toda sincronização baixa novamente o PDF do histórico escolar e executa `parseHistoricoPendentes()`, mesmo quando a integralização foi sincronizada há pouco tempo e não há motivo para atualizá-la.

Esta requisição deve resolver esses dois problemas:

1. **Preservação:** uma falha técnica parcial não pode apagar informações acadêmicas válidas que já estejam persistidas.
2. **Atualização seletiva do histórico:** reutilizar a integralização já persistida enquanto ela estiver dentro de uma janela de validade, atualizando-a quando estiver vencida, quando houver mudança de semestre, quando ainda não existir ou quando o usuário solicitar uma atualização forçada.

A implementação deve ser incremental, compatível com os documentos existentes no Firestore e com os formatos de dados consumidos pelo frontend e pela Agy.

**Não é uma autorização para reescrever o fluxo inteiro de sincronização, o scraper, os parsers, o orchestrator ou a interface.**

## 2. Contexto confirmado da implementação atual

A Requisição 1 unificou a consulta de notas e frequência por disciplina em `scrapeAcademicDataForTurma()`.

O teste real contra o SIGAA confirmou:

- as seis disciplinas do semestre `2026.2` foram processadas;
- notas: 3 atualizadas, 3 ainda não lançadas e 0 falhas;
- frequência: 5 atualizadas, 1 ainda não lançada e 0 falhas;
- três disciplinas reutilizaram o menu e o `ViewState` da resposta de notas;
- três disciplinas precisaram do GET de recuperação da Turma Virtual;
- o fluxo combinado funcionou sem falhas técnicas.

Portanto, a Requisição 2 deve preservar o fluxo combinado existente. Não deve desfazer nem reimplementar a otimização da Requisição 1.

### 2.1 Arquivos que devem ser inspecionados antes de editar

O agente deve localizar e ler a versão atual destes pontos, confirmando os caminhos reais no repositório:

- `server/services/sigaaScraper.js` — extração do SIGAA e montagem do objeto atualizado;
- `server/services/sigaaParser.js` — parsing do histórico e dos dados das turmas;
- `server/data/store.js` — leitura e gravação do registro acadêmico no Firestore;
- rota/controlador de `/api/sync-university` e eventuais rotas auxiliares de sincronização;
- middleware de autenticação que fornece `req.uid`;
- código que chama `syncWithSigaa()` e persiste `result.student`;
- testes existentes relacionados à sincronização e à persistência.

Não presumir que assinaturas, nomes de funções ou estrutura da rota continuam iguais aos de versões anteriores. Inspecionar o código atual antes de propor mudanças.

## 3. Parte A — Preservação dos dados acadêmicos anteriores

### 3.1 Problema a resolver

O scraper monta um novo objeto por meio de `formatSigaaScrapedData()`. Esse objeto contém dados extraídos do portal e das turmas, mas começa com valores vazios para informações que serão preenchidas depois, como notas e frequência.

Se a consulta de uma disciplina falhar, o novo objeto pode continuar contendo valores iniciais (`null`, listas vazias ou estados não consultados). Se esse objeto substituir o documento anterior no Firestore, dados válidos de uma sincronização anterior podem ser perdidos.

A persistência precisa considerar o registro anterior do próprio usuário, recuperado no backend por meio do UID autenticado.

### 3.2 Origem confiável do registro anterior

- O registro anterior deve ser lido do Firestore no backend, associado ao `uid` fornecido pelo middleware de autenticação.
- Nunca aceitar um objeto acadêmico enviado pelo frontend como fonte para preservar ou mesclar dados.
- Não buscar nem mesclar dados de outro UID.
- Não registrar credenciais SIGAA, tokens, senhas ou dados sensíveis nos logs.
- Preservar o isolamento entre usuários.

O agente deve identificar o ponto mais seguro e menos invasivo para obter o registro anterior. Pode ser na rota/controlador autenticado ou em uma camada de serviço já existente, desde que o UID seja validado no servidor e que não haja duplicação desnecessária de leituras.

### 3.3 Estratégia de mesclagem

Implementar uma mesclagem explícita entre o registro anterior e o resultado recém-extraído. Não fazer uma mesclagem genérica e indiscriminada de objetos.

A mesclagem deve respeitar estas regras:

#### Dados gerais do aluno

- Preferir valores recém-extraídos quando forem válidos.
- Se uma extração falhar ou retornar ausência inesperada (`null`/campo ausente) para um dado que já possui valor válido, preservar o valor anterior.
- Não inventar valores de substituição.
- Não preservar indefinidamente um valor anterior quando o SIGAA tiver retornado uma alteração válida e explícita.

Exemplos de campos que devem ser avaliados: nome, matrícula, curso, CR/CRA, semestre atual e integralização.

#### Turmas

- Correlacionar turmas usando uma identidade estável. Preferir `id` quando ele for estável; caso contrário, combinar campos suficientemente específicos, como período, código da disciplina e identificador da turma (`turmaId`).
- Não correlacionar turmas somente pelo nome da disciplina se houver código ou identificador mais confiável.
- Para uma turma que continua presente na resposta nova, mesclar os dados extraídos com os dados anteriores da mesma turma.
- Para uma turma cuja consulta de notas falhou tecnicamente, preservar as últimas notas válidas e os campos relacionados.
- Para uma turma cuja consulta de frequência falhou tecnicamente, preservar a última frequência válida, `frequenciaDisponivel` e o percentual anterior.
- Uma falha em notas não deve impedir atualizar frequência, e uma falha em frequência não deve impedir atualizar notas.
- Uma falha em uma disciplina não deve impedir atualizar as outras disciplinas.
- Não carregar cegamente turmas antigas de semestres anteriores para dentro da lista de turmas atuais. A lista de turmas atual deve continuar refletindo o que o SIGAA retornou para o período atual.

#### Tratamento dos três estados de consulta

Distinguir rigorosamente `available`, `not_launched` e `failed`:

| Estado recebido do scraper | Comportamento de persistência |
|---|---|
| `available` | Substituir os dados daquela categoria pelos dados recém-extraídos e registrar a atualização bem-sucedida. |
| `not_launched` | Registrar que o SIGAA informou explicitamente que a informação ainda não foi lançada. Não tratar como erro técnico nem como zero. Evitar apresentar dados antigos como se fossem atuais. Se dados anteriores forem mantidos como último retrato conhecido, devem ficar claramente identificados como antigos/indisponíveis e não podem ser usados pela Agy como informação atual. |
| `failed` | Preservar os últimos dados válidos daquela categoria. Registrar a falha/estado da tentativa sem converter a falha em `not_launched`, `0`, `null` ou lista vazia que substitua o dado anterior. |

A estrutura final deve permanecer compatível com os campos atuais (`notasDisponiveis`, `notas`, `faltas`, `frequenciaDisponivel`, `frequencia`, `presencaPercentual`). Caso seja necessário acrescentar metadados de estado para distinguir dado antigo de dado atual, fazê-lo de forma compatível com os consumidores existentes e explicar a mudança.

### 3.4 Falha total versus falha parcial

- Se o login/autenticação do SIGAA falhar, não substituir o registro acadêmico existente.
- Se a extração do portal ou da lista de turmas falhar de forma que não seja possível construir uma resposta confiável, não gravar um novo registro incompleto por cima do anterior.
- Se somente uma consulta de notas ou frequência falhar, preservar a outra atualização e os dados anteriores da categoria que falhou.
- Se a extração do histórico falhar, ainda avaliar se os demais dados (turmas, notas e frequência) podem ser sincronizados com segurança; não tornar a atualização do histórico um bloqueio desnecessário para o restante da sincronização.
- Uma sincronização parcialmente bem-sucedida deve informar claramente quais partes foram atualizadas, quais não foram lançadas e quais falharam.

### 3.5 Persistência no Firestore

Inspecionar a implementação atual de `dataStore.saveStudentAcademicRecord()` e confirmar se a gravação substitui o documento inteiro ou utiliza `merge`.

A solução deve evitar tanto:

- substituir o documento inteiro por um objeto incompleto;
- quanto usar `merge: true` indiscriminadamente e deixar campos antigos indevidos ou estruturas aninhadas inconsistentes.

A abordagem preferida é produzir no backend um objeto acadêmico completo e coerente, mesclado com o registro anterior conforme as regras desta requisição, e então persistir esse objeto de forma controlada. Não mudar a semântica global de gravação do Firestore sem demonstrar necessidade e testar os efeitos.

## 4. Parte B — Reutilização da integralização e do histórico escolar

### 4.1 Problema a resolver

Atualmente, `syncWithSigaa()` executa em toda sincronização:

1. `fetchHistoricoPdfBuffer(session, htmlPortal)`;
2. `parseHistoricoPendentes(historicoBuffer)`.

O histórico escolar é baixado e processado novamente mesmo quando o Firestore já possui uma integralização recente.

### 4.2 Metadados de atualização

Adicionar metadados específicos para a última sincronização bem-sucedida do histórico/integralização. A estrutura e o nome devem seguir o padrão do projeto, mas precisam permitir identificar:

- quando a integralização foi obtida com sucesso;
- a qual semestre/contexto acadêmico ela se refere;
- se há dados anteriores reaproveitáveis;
- se a última tentativa falhou, sem confundir falha com atualização bem-sucedida.

Uma estrutura conceitual possível (não obrigatória) seria:

```js
syncMetadata: {
    history: {
        lastSuccessfulAt: "timestamp ISO",
        semester: "2026.2",
        lastAttemptAt: "timestamp ISO",
        lastAttemptStatus: "success | failed | reused"
    }
}
```

Não criar vários campos redundantes com nomes diferentes para representar a mesma informação. Usar um timestamp consistente e serializável no Firestore.

### 4.3 Regra de validade (TTL)

- Definir uma janela de validade explícita para a integralização. Usar inicialmente **24 horas** como valor padrão, salvo se o projeto já possuir uma política de validade equivalente.
- Tornar o TTL configurável por variável de ambiente, com validação e fallback seguro. Não aceitar `NaN`, zero acidental ou valor negativo como TTL válido.
- Se a integralização anterior existir, possuir metadados válidos, pertencer ao mesmo semestre e estiver dentro do TTL, reutilizá-la sem baixar o PDF e sem executar `parseHistoricoPendentes()`.
- Se não existir integralização anterior, não houver metadados confiáveis, o TTL tiver expirado ou o semestre tiver mudado, baixar e processar o histórico novamente.
- Se o usuário solicitar atualização forçada do histórico, ignorar o TTL e consultar novamente o SIGAA.
- Se a versão atual do projeto já tiver uma opção de sincronização forçada, integrar-se a ela sem criar uma opção duplicada.

O nome da variável de ambiente e da opção de força pode ser escolhido pelo agente após inspecionar o padrão existente. Documentar os nomes escolhidos.

### 4.4 Falha ao atualizar o histórico

Se o PDF não puder ser baixado ou processado:

- preservar a última `integralizacao` válida do Firestore, quando existir;
- registrar a tentativa como falha e manter o timestamp da última atualização bem-sucedida sem avançá-lo;
- não marcar o histórico antigo como recém-atualizado;
- não substituir a integralização anterior por `null`, `{}` ou listas vazias;
- permitir que o restante da sincronização prossiga quando as outras fontes estiverem funcionando;
- se não houver dados anteriores, deixar claro que a integralização não está disponível, sem inventar pendências.

Se uma extração retornar dados estruturalmente inválidos ou incompletos, não os tratar como uma atualização bem-sucedida apenas porque o HTTP retornou 200.

### 4.5 Mudança de semestre

Uma mudança de semestre deve invalidar a reutilização automática da integralização anterior e provocar nova consulta do histórico.

Comparar o semestre atual obtido do SIGAA com o semestre associado aos metadados do histórico. Não inferir mudança de semestre apenas pela data do computador.

## 5. Contrato esperado entre rota, store e scraper

O agente deve inspecionar o fluxo real e escolher a menor alteração que permita:

1. obter do Firestore, pelo UID autenticado, o registro acadêmico anterior;
2. passar ao serviço de sincronização apenas os dados anteriores necessários e opções explícitas, sem confiar no corpo enviado pelo frontend;
3. decidir no backend se a integralização pode ser reutilizada ou precisa ser atualizada;
4. produzir o novo registro preservando dados válidos diante de falhas parciais;
5. persistir o objeto final uma única vez, depois da mesclagem e das validações;
6. invalidar o cache da Agy somente depois que uma gravação válida for concluída.

Não duplicar leituras do Firestore sem necessidade. Se a rota já obtém o registro anterior, reutilizar essa leitura em vez de buscar novamente dentro de outra camada.

O scraper não deve ganhar dependência direta do Firebase Admin/Firestore se atualmente ele é um serviço de extração independente. Preferir receber as informações anteriores necessárias por parâmetros/opções e devolver o resultado; a camada de aplicação deve continuar responsável por acesso ao Firestore e autorização.

## 6. Comportamento que deve permanecer inalterado

Esta requisição não deve alterar:

- autenticação SIGAA e validação de credenciais;
- navegação JSF/RichFaces já validada na Requisição 1;
- `openTurmaVirtual()`;
- fluxo combinado `scrapeAcademicDataForTurma()` e propagação do `ViewState`, exceto correção estritamente necessária para integrar os estados;
- identificação dinâmica dos comandos `Ver Notas` e `Frequência`;
- parsers de notas e frequência, salvo necessidade comprovada e documentada;
- formato atual de notas, frequência e integralização consumido pelo frontend e pela Agy;
- isolamento por UID;
- comportamento de `invalidateUserCache(uid)` após persistência válida.

Não paralelizar as requisições JSF das disciplinas nesta requisição. A sessão usa cookies e estado JSF; concorrência pode introduzir interferência no fluxo e não é o objetivo desta etapa.

## 7. Testes obrigatórios

Criar ou adaptar testes usando funções e padrões de teste já existentes no projeto. Não depender de credenciais SIGAA reais para os testes automatizados. Não criar fixtures que afirmem sucesso sem verificar os resultados e estados relevantes.

### 7.1 Mesclagem e preservação

1. Registro anterior contém notas válidas; nova consulta de notas retorna `failed`: notas anteriores permanecem.
2. Registro anterior contém frequência válida; nova consulta de frequência retorna `failed`: frequência anterior permanece.
3. Notas falham e frequência é atualizada: frequência nova é persistida e notas anteriores permanecem.
4. Frequência falha e notas são atualizadas: notas novas são persistidas e frequência anterior permanece.
5. Uma disciplina falha, outras são atualizadas: os resultados das outras disciplinas são persistidos.
6. Dados gerais válidos do registro anterior são preservados quando uma extração nova falha ou retorna ausência inesperada.
7. Turmas devem ser correlacionadas pela identidade estável definida, sem misturar disciplinas diferentes com nomes semelhantes.
8. Turmas de semestres anteriores não devem ser adicionadas indevidamente à lista atual.
9. Autenticação ou falha estrutural total não deve sobrescrever o documento anterior.
10. `not_launched` deve ser distinguido de `failed` e não pode ser interpretado como zero.

### 7.2 Validade da integralização

1. Integralização existente, metadados válidos, mesmo semestre e TTL vigente: PDF não é baixado e parser não é executado.
2. Sem integralização anterior: PDF é baixado e processado.
3. Metadados ausentes ou inválidos: atualizar o histórico.
4. TTL expirado: atualizar o histórico.
5. Semestre diferente: atualizar o histórico mesmo com TTL vigente.
6. Atualização forçada: baixar e processar novamente mesmo com TTL vigente.
7. Falha ao baixar/processar PDF com integralização anterior: preservar os dados anteriores e não avançar `lastSuccessfulAt`.
8. Falha ao baixar/processar PDF sem integralização anterior: manter integralização indisponível e registrar a falha sem inventar dados.
9. Valor inválido de TTL: aplicar o fallback documentado, sem desabilitar acidentalmente a atualização.

### 7.3 Segurança e persistência

- Confirmar que o registro anterior é sempre obtido pelo UID autenticado no servidor.
- Confirmar que dados acadêmicos fornecidos pelo frontend não são usados como fonte para a mesclagem.
- Confirmar que um usuário nunca recebe nem mescla o registro acadêmico de outro UID.
- Confirmar que a persistência ocorre apenas depois de construir e validar o objeto final.
- Confirmar que a invalidação de cache acontece após gravação bem-sucedida, não antes.

## 8. Critérios de aceitação

A requisição só pode ser considerada concluída quando:

- [ ] O agente inspecionou a rota, `store.js`, scraper, middleware de autenticação e fluxo real de persistência antes de editar.
- [ ] O scraper da Requisição 1 continua funcionando e não foi reescrito sem necessidade.
- [ ] Falhas parciais em notas/frequência não apagam dados anteriormente válidos.
- [ ] Estados `available`, `not_launched` e `failed` continuam distintos.
- [ ] Falha de autenticação ou falha estrutural total não sobrescreve o documento do aluno.
- [ ] O histórico escolar é reutilizado quando está dentro do TTL, no mesmo semestre e com metadados confiáveis.
- [ ] Ausência de dados, TTL vencido, mudança de semestre ou atualização forçada provocam nova consulta do histórico.
- [ ] Falha ao atualizar histórico preserva a última integralização válida e não avança o timestamp de sucesso.
- [ ] O registro final persiste no Firestore sem perda de campos necessários ao frontend e à Agy.
- [ ] `npm run build` passa.
- [ ] Os testes automatizados relevantes passam.
- [ ] O agente apresenta os arquivos modificados, decisões de mesclagem, política TTL, testes executados e limitações.
- [ ] Nenhum commit é criado automaticamente.

## 9. Restrições explícitas

- Não modificar o frontend nesta requisição.
- Não modificar o `orchestrator.js` ou a estratégia de modelos Gemini, exceto se uma incompatibilidade direta impedir a preservação dos contratos existentes; nesse caso, explicar antes e manter a mudança mínima.
- Não adicionar outro provedor de IA, banco de dados, Redis ou dependência externa.
- Não alterar a autenticação Firebase nem armazenar credenciais SIGAA em novos locais.
- Não criar dados simulados, valores padrão fictícios ou respostas acadêmicas artificiais.
- Não transformar campos ausentes em zeros.
- Não remover funcionalidades que já funcionam.
- Não fazer refatorações cosméticas ou reorganização ampla de arquivos.
- Não executar sincronização paralela de turmas.
- Não fazer commit automaticamente.

## 10. Relatório final exigido do agente

Ao concluir, apresentar:

1. Arquivos modificados e motivo de cada alteração.
2. Como o registro anterior é obtido e como o UID é protegido.
3. Como ocorre a mesclagem por aluno e por turma.
4. O comportamento exato para `available`, `not_launched` e `failed`.
5. Onde são armazenados os metadados do histórico e qual TTL foi adotado.
6. Em quais condições o PDF é reutilizado, atualizado ou preservado após falha.
7. Testes executados e resultados reais.
8. Resultado de `npm run build`.
9. Confirmação de que não houve commit automático.
10. Limitações ou decisões que dependem de validação manual.

Se algum critério não puder ser atendido com segurança, não improvisar nem ampliar o escopo. Informar o bloqueio e deixar a parte correspondente sem implementação.

---

## 11. Instrução de execução

Execute exclusivamente esta Requisição 2.

Antes de editar:

1. inspecione `git status` e preserve alterações existentes;
2. leia os arquivos atuais citados neste documento;
3. trace o caminho completo da rota autenticada até `syncWithSigaa()` e `saveStudentAcademicRecord()`;
4. apresente um diagnóstico curto da estratégia mínima de implementação.

Depois implemente somente o escopo desta requisição, adicione testes e execute as verificações.

Não execute futuras requisições, não faça commit e não altere arquivos fora do escopo sem necessidade demonstrável.
