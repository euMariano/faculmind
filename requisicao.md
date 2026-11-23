# Requisição 1 — Unificar a consulta de notas e frequência por disciplina

**Projeto:** FaculMind  
**Área:** `server/services/sigaaScraper.js` e integração com `sigaaParser.js`  
**Prioridade:** Alta  
**Tipo:** Otimização localizada de desempenho e organização do scraper  
**Escopo desta requisição:** somente a consulta de notas e frequência das turmas do semestre atual.

---

## 1. Objetivo

Reduzir o número de requisições feitas ao SIGAA durante a sincronização, evitando abrir a mesma Turma Virtual duas vezes para consultar informações diferentes.

Atualmente, o scraper abre cada disciplina uma vez para consultar as notas e abre novamente a mesma disciplina para consultar a frequência. Queremos abrir a Turma Virtual uma única vez por disciplina e, a partir dessa sessão/página, consultar as duas informações em sequência.

A otimização deve preservar o comportamento atual, os dados extraídos, os estados de disponibilidade e o tratamento independente de falhas.

**Não é uma autorização para reescrever o scraper inteiro.** A implementação deve ser incremental, localizada e compatível com a arquitetura existente.

## 2. Diagnóstico do fluxo atual

O arquivo principal é `server/services/sigaaScraper.js`.

As funções relevantes são:

- `openTurmaVirtual(session, turma)`
- `scrapeNotesForTurma(session, turma, matricula)`
- `scrapeFrequencyForTurma(session, turma)`
- `submitJsfLink(session, $, $link, referer)`
- `syncWithSigaa(username, password, options)`

A função `openTurmaVirtual()` realiza atualmente três requisições HTTP:

1. GET do Portal do Discente (`/sigaa/portais/discente/discente.jsf`);
2. POST para abrir a seleção de turmas;
3. POST para abrir a Turma Virtual da disciplina selecionada.

Depois disso, `scrapeNotesForTurma()` faz mais um POST para `Ver Notas`, e `scrapeFrequencyForTurma()` faz outro POST para `Frequência`.

Entretanto, `syncWithSigaa()` executa duas iterações independentes:

- primeiro percorre todas as disciplinas para consultar notas;
- depois percorre todas novamente para consultar frequência.

Como as duas funções chamam `openTurmaVirtual()`, a navegação inicial é repetida para cada disciplina.

### 2.1 Custo atual estimado

Por disciplina:

| Operação | Requisições HTTP |
|---|---:|
| Abrir Portal, seleção e Turma Virtual | 3 |
| Consultar notas | 1 |
| Abrir Portal, seleção e Turma Virtual novamente | 3 |
| Consultar frequência | 1 |
| **Total atual** | **8** |

Com seis disciplinas, isso representa aproximadamente 48 requisições nessa etapa da sincronização.

### 2.2 Custo desejado

Por disciplina:

| Operação | Requisições HTTP |
|---|---:|
| Abrir Portal, seleção e Turma Virtual | 3 |
| Consultar notas | 1 |
| Consultar frequência | 1 |
| **Total desejado** | **5** |

Com seis disciplinas, a expectativa é reduzir de aproximadamente 48 para 30 requisições nessa etapa: 18 requisições a menos, uma redução de 37,5% no número estimado de requisições por disciplina.

Esses números são estimativas baseadas no fluxo atual. O agente deve medir ou conferir o fluxo implementado, sem afirmar uma redução de tempo em segundos antes de testar.

## 3. Comportamento desejado

Criar um fluxo combinado, por exemplo `scrapeAcademicDataForTurma(session, turma, matricula)`, que:

1. chame `openTurmaVirtual()` uma única vez;
2. consulte as notas;
3. consulte a frequência;
4. retorne os dois resultados separadamente;
5. permita que uma das consultas falhe ou ainda não tenha sido lançada sem impedir a outra.

O nome da função pode ser ajustado, desde que sua responsabilidade permaneça clara.

A sincronização deve percorrer as turmas uma vez, executando o fluxo combinado para cada disciplina. Não deve manter dois loops que reabram a mesma Turma Virtual para cada tipo de informação.

## 4. Requisito crítico: preservar o estado JSF entre as consultas

O SIGAA utiliza JSF/RichFaces. A requisição depende de campos dinâmicos, principalmente:

- `javax.faces.ViewState`;
- o campo que identifica o painel ativo do RichFaces, atualmente localizado pelo seletor `input[id$="_panelBarInput"]`;
- os parâmetros de comando extraídos do `onclick` do link.

A função `submitJsfLink()` já implementa esse mecanismo e deve continuar sendo utilizada.

### 4.1 Não reutilizar um ViewState antigo

Depois de executar `Ver Notas`, a resposta HTTP pode conter uma nova página JSF com um `ViewState` atualizado.

A consulta seguinte de frequência deve utilizar o formulário e o `ViewState` válidos da página mais recente, não simplesmente reutilizar o HTML inicial da Turma Virtual.

O agente deve inspecionar a resposta da consulta de notas e verificar se ela contém o menu `formMenu` e o link `Frequência`.

- Se a resposta de notas contiver o formulário e o menu atualizados, localizar `Frequência` nessa resposta e enviar a próxima requisição a partir dela.
- Se a resposta não contiver o menu/formulário necessário, fazer, se necessário, um GET da própria `classUrl` para obter uma página atualizada da Turma Virtual e seu `ViewState`.
- Não repetir o fluxo completo de Portal do Discente → seleção da disciplina → abertura da Turma Virtual somente para obter um formulário atualizado.

A segunda requisição deve continuar utilizando `submitJsfLink()`, que extrai o comando JSF e sincroniza o painel RichFaces.

### 4.2 IDs dinâmicos

Não fixar identificadores como:

- `formMenu:j_id_jsp_1879301362_99` (Ver Notas);
- `formMenu:j_id_jsp_1879301362_96` (Frequência).

Esses valores podem mudar.

Continuar localizando os itens pelo texto dentro de `.itemMenu`, utilizando `normalizeSigaaLabel()`:

- `ver notas`;
- `frequencia`.

Depois, deixar `extractJsfCommand()` e `submitJsfLink()` extraírem os parâmetros atuais do `onclick`.

## 5. Independência entre notas e frequência

Notas e frequência são consultas independentes. A implementação não pode usar um `return` ou `continue` que encerre todo o processamento da disciplina quando somente uma das informações estiver indisponível.

Exemplos obrigatórios:

- Se o SIGAA informar que as notas ainda não foram lançadas, ainda devemos tentar consultar a frequência.
- Se o SIGAA informar que a frequência ainda não foi lançada, devemos preservar as notas que foram extraídas.
- Se a extração do relatório de notas falhar, a rotina deve tentar consultar a frequência quando for tecnicamente seguro obter/recuperar um formulário JSF válido.
- Se a extração da frequência falhar, o resultado válido das notas deve ser mantido.

O retorno combinado deve separar claramente os estados de cada consulta. Uma estrutura equivalente a esta é adequada (pode ser ajustada):

```js
{
  notas: {
    status: "available" | "not_launched" | "failed",
    data: null,
    error: null
  },
  frequencia: {
    status: "available" | "not_launched" | "failed",
    data: null,
    error: null
  }
}
```

Regras para os estados:

- `available`: o relatório foi encontrado e interpretado com sucesso;
- `not_launched`: o SIGAA indicou explicitamente que o professor ainda não lançou aquela informação;
- `failed`: ocorreu uma falha de requisição, estrutura inesperada ou parsing.

Não transformar uma falha técnica em `not_launched`.
Não transformar `not_launched` em zero notas, zero faltas ou zero frequência.
Não interpretar `Não Registrada` como ausência/falta.

Se uma requisição JSF falhar de modo que o estado da sessão fique incerto, não inventar um estado válido. Registrar a falha e tentar recuperar uma página válida da Turma Virtual antes da próxima consulta, se isso for seguro.

## 6. Preservar os parsers e o formato dos dados

O arquivo `server/services/sigaaParser.js` já possui:

- `parseSigaaNotesReport(html, matricula)`;
- `parseSigaaFrequencyReport(html)`;
- `parseHistoricoPendentes(pdfBuffer)`;
- `formatSigaaScrapedData(...)`.

Esses parsers já estão funcionando com os HTMLs reais observados no SIGAA.

**Não reescrever nem simplificar esses parsers nesta requisição.** Reutilizar as funções existentes.

### 6.1 Formato das notas

Preservar o objeto produzido por `parseSigaaNotesReport()` e a atribuição atual a `turma.notas`, incluindo:

- `unidade1`;
- `unidade2`;
- `unidade3`;
- `mediaParcial`;
- `avaliacoes`;
- `mediaAvaliacoes`;
- `provaFinal`;
- `resultado`;
- `situacao`.

Preservar também a atualização de `turma.faltas` quando `extractedNotes.faltas !== null`.

### 6.2 Formato da frequência

Preservar o resultado produzido por `parseSigaaFrequencyReport()`:

- `registros`;
- `totalRegistros`;
- `contagem.presentes`;
- `contagem.ausentes`;
- `contagem.naoRegistradas`;
- `contagem.outros`;
- `resumo.presencasRegistradas`;
- `resumo.aulasComRegistro`;
- `resumo.percentualAulasRegistradas`;
- `resumo.aulasDefinidasCargaHoraria`;
- `resumo.percentualCargaHoraria`.

Preservar as atribuições:

- `turma.frequenciaDisponivel`;
- `turma.frequencia`;
- `turma.presencaPercentual`, usando `resumo.percentualCargaHoraria` somente quando esse valor não for `null`.

### 6.3 Campos de disponibilidade

Manter a distinção entre:

- `true`: informação extraída com sucesso;
- `false`: SIGAA informou explicitamente que a informação ainda não foi lançada;
- `null` ou estado não atualizado: consulta ainda não concluída ou informação desconhecida.

Não marcar uma consulta com erro técnico como `false`.

## 7. Como reorganizar `syncWithSigaa()`

Atualmente, `syncWithSigaa()` possui um loop completo para notas e, depois, outro loop completo para frequência.

Substituir esses dois loops por um único loop sobre `currentTurmas`, que invoque o fluxo combinado.

Manter resumos separados para notas e frequência, por exemplo:

```js
const notesSummary = {
  total: currentTurmas.length,
  updated: 0,
  notLaunched: 0,
  failed: [],
};

const frequencySummary = {
  total: currentTurmas.length,
  updated: 0,
  notLaunched: 0,
  failed: [],
};
```

Cada resumo deve refletir o estado da sua própria consulta. Uma disciplina pode, por exemplo, ter notas disponíveis e frequência não lançada.

Manter os logs por disciplina e os resumos finais. Evitar logs que imprimam valores de campos ocultos sem necessidade. Não registrar senha, cookies, tokens ou dados pessoais sensíveis.

## 8. Não executar as duas consultas em paralelo na mesma sessão

Não utilizar `Promise.all()` para disparar simultaneamente as ações JSF de notas e frequência na mesma sessão `CookieJar`.

A sessão e o `ViewState` são compartilhados e mutáveis. As ações devem ser sequenciais, aproveitando a resposta mais recente para preparar a próxima requisição.

A otimização desta tarefa vem de eliminar a navegação duplicada, não de paralelizar indiscriminadamente chamadas JSF.

## 9. Escopo permitido

Arquivos e áreas que podem ser alterados:

- `server/services/sigaaScraper.js`;
- testes específicos do scraper, caso já existam e seja necessário atualizá-los.

Pode-se fazer ajustes pontuais no parser apenas se forem estritamente necessários para manter compatibilidade, mas não se deve reescrever `sigaaParser.js` nem mudar o formato dos dados sem justificar e demonstrar a necessidade.

## 10. Fora do escopo desta requisição

Não implementar agora:

1. cache ou validade da integralização/histórico PDF;
2. cache ou validade de notas e frequência entre sincronizações;
3. reutilização de dados antigos do Firestore;
4. mudanças em `server/data/store.js`;
5. mudanças na rota `/api/sync-university` ou em outras rotas;
6. alterações no formato de persistência do Firestore;
7. alterações no `orchestrator.js`, Gemini ou modelos de IA;
8. consultas acadêmicas determinísticas para a Agy;
9. sincronização paralela de disciplinas;
10. refatoração geral, renomeação em massa ou reorganização de diretórios.

Esses assuntos serão tratados em requisições separadas, depois que esta otimização estiver validada.

## 11. Testes e validação obrigatórios

Antes de concluir:

1. Executar `npm run build` e corrigir somente erros introduzidos por esta alteração.
2. Executar verificações de sintaxe/testes existentes para os arquivos alterados, se disponíveis.
3. Fazer uma sincronização real de teste com o SIGAA, usando a sessão e credenciais já configuradas pelo projeto. Não inserir credenciais no código ou no relatório.
4. Confirmar nos logs que cada disciplina do semestre atual passa por `openTurmaVirtual()` uma única vez no fluxo combinado.
5. Confirmar que notas e frequência continuam sendo consultadas para cada disciplina.
6. Confirmar que uma consulta com estado `not_launched` não impede a outra consulta.
7. Confirmar que as falhas de notas e frequência são registradas separadamente.
8. Confirmar que uma falha de uma consulta não apaga o resultado válido da outra.
9. Confirmar que não foram introduzidos IDs JSF dinâmicos hardcoded.
10. Comparar o número de requisições por disciplina antes e depois. Não afirmar ganho de tempo sem medir o tempo real.

### 11.1 Casos reais já observados

No semestre `2026.2`, a sincronização anterior encontrou seis turmas:

- CT506 — Contabilidade Geral para Secretariado;
- CI581 — Desenvolvimento em Liderança;
- AD446 — Empreendedorismo em Secretariado;
- AD447 — Inglês para Negócios 1;
- AD195 — Microanálise das Organizações;
- AD437 — Ética e Responsabilidade Sócio-Ambiental.

Na consulta de notas, algumas disciplinas retornaram o aviso de que as notas ainda não foram lançadas, enquanto outras retornaram relatórios válidos.

Na consulta de frequência, cinco disciplinas foram extraídas. A CI581 não apresentava tabela porque a frequência ainda não havia sido lançada pelo professor. Esse caso deve ser classificado como `not_launched` quando a página real indicar explicitamente essa situação, e não como erro de parsing.

Não codificar os resultados acima como dados fixos. São apenas referências para validar que os estados continuam sendo tratados corretamente.

## 12. Critérios de aceitação

A tarefa estará concluída somente quando:

- [ ] Cada disciplina for aberta na Turma Virtual uma única vez durante a sincronização combinada.
- [ ] Notas e frequência forem consultadas sequencialmente a partir da mesma navegação da disciplina.
- [ ] O `ViewState` e o painel RichFaces forem obtidos da página JSF válida mais recente.
- [ ] Os identificadores dos comandos JSF continuarem sendo descobertos dinamicamente pelo texto dos links.
- [ ] Uma consulta não bloquear a outra quando estiver `not_launched`.
- [ ] Falhas técnicas forem diferenciadas de informações ainda não lançadas.
- [ ] Os parsers existentes e a estrutura dos objetos acadêmicos forem preservados.
- [ ] Os logs apresentarem resumos independentes de notas e frequência.
- [ ] `npm run build` passar.
- [ ] Nenhuma alteração fora do escopo for realizada.

## 13. Entrega esperada do agente

Ao concluir, apresentar:

1. resumo das alterações realizadas;
2. lista exata dos arquivos modificados;
3. explicação de como o `ViewState` é atualizado entre notas e frequência;
4. contagem estimada/observada de requisições por disciplina antes e depois;
5. resultado de `npm run build`;
6. resultado do teste real de sincronização, incluindo contagens de sucesso, `not_launched` e falhas para notas e frequência;
7. limitações ainda existentes ou testes que não puderam ser executados.

**Não fazer commit automaticamente. Não descartar alterações existentes. Não executar `git reset --hard`, `git checkout --`, `git clean` ou comandos destrutivos.** Antes de editar, verificar `git status` e respeitar todas as alterações já presentes no diretório de trabalho.

Se encontrar uma necessidade que ultrapasse o escopo, interromper essa parte, explicar o motivo e reportar a necessidade em vez de ampliar a refatoração por conta própria.

---

## 14. Ideias para requisições futuras — não implementar nesta tarefa

Os tópicos abaixo são uma visão do trabalho futuro. Eles não fazem parte da Requisição 1 e não autorizam alterações agora.

- **Requisição 2 — Sincronização incremental:** ler os dados existentes no Firestore, definir validade por grupo de dados (histórico, notas, frequência, perfil) e atualizar apenas o que estiver vencido ou tiver sido solicitado em uma sincronização forçada.
- **Requisição 3 — Persistência resiliente:** preservar os últimos dados válidos quando uma consulta falhar, aplicando atualizações parciais por disciplina e evitando substituir informações válidas por `null` ou dados incompletos.
- **Requisição 4 — Consultas acadêmicas locais para a Agy:** responder diretamente no backend a perguntas estruturadas sobre CR, integralização, disciplinas pendentes, notas e frequência, recorrendo ao Gemini para perguntas abertas e explicações.
- **Requisição 5 — Simplificação do provedor de IA:** revisar tentativas, fallback, limites de contexto e mensagens de indisponibilidade, sem introduzir dependência paga.
- **Requisição 6 — Observabilidade de desempenho:** medir duração e quantidade de requisições por etapa da sincronização e latência por tipo de resposta da Agy.

Cada tópico deverá receber uma requisição independente, com escopo, critérios de aceitação e validação próprios.
