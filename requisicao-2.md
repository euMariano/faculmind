# Requisição 2 — Persistência resiliente, correção das faltas e sincronização seletiva do histórico

**Projeto:** FaculMind  
**Área:** integração SIGAA/UFPE, parser acadêmico, persistência Firestore e rota de sincronização  
**Prioridade:** Alta  
**Tipo:** integridade de dados, resiliência e redução de requisições redundantes  
**Dependência:** Requisição 1 concluída e validada em sincronização real  
**Escopo:** corrigir a interpretação das faltas no mapa de frequência; impedir que falhas ou importações parciais apaguem dados acadêmicos válidos; reutilizar a integralização enquanto estiver dentro de uma validade configurável.

---

## 1. Objetivos desta requisição

A Requisição 1 unificou a consulta de notas e frequência por disciplina, abrindo a Turma Virtual uma única vez e reutilizando o formulário/`ViewState` quando a resposta de notas permite. O teste real apresentou seis disciplinas processadas, sem falhas técnicas, com fallback GET em três delas.

A validação posterior do Firestore e do código atual revelou três problemas concretos:

1. **Persistência destrutiva:** `saveStudentAcademicRecord()` grava com `set(record, { merge: false })`. O objeto recém-extraído substitui todo o documento, mesmo quando alguma consulta individual falhou.
2. **Importação manual destrutiva:** `/api/sync-university/import` também salva o objeto parcial gerado por `parseSigaaContent()` como substituição integral. Esse parser não fornece notas, frequência ou integralização completos.
3. **Faltas interpretadas incorretamente:** o mapa de frequência contém situações como `4 Falta(s)`, mas `parseSigaaFrequencyReport()` as classifica como `outro`. Nos dados reais enviados para inspeção, AD447 e AD437 tinham um registro `4 Falta(s)` cada, mas `contagem.ausentes` continuava em zero e `turma.faltas` permanecia zero devido ao valor vindo do relatório de notas.
4. **Histórico sempre baixado:** `syncWithSigaa()` baixa e processa o PDF de histórico em toda sincronização, mesmo quando a integralização existente ainda pode ser reutilizada.

Esta requisição deve corrigir esses pontos com alterações mínimas, preservando integralmente a Requisição 1.

## 2. Diagnóstico confirmado do código atual

O agente deve conferir novamente o estado real do repositório antes de editar. Os seguintes comportamentos foram observados na versão inspecionada, mas os números de linha e possíveis alterações posteriores devem ser verificados no código atual.

### 2.1 Gravação no Firestore

Em `server/data/store.js`, o método atual é equivalente a:

```js
async saveStudentAcademicRecord(uid, record) {
    // validação de UID omitida neste exemplo
    await db.collection("students").doc(uid).set(record, {
        merge: false,
    });
    return record;
}
```

`merge: false` substitui o documento inteiro. Não é suficiente trocar indiscriminadamente para `merge: true`, porque `turmas` e outros campos são arrays e precisam ser mesclados explicitamente.

### 2.2 Rota de sincronização real

Em `server/index.js`, a rota `/api/sync-university` atualmente:

1. recebe `username` e `password` do corpo;
2. executa `syncWithSigaa(username, password)`;
3. grava `result.student` diretamente com `saveStudentAcademicRecord(req.uid, result.student)`;
4. invalida o cache da Agy após a gravação.

A chamada ao Firestore já é aguardada com `await`. O problema é o conteúdo enviado à gravação e a falta de mesclagem com o documento existente.

### 2.3 Rota de importação manual

`/api/sync-university/import` chama `parseSigaaContent()` e também grava o objeto retornado substituindo o documento inteiro. A importação manual pode não conter detalhes de notas, frequência ou integralização; esses campos ausentes não devem apagar valores reais previamente sincronizados.

### 2.4 Estados produzidos pelo scraper

A função combinada `scrapeAcademicDataForTurma()` da Requisição 1 mantém estados independentes para notas e frequência:

- `available`: os dados foram extraídos;
- `not_launched`: o SIGAA informou que o professor ainda não lançou a informação;
- `failed`: ocorreu uma falha técnica.

Esses estados precisam chegar à camada de persistência de forma explícita. Não se deve inferir `failed` a partir de `null` ou confundir `not_launched` com falha.

### 2.5 Inconsistência real na frequência

Os registros do Firestore inspecionados continham, por exemplo:

```js
{
    data: "14/09/2026",
    situacao: "4 Falta(s)",
    categoria: "outro"
}
```

O parser atual só reconhece situações equivalentes a `Ausente`, `Falta` ou `Faltou` como ausência simples. O padrão numérico `4 Falta(s)` não é reconhecido. Em AD447 e AD437, o valor de quatro faltas do registro foi omitido da contagem, enquanto `turma.faltas` recebia zero do relatório de notas.

## 3. Arquivos e fluxo que devem ser inspecionados

Antes de editar, inspecionar a versão atual de:

- `server/services/sigaaScraper.js`;
- `server/services/sigaaParser.js`;
- `server/data/store.js`;
- `server/index.js` ou o arquivo real que registra as rotas;
- `server/config/firebaseAdmin.js`, apenas para entender a configuração e as APIs Firestore já disponíveis;
- testes existentes da Requisição 1 e quaisquer testes de persistência;
- todos os lugares que chamam `saveStudentAcademicRecord()` ou `syncWithSigaa()`.

Traçar o caminho completo desde a rota autenticada, passando pelo scraper/parser, até a gravação em `students/{uid}`. Não presumir que o código ainda é idêntico ao trecho apresentado anteriormente.

## 4. Parte A — Corrigir a interpretação de faltas

### 4.1 Objetivo

Interpretar corretamente situações explícitas como `4 Falta(s)` no mapa de frequência, sem confundi-las com presença, ausência de registro ou zero faltas.

### 4.2 Requisitos do parser

Atualizar `parseSigaaFrequencyReport()` para reconhecer, no mínimo:

- `Presente`;
- `Ausente`;
- `Falta` / `Faltou`;
- `1 Falta`, `1 Falta(s)`, `2 Faltas`, `4 Falta(s)` e variações de espaços/maiúsculas;
- `Não Registrada` e `Não Lançada`.

A normalização deve remover acentos e tratar espaços, sem perder o texto original armazenado em `situacao`.

### 4.3 Contrato de contagem

Preservar os campos existentes para compatibilidade e acrescentar uma contagem numérica inequívoca:

```js
contagem: {
    presentes: 0,       // número de registros cuja situação é Presente
    ausentes: 0,        // número de registros que indicam uma ou mais faltas
    naoRegistradas: 0,  // número de registros ainda não lançados
    outros: 0,          // situações que não puderam ser classificadas
    totalFaltas: 0      // soma da quantidade de faltas explicitamente indicada
}
```

Regras:

- `ausentes` continua representando a quantidade de registros com ausência, para não mudar silenciosamente o significado do campo existente.
- `totalFaltas` representa a soma das faltas. Um registro `4 Falta(s)` incrementa `ausentes` em 1 e `totalFaltas` em 4.
- Um registro `Ausente`, `Falta` ou `Faltou` sem quantidade explícita representa uma falta, portanto incrementa `ausentes` em 1 e `totalFaltas` em 1.
- `Não Registrada` nunca incrementa `ausentes` nem `totalFaltas`.
- Situações não reconhecidas permanecem em `outros`; não inventar uma quantidade.
- Cada registro classificado como ausência deve poder informar sua quantidade, por exemplo `quantidadeFaltas: 4`. Manter `situacao` original.

Não deduzir faltas a partir do percentual de frequência. O percentual oficial e os registros individuais são fontes distintas e devem continuar armazenados separadamente.

### 4.4 Atualização de `turma.faltas`

Quando a frequência for `available`, usar `frequencia.contagem.totalFaltas` como valor de `turma.faltas`, pois o mapa de frequência contém o detalhe por data e é a fonte mais específica para essa contagem.

Não deixar um zero vindo do relatório de notas sobrescrever a contagem mais detalhada do mapa de frequência.

Quando a frequência estiver `not_launched`, não inventar zero faltas. Definir o campo atual de faltas como indisponível (`null`) ou seguir o contrato existente, desde que não represente ausência como zero.

Quando a frequência estiver `failed`, preservar o valor anteriormente válido de `turma.faltas`.

## 5. Parte B — Persistência acadêmica resiliente

### 5.1 Objetivo

Construir um registro final coerente com o documento anterior do mesmo estudante e com o resultado da sincronização atual. Falhas parciais não podem apagar dados que já foram obtidos com sucesso.

### 5.2 Origem dos dados anteriores e segurança

- O registro anterior deve ser lido exclusivamente no backend, em `students/{req.uid}`.
- `req.uid` deve vir do middleware `authenticateToken` após validação do Firebase ID Token.
- Nunca aceitar `student`, `existingRecord`, UID ou dados acadêmicos enviados pelo frontend como fonte confiável para a mesclagem.
- Nunca ler ou mesclar documento pertencente a outro UID.
- Não registrar senha SIGAA, Firebase ID Token ou credenciais nos logs.

A rota pode ler o registro existente antes de iniciar a sincronização para fornecer à lógica de validade do histórico os metadados e a integralização anteriores. Para a gravação final, usar uma transação que leia o documento mais recente e aplique a mesclagem sobre ele. Essa segunda leitura dentro da transação é intencional: a sincronização externa pode demorar e outro processo pode atualizar o documento durante esse intervalo. Não fazer leituras repetidas em camadas sem necessidade.

### 5.3 Estratégia de mesclagem

Criar uma função explícita e testável para consolidar `existingRecord` e `incomingRecord`, recebendo também o relatório de estados das consultas. A função pode ficar no `store.js` ou em um serviço puro apropriado, conforme a organização atual do projeto.

Não usar `merge: true` como substituto para a lógica de mesclagem de arrays. A solução deve produzir um objeto acadêmico completo e coerente antes da gravação.

#### Dados gerais do estudante

- Preferir valores recém-extraídos quando forem válidos e explícitos.
- Se o parser não encontrou um dado ou retornou `null`/string vazia por ausência de extração, preservar o valor anterior válido.
- Permitir substituir um valor anterior quando o SIGAA fornecer um novo valor válido.
- Não inventar valores padrão.

Avaliar, entre outros, `name`, `matricula`, `course`, `cr`/`cra`, `currentSemester`, `integralizacao` e `syncMetadata`.

#### Identidade das turmas

- Correlacionar turmas preferencialmente por `id`.
- Se um registro antigo não tiver `id`, usar uma chave composta segura com período, código da disciplina e `turmaId`.
- Não correlacionar apenas pelo nome quando houver código e identificador de turma.
- Não misturar duas turmas diferentes da mesma disciplina.

#### Lista de turmas atuais

- Quando o semestre atual for o mesmo, mesclar cada turma recebida com a turma anterior de mesma identidade.
- Quando o semestre mudar, não carregar automaticamente turmas do semestre anterior para dentro de `turmas` como se fossem atuais. O conjunto atual deve refletir o retorno atual do SIGAA.
- Uma falha em uma turma não deve impedir a atualização das demais.

### 5.4 Regras obrigatórias por categoria e estado

A persistência deve conhecer o estado individual de notas e frequência por turma. Não basta receber somente o objeto final com `null`.

| Estado do scraper | Campo de notas/frequência | Tratamento |
|---|---|---|
| `available` | Dados extraídos com sucesso | Substituir a categoria anterior pelos dados novos e marcar disponibilidade `true`. |
| `not_launched` | SIGAA confirmou que o professor ainda não lançou | Marcar disponibilidade `false`; a categoria atual deve ficar indisponível, sem mostrar dados antigos como se fossem atuais e sem converter para zero. Se for importante conservar o último retrato conhecido, armazená-lo separado e com timestamp, nunca no campo apresentado como atual. |
| `failed` | Erro técnico, resposta inesperada ou falha de rede | Preservar a categoria anterior e sua disponibilidade. Se nunca houve dado anterior, manter indisponível/desconhecido (`null`), sem afirmar `false` ou zero. |
| Não informado (importação manual ou fluxo sem consulta) | Categoria não foi consultada | Preservar a categoria anterior. Ausência do campo não significa `not_launched` nem `failed`. |

Aplicar as regras separadamente para:

- `notasDisponiveis` e `notas`;
- `frequenciaDisponivel`, `frequencia`, `presencaPercentual` e `faltas`.

Uma falha de notas não deve impedir a atualização de frequência. Uma falha de frequência não deve impedir a atualização de notas.

Para `not_launched`, o estado recebido é uma informação confirmada do SIGAA, diferente de uma falha técnica. Não deixar dados anteriores aparecerem como atuais. Não é necessário implementar histórico/versionamento de avaliações nesta requisição; basta manter o contrato atual de dados disponíveis e indisponíveis.

### 5.5 Resultado parcial da sincronização

Hoje o scraper pode registrar falhas individuais e ainda retornar `success: true`. Isso não deve fazer a rota presumir que todas as categorias foram atualizadas.

O scraper deve devolver um relatório estruturado de estados por turma/categoria, por exemplo:

```js
syncReport: {
    turmas: {
        "2026.2-CT506-SE04": {
            notas: "not_launched",
            frequencia: "available"
        },
        "2026.2-AD447-SE04": {
            notas: "available",
            frequencia: "failed"
        }
    }
}
```

A forma exata pode seguir os tipos e convenções já existentes, mas precisa ser inequívoca e vinculada à identidade da turma. Não colocar estados temporários ambíguos dentro dos dados acadêmicos persistidos sem necessidade.

Comportamento:

- Falha total de autenticação ou de obtenção de dados essenciais: não persistir um objeto incompleto por cima do anterior.
- Falha estrutural que impeça identificar com segurança o semestre/turmas: não substituir o conjunto atual de turmas.
- Falha isolada de notas/frequência: persistir as outras categorias bem-sucedidas e preservar a categoria que falhou.
- Falha ao atualizar histórico: permitir que notas e frequência sejam sincronizadas se o restante estiver válido.
- A resposta HTTP deve comunicar que houve sincronização parcial quando houver falhas técnicas, sem anunciar sucesso completo. Manter compatibilidade com o contrato atual do frontend; documentar claramente qualquer campo novo (`partial`, `warnings`, `syncReport`, etc.).

### 5.6 Transação e gravação

Implementar a mesclagem final dentro de uma operação segura do Firestore, preferencialmente `db.runTransaction()`:

1. Ler o documento mais recente `students/{uid}` dentro da transação.
2. Aplicar a função pura de mesclagem entre o documento atual, os dados recebidos e o relatório de estados.
3. Validar os campos mínimos e a coerência do resultado.
4. Gravar o documento consolidado.
5. Retornar o documento efetivamente salvo.

Pode continuar usando `set(..., { merge: false })` dentro da transação **somente se o objeto já tiver sido consolidado integralmente**. Não gravar diretamente o `incomingRecord` parcial com `merge: false`.

Não alterar a semântica do método genérico de gravação para outros módulos sem necessidade. Pode ser criado um método específico, como `mergeStudentAcademicRecord()` ou nome equivalente.

A invalidação do cache da Agy deve continuar ocorrendo somente depois da gravação bem-sucedida.

## 6. Parte C — Reutilização seletiva da integralização

### 6.1 Problema atual

`syncWithSigaa()` baixa e processa o PDF do histórico em toda sincronização, executando `fetchHistoricoPdfBuffer()` e `parseHistoricoPendentes()` independentemente de já existir uma integralização recente no Firestore.

### 6.2 Metadados da última atualização bem-sucedida

Adicionar metadados específicos da integralização, compatíveis com documentos existentes. Uma estrutura conceitual possível:

```js
syncMetadata: {
    history: {
        lastSuccessfulAt: "2026-11-23T18:00:00.000Z",
        semester: "2026.2",
        lastAttemptAt: "2026-11-23T18:00:00.000Z",
        lastAttemptStatus: "success"
    }
}
```

A estrutura é ilustrativa, não obrigatória. Deve haver uma única fonte de verdade para:

- momento da última obtenção/processamento bem-sucedido;
- semestre a que a integralização se refere;
- momento e resultado da última tentativa (`success`, `reused` ou `failed`, ou estados equivalentes).

Não avançar `lastSuccessfulAt` quando os dados forem apenas reutilizados ou quando a atualização falhar.

### 6.3 TTL inicial de 24 horas

- Usar 24 horas como TTL padrão para a integralização.
- Tornar o TTL configurável por variável de ambiente (por exemplo, `SIGAA_HISTORY_TTL_HOURS`).
- Validar o valor: deve ser finito e positivo. Se estiver ausente, inválido, zero ou negativo, usar o fallback seguro de 24 horas e registrar aviso sem expor dados sensíveis.
- A integralização pode ser reutilizada quando existir, tiver metadados confiáveis, pertencer ao mesmo semestre e estiver dentro do TTL.
- Não baixar o PDF nem executar `parseHistoricoPendentes()` nesse caso.
- Atualizar quando não houver integralização, faltarem metadados confiáveis, o TTL vencer, o semestre mudar ou houver solicitação explícita de atualização forçada.

### 6.4 Atualização forçada

A rota autenticada `/api/sync-university` deve aceitar uma opção booleana estrita, por exemplo:

```js
{
    username,
    password,
    forceHistory: true
}
```

Somente `true` booleano deve forçar a atualização. Não aceitar strings arbitrárias como verdadeiras. A opção deve ser processada no backend e não deve alterar a identidade do usuário.

Se o projeto já tiver uma opção equivalente, reutilizá-la em vez de criar outra.

### 6.5 Semestre utilizado para decidir a validade

A decisão de reaproveitar o histórico depende do semestre atual realmente obtido do SIGAA, não da data local do computador.

Ajustar a ordem das operações apenas no necessário para identificar o semestre atual antes de decidir se o PDF precisa ser baixado. Uma abordagem possível:

1. obter o portal;
2. obter a página de turmas;
3. executar `formatSigaaScrapedData()` para identificar `currentSemester` e turmas;
4. comparar o semestre atual com os metadados do histórico anterior;
5. decidir entre reutilizar ou baixar/processar o PDF.

Se o semestre mudar, invalidar a reutilização automática e tentar atualizar a integralização mesmo que o TTL ainda esteja vigente.

### 6.6 Falha durante a atualização do histórico

Se o PDF não puder ser baixado ou processado, ou o resultado for estruturalmente inválido:

- preservar a integralização anterior quando existir;
- manter inalterado o timestamp da última atualização bem-sucedida;
- registrar a tentativa como falha;
- não substituir os arrays anteriores por `[]`, nem o mapa por `{}` ou `null`;
- permitir que a sincronização de notas e frequência continue se essas fontes estiverem funcionando;
- se não houver integralização anterior, deixar o campo indisponível e informar a falha, sem inventar pendências.

Quando a integralização anterior pertencer a outro semestre e a atualização falhar, pode ser mantida como último dado conhecido, mas deve permanecer identificada como desatualizada/associada ao semestre anterior. Não apresentá-la como integralização atual.

### 6.7 Importação manual

A rota `/api/sync-university/import` não consulta o PDF e não deve apagar `integralizacao` já existente. A ausência de integralização no objeto importado significa “não fornecida por esta fonte”, não “integralização vazia”.

## 7. Integração esperada entre rota, scraper e store

O agente deve escolher a menor alteração coerente com a arquitetura atual. O contrato precisa atender ao seguinte fluxo:

1. A rota autenticada obtém o registro anterior usando `req.uid` no backend.
2. A rota passa ao scraper somente os dados anteriores necessários para decidir a validade do histórico (`integralizacao` e metadados), além da opção `forceHistory`.
3. O scraper continua sem dependência direta do Firebase Admin/Firestore; recebe dados por parâmetros e devolve o resultado e o relatório de estados.
4. A rota solicita ao store a consolidação e gravação atômica do registro final, incluindo o relatório de estados.
5. O store lê o documento mais recente dentro da transação, faz a mesclagem por identidade de turma e preserva dados diante de falhas.
6. A rota invalida o cache da Agy somente após a gravação concluída.
7. A resposta da API informa se a sincronização foi completa ou parcial, mantendo o contrato utilizado pelo frontend sempre que possível.

A leitura inicial usada para avaliar o TTL e a leitura dentro da transação final têm objetivos diferentes: a primeira fornece ao scraper o snapshot existente antes da consulta externa; a segunda protege contra atualizações concorrentes durante o tempo em que o SIGAA está sendo consultado. Evitar outras leituras redundantes.

## 8. Testes obrigatórios

Usar o padrão de testes existente no projeto. Se a suíte `server/scripts/test-scraper-unificado.js` criada na Requisição 1 estiver presente, preservá-la e executá-la. Não usar credenciais reais do SIGAA nos testes automatizados.

### 8.1 Testes do parser de frequência

1. `Presente` incrementa `presentes` e não incrementa faltas.
2. `Ausente` incrementa `ausentes` em 1 e `totalFaltas` em 1.
3. `Falta` e `Faltou` sem quantidade explícita contam uma falta.
4. `4 Falta(s)` incrementa `ausentes` em 1 e `totalFaltas` em 4.
5. Variações de singular/plural, acentuação, espaços e maiúsculas/minúsculas são tratadas corretamente.
6. `Não Registrada` incrementa apenas `naoRegistradas`.
7. Situação desconhecida incrementa apenas `outros`.
8. O texto original de `situacao` permanece disponível no registro.
9. O resumo oficial do SIGAA continua extraído sem ser recalculado a partir dos registros individuais.
10. `turma.faltas` recebe `totalFaltas` da frequência disponível e não é sobrescrito pelo zero do relatório de notas.

### 8.2 Testes de mesclagem e persistência

1. Notas anteriores válidas + nova consulta `failed` = preservar notas e disponibilidade anteriores.
2. Frequência anterior válida + nova consulta `failed` = preservar frequência, percentual, faltas e disponibilidade anteriores.
3. Notas `failed` + frequência `available` = atualizar frequência e preservar notas anteriores.
4. Frequência `failed` + notas `available` = atualizar notas e preservar frequência anterior.
5. Uma turma falha e outras são atualizadas = persistir as atualizações das outras.
6. `not_launched` atualiza a disponibilidade para `false`, sem transformar ausência de lançamento em zero.
7. `failed` sem dado anterior mantém estado desconhecido/indisponível (`null` conforme o contrato), não afirma `not_launched`.
8. Importação manual sem notas/frequência/integralização preserva esses dados anteriores.
9. Dados gerais válidos do registro anterior são preservados quando a extração nova não os fornece.
10. Turmas são correlacionadas por `id` ou chave composta definida, nunca somente pelo nome se houver identificadores melhores.
11. Turmas de semestres antigos não são inseridas na lista de turmas atuais após mudança de semestre.
12. Falha de autenticação ou de extração estrutural essencial não substitui o documento anterior.
13. Testar a função de mesclagem de forma isolada e testar a transação do store com mock/fake apropriado, conforme os padrões do projeto.
14. Confirmar que dois usuários diferentes nunca compartilham registros durante a mesclagem.

### 8.3 Testes da validade do histórico

1. Integralização existente + metadados válidos + mesmo semestre + TTL vigente: reutilizar; não baixar PDF e não executar parser.
2. Sem integralização anterior: baixar e processar PDF.
3. Metadados ausentes/inválidos: atualizar.
4. TTL expirado: atualizar.
5. Semestre mudou: atualizar mesmo com TTL vigente.
6. `forceHistory: true`: atualizar mesmo com TTL vigente.
7. `forceHistory: false` ou omitido: respeitar a política normal.
8. Falha ao baixar/processar PDF com integralização anterior: preservar o dado e não avançar `lastSuccessfulAt`.
9. Falha ao baixar/processar PDF sem dado anterior: deixar indisponível e informar falha sem inventar valores.
10. TTL inválido: usar fallback de 24 horas.
11. Reutilização não avança `lastSuccessfulAt`; registra tentativa `reused` se esse estado fizer parte do contrato.
12. Mudança de semestre com falha de atualização não apresenta integralização antiga como atual.

### 8.4 Testes da rota

- `req.uid` é a única identidade usada para ler/mesclar/gravar o estudante.
- Dados acadêmicos enviados no corpo do frontend não são aceitos como fonte para mesclagem.
- `forceHistory` só é ativado pelo booleano `true`.
- O cache é invalidado apenas após persistência bem-sucedida.
- Uma falha parcial retorna estado parcial claro e não impede salvar as categorias que foram atualizadas com sucesso.
- Uma falha total não persiste um objeto parcial.

## 9. Compatibilidade e comportamento que deve permanecer inalterado

Preservar:

- autenticação Firebase e autenticação SIGAA;
- isolamento por UID;
- fluxo JSF/RichFaces validado na Requisição 1;
- `openTurmaVirtual()`;
- `scrapeAcademicDataForTurma()` e o reaproveitamento/fallback de `ViewState`;
- localização dinâmica de `Ver Notas` e `Frequência`;
- formato das notas e campos de frequência consumidos pelo frontend e pela Agy, acrescentando somente campos compatíveis como `totalFaltas` e `quantidadeFaltas`;
- consulta sequencial das disciplinas, sem paralelizar requisições JSF;
- invalidação de cache após gravação válida;
- endpoint de consulta `/api/sync-university/current`.

Não alterar o `orchestrator.js`, a estratégia dos modelos Gemini ou o frontend nesta requisição, exceto se uma incompatibilidade direta impedir a preservação dos contratos atuais. Se isso ocorrer, explicar a necessidade e manter a alteração mínima.

## 10. Restrições explícitas

- Não reescrever o scraper inteiro.
- Não desfazer a Requisição 1 nem remover seu fallback GET.
- Não usar `merge: true` indiscriminadamente como única estratégia de mesclagem.
- Não tratar `not_launched` e `failed` como equivalentes.
- Não preencher campos ausentes com zero, arrays vazios ou objetos vazios só para satisfazer o schema.
- Não permitir que a importação manual apague dados reais não fornecidos por ela.
- Não confiar em `uid` ou `student` recebidos pelo frontend.
- Não adicionar Redis, outro banco, provedor de IA ou dependências externas.
- Não paralelizar as chamadas JSF.
- Não alterar componentes de frontend nesta etapa.
- Não adicionar cache temporal de notas/frequência nesta requisição; isso deve ser avaliado separadamente depois de medir a atualidade dos dados.
- Não fazer refatorações cosméticas ou reorganização ampla.
- Não apagar nem substituir testes ou alterações preexistentes no diretório de trabalho.
- Não fazer commit automaticamente.

## 11. Critérios de aceitação

A Requisição 2 só será considerada concluída quando:

- [ ] A interpretação de situações `N Falta(s)` estiver correta e coberta por testes.
- [ ] `turma.faltas` usar a contagem explícita do mapa de frequência quando disponível.
- [ ] Falhas técnicas em notas/frequência preservarem dados anteriormente válidos.
- [ ] `not_launched` continuar sendo tratado como estado confirmado e diferente de falha.
- [ ] Importação manual não apagar notas, frequência ou integralização que não foram fornecidas.
- [ ] A mesclagem das turmas usar identificadores estáveis.
- [ ] A gravação final for feita com estratégia transacional ou mecanismo equivalente seguro contra atualização concorrente.
- [ ] Falhas totais não substituírem o registro anterior por um objeto incompleto.
- [ ] O histórico seja reutilizado dentro do TTL no mesmo semestre, sem baixar/processar PDF novamente.
- [ ] Ausência de histórico, metadados inválidos, TTL vencido, mudança de semestre ou atualização forçada provoquem nova consulta.
- [ ] Falha de atualização do histórico preserve a última integralização válida sem avançar o timestamp de sucesso.
- [ ] Os contratos atuais usados pelo frontend e Agy continuem compatíveis.
- [ ] Testes automatizados relevantes passem.
- [ ] `npm run build` passe.
- [ ] O relatório final liste arquivos, lógica de mesclagem, política TTL, testes e limitações.
- [ ] Nenhum commit automático seja criado.

## 12. Relatório final exigido do agente

Ao terminar, apresentar:

1. Arquivos modificados e motivo de cada alteração.
2. Como o registro anterior é obtido e como o UID é protegido.
3. Como funciona a mesclagem por estudante, turma e categoria.
4. Comportamento preciso de `available`, `not_launched`, `failed` e campo não fornecido.
5. Como `N Falta(s)` é interpretado e como `turma.faltas` é calculado.
6. Nome da variável de ambiente e valor de fallback do TTL.
7. Como o semestre é identificado e quando o PDF é reutilizado/atualizado.
8. Como a atualização forçada é solicitada.
9. Resultados dos testes automatizados e do `npm run build`.
10. Se houve teste manual contra SIGAA; não afirmar teste real se apenas fixtures/mocks foram usados.
11. Confirmação de que não houve commit automático.
12. Limitações ou decisões que ainda exigem validação manual.

Se algum requisito não puder ser implementado com segurança, não improvisar nem ampliar o escopo. Informar o bloqueio e deixar o comportamento correspondente sem alteração destrutiva.

## 13. Instrução de execução

Execute exclusivamente esta Requisição 2.

Antes de editar:

1. inspecione `git status --short` e preserve todas as alterações existentes;
2. leia os arquivos atuais listados na seção 3;
3. trace o fluxo autenticado até `syncWithSigaa()` e até a gravação no Firestore;
4. confirme onde e como o relatório de estados das consultas chega à persistência;
5. apresente um diagnóstico curto da estratégia mínima antes de fazer alterações.

Depois implemente somente o escopo desta requisição, adicione/adapte testes e execute as verificações.

Não execute requisições futuras, não faça commit e não altere arquivos fora do escopo sem necessidade demonstrável.
