# Briefing técnico — Integração real com o SIGAA UFPE no Facul Mind

## 1. Contexto e objetivo

Estou desenvolvendo o **Facul Mind**, uma plataforma universitária com assistente de IA, painel acadêmico e funcionalidades de apoio ao estudante.

Repositório: https://github.com/euMariano/faculmind

O projeto possui frontend em React + TypeScript, backend em Node.js + Express e uma integração experimental com o SIGAA UFPE.

O objetivo da integração é permitir que o estudante autentique sua própria conta institucional e que o Facul Mind obtenha informações acadêmicas reais, especialmente:

1. Disciplinas matriculadas no período atual.
2. Histórico de disciplinas por período.
3. Código, turma, carga horária, horário e local das disciplinas.
4. Notas e médias, quando disponíveis no SIGAA.
5. Faltas e frequência, quando disponíveis no SIGAA.
6. CRA e demais informações acadêmicas, quando houver uma fonte comprovada.

Essas informações alimentarão o painel acadêmico e o contexto da assistente Agy.

**Sua tarefa não é inventar uma API ou simular dados acadêmicos. É investigar o funcionamento real do SIGAA da UFPE, implementar uma extração confiável e integrar os resultados ao projeto existente.**

---

# 2. Regra fundamental: não inventar informações

O maior problema da implementação atual é que ela tenta interpretar estruturas genéricas do SIGAA e preenche informações ausentes com valores fictícios.

Isso precisa acabar.

Siga rigorosamente estas regras:

- Não invente endpoints, URLs, parâmetros ou campos do SIGAA.
- Não presuma que todas as universidades utilizam a mesma estrutura de páginas do SIGAA.
- Não presuma que todas as tabelas HTML representam disciplinas.
- Não atribua notas, faltas, CRA, matrícula, professor ou carga horária sem encontrar esses dados em uma fonte real.
- Não use valores padrão fictícios para preencher campos ausentes.
- Não considere que uma autenticação bem-sucedida significa que os dados acadêmicos foram extraídos.
- Não considere que uma tabela com disciplinas de vários períodos representa somente as matrículas atuais.
- Não considere que a ausência de dados significa zero.
- Não retorne sucesso quando o scraper não conseguiu extrair os dados solicitados.

**Se uma informação não puder ser extraída, ela deverá ser representada como `null`, uma lista vazia ou um estado explicitamente indisponível, conforme o contrato de dados.**

Se não souber onde determinado dado está localizado, investigue a página autenticada, seus links, formulários e requisições antes de implementar.

Sempre diferencie:

- Informação confirmada pelo HTML.
- Informação extraída por inferência.
- Informação ainda não investigada.
- Informação indisponível.

Não transforme inferências em dados oficiais.

---

# 3. Descobertas já confirmadas no SIGAA UFPE

Foi desenvolvido um projeto Python independente chamado `sigaa-ufpe-tools` para investigar o portal.

A autenticação foi testada com sucesso utilizando `httpx`, `BeautifulSoup` e `lxml`, sem necessidade de Playwright ou Puppeteer.

## 3.1. Endereço de autenticação

URL inicial:

`https://sigaa.ufpe.br/sigaa/verTelaLogin.do`

A página retorna HTTP 200.

O formulário de autenticação possui os seguintes campos:

- `width`
- `height`
- `urlRedirect`
- `subsistemaRedirect`
- `acao`
- `acessibilidade`
- `user.login`
- `user.senha`

O formulário contém campos ocultos que precisam ser extraídos dinamicamente.

O atributo `action` também é dinâmico. Durante os testes, apresentou uma estrutura semelhante a:

`/sigaa/logar.do;jsessionid=...?...dispatch=logOn`

**Não fixe o JSESSIONID nem o endereço completo do action no código.**

Ele deve ser obtido a partir do formulário recebido na sessão atual.

O login é realizado por POST, utilizando os campos do formulário e as credenciais fornecidas pelo próprio usuário.

## 3.2. Autenticação e sessão

O fluxo confirmado foi:

1. Criar uma sessão HTTP persistente.
2. Acessar a página de login.
3. Obter cookies e campos ocultos.
4. Extrair o formulário de autenticação.
5. Preencher os campos de usuário e senha.
6. Enviar o POST para o action encontrado no HTML.
7. Manter os cookies recebidos.
8. Verificar a resposta e o redirecionamento.

Resultado observado:

- HTTP 200 após o login.
- URL final: `https://sigaa.ufpe.br/sigaa/portais/discente/discente.jsf`
- Cookie de sessão ativo.
- Formulário de login não aparece mais na página retornada.

Isso foi considerado um login bem-sucedido nos testes.

O SIGAA utiliza sessões com cookies, incluindo `JSESSIONID`.

A sessão precisa ser mantida durante todas as requisições autenticadas.

## 3.3. Estrutura JSF

As páginas autenticadas apresentam características de JavaServer Faces (JSF).

Foram encontrados formulários POST contendo campos como:

- Identificadores de formulário.
- `javax.faces.ViewState`.

Isso significa que determinadas navegações podem depender do estado da página.

Ao implementar navegações por POST, investigue os formulários reais e preserve os campos ocultos necessários, inclusive o ViewState atualizado.

Não invente nomes de botões, parâmetros ou identificadores de formulário.

---

# 4. Páginas autenticadas já identificadas

## 4.1. Portal do Discente

URL:

`/sigaa/portais/discente/discente.jsf`

Esta é a página principal após o login.

Foram identificadas as seguintes áreas e funcionalidades:

- Últimas atualizações.
- Disciplinas do período.
- Local das aulas.
- Horários.
- Chat.
- Atividades.
- Caixa postal.
- Menu do discente.

A página possui diversas tabelas e formulários.

**Atenção:** nem todas as tabelas são tabelas acadêmicas de disciplinas. Existem tabelas de fóruns, atualizações e outras funcionalidades.

Uma tabela do portal contém os seguintes cabeçalhos:

| Componente Curricular | Local | Horário | | Chat |
|---|---|---|---|---|

Essa é a tabela que apresentou as disciplinas do período 2026.2 durante os testes.

Ela não possui `id` nem classes CSS na tag `<table>`.

Portanto, não procure essa tabela exclusivamente por `table.listagem`, por ID ou por uma classe CSS.

O critério que funcionou foi identificar a tabela pelo conteúdo de seus cabeçalhos, especialmente `Componente Curricular`.

## 4.2. Estrutura real da tabela de disciplinas atuais

A estrutura HTML observada foi:

**Cabeçalho:**

- `th`: Componente Curricular
- `th`: Local
- `th`: Horário
- `th`: vazio
- `th`: Chat, com `colspan="2"`

**Linha de período:**

- `td`: `2026.2`
- `colspan="5"`

**Linhas das disciplinas:**

A primeira célula possui a classe `descricao`.

As células de local e horário possuem a classe `info`.

Exemplo de estrutura:

```html
<tr>
    <td class="descricao">
        CONTABILIDADE GERAL PARA SECRETARIADO
    </td>
    <td class="info">
        CCSA/Sala B10
    </td>
    <td class="info">
        5N2345 (10/08/2026 - 12/12/2026)
    </td>
    ...
</tr>
```

Após cada disciplina, há uma linha vazia com uma célula `td` que possui `colspan="5"`.

Essa linha deve ser ignorada pelo parser.

Os links encontrados nas células de descrição utilizam `href="#"`. Não trate esses links como endpoints reais sem investigar os eventos JavaScript associados.

## 4.3. Disciplinas encontradas no Portal do Discente

Durante os testes, a tabela apresentou seis disciplinas no período 2026.2:

| Disciplina | Local | Horário |
|---|---|---|
| CONTABILIDADE GERAL PARA SECRETARIADO | CCSA/Sala B10 | 5N2345 |
| DESENVOLVIMENTO EM LIDERANÇA | CTG | 4T3456 |
| EMPREENDEDORISMO EM SECRETARIADO | CCSA/Sala B10 | 6N2345 |
| ÉTICA E RESPONSABILIDADE SÓCIO-AMBIENTAL | CCSA/Sala B10 | 4N2345 |
| INGLÊS PARA NEGÓCIOS 1 | CCSA/Sala B10 | 2N2345 |
| MICROANALISE DAS ORGANIZACOES | CCSA/Sala B10 | 3N2345 |

Todas as seis apresentaram o intervalo:

`10/08/2026 - 12/12/2026`

Essas são informações observadas no Portal do Discente durante os testes, não dados simulados.

A tabela indica as disciplinas exibidas no portal para o período 2026.2. Preserve a origem e o contexto da informação ao armazená-la.

---

# 5. Outra página identificada: Todas as Turmas

URL:

`/sigaa/portais/discente/turmas.jsf`

Essa página foi identificada através do link "Ver turmas anteriores" no portal.

O breadcrumb apresentado foi:

`Portal do Discente > Todas as Turmas`

Ela possui uma tabela com os cabeçalhos:

| Disciplina | Turma | CH Total | Horário |
|---|---|---|---|

A tabela utiliza a classe:

`table.listagem`

A mesma classe CSS pode aparecer em outras tabelas do SIGAA. Portanto, não selecione uma tabela apenas pela classe. Identifique também os cabeçalhos.

## 5.1. Estrutura por período

As disciplinas são organizadas por períodos acadêmicos.

Cada período aparece em uma linha com:

`td.periodo`

Exemplos encontrados:

- `2026.2`
- `2026.1`
- `2025.2`
- `2025.1`

A linha de período é seguida pelas disciplinas correspondentes.

## 5.2. Disciplinas de 2026.2 encontradas nessa página

| Código | Disciplina | Turma | Carga horária |
|---|---|---|---|
| CT506 | CONTABILIDADE GERAL PARA SECRETARIADO | SE04 | 60h |
| CI581 | DESENVOLVIMENTO EM LIDERANÇA | 01 | 60h |
| AD446 | EMPREENDEDORISMO EM SECRETARIADO | SE04 | 60h |
| AD447 | INGLÊS PARA NEGÓCIOS 1 | SE04 | 60h |
| AD195 | MICROANALISE DAS ORGANIZACOES | SE04 | 60h |
| AD437 | ÉTICA E RESPONSABILIDADE SÓCIO-AMBIENTAL | SE04 | 60h |

Os horários dessa página também incluem o intervalo de datas.

## 5.3. Outros períodos encontrados

A página apresentou:

- 2026.1: 5 disciplinas.
- 2025.2: 5 disciplinas.
- 2025.1: 5 disciplinas.

Foram extraídas 21 disciplinas ao todo, distribuídas entre quatro períodos.

**Importante:** essa página é uma listagem de turmas de vários períodos. Não use todos os registros como se fossem matrículas atuais.

---

# 6. Como combinar as duas páginas

As duas páginas oferecem informações complementares.

O Portal do Discente apresenta as disciplinas do período, seus locais e horários.

A página Todas as Turmas apresenta códigos, turmas e cargas horárias, organizados por período.

Para o período 2026.2, os nomes das disciplinas coincidem nas duas páginas.

A correspondência observada é:

| Nome | Código | Turma | CH |
|---|---|---|---|
| CONTABILIDADE GERAL PARA SECRETARIADO | CT506 | SE04 | 60h |
| DESENVOLVIMENTO EM LIDERANÇA | CI581 | 01 | 60h |
| EMPREENDEDORISMO EM SECRETARIADO | AD446 | SE04 | 60h |
| ÉTICA E RESPONSABILIDADE SÓCIO-AMBIENTAL | AD437 | SE04 | 60h |
| INGLÊS PARA NEGÓCIOS 1 | AD447 | SE04 | 60h |
| MICROANALISE DAS ORGANIZACOES | AD195 | SE04 | 60h |

Uma estratégia possível é combinar os registros utilizando período e nome normalizado como critérios de correspondência.

Entretanto:

- Não associe disciplinas apenas pela posição na lista.
- Não faça correspondência somente pelo nome sem considerar o período.
- Não descarte acentos ou diferenças textuais de forma que possa gerar correspondências incorretas.
- Se houver mais de uma correspondência possível, sinalize a ambiguidade.
- Preserve os dados originais e a origem de cada campo.

---

# 7. Modelo de dados esperado

O projeto atualmente possui a interface `StudentTurma` em `src/types/index.ts`.

Ela já contém:

- `id`
- `codigo`
- `disciplina`
- `turma`
- `docente`
- `horario`
- `local`
- `faltas`
- `maxFaltasPermitidas`
- `totalAulas`
- `presencaPercentual`
- `notas`
- `status`

Não é necessário destruir essa estrutura, mas ela precisa ser revisada para não obrigar o scraper a inventar informações.

Sugestão de estrutura conceitual:

```ts
interface StudentTurma {
    id: string;
    periodo: string;

    codigo: string | null;
    disciplina: string;
    turma: string | null;

    cargaHoraria: number | null;
    horario: string | null;
    local: string | null;

    docente: string | null;

    faltas: number | null;
    totalAulas: number | null;
    presencaPercentual: number | null;

    notas: {
        unidade1: number | null;
        unidade2: number | null;
        unidade3: number | null;
        mediaParcial: number | null;
    };

    status: string | null;
}
```

Ajuste os tipos e os componentes consumidores conforme necessário.

**Não converta ausência de informação em zero.**

Por exemplo:

- `faltas: null` significa que faltas não foram consultadas ou não estavam disponíveis.
- `faltas: 0` significa que o SIGAA apresentou explicitamente zero faltas.
- `mediaParcial: null` significa que não foi possível obter uma média.
- `cra: null` significa que o CRA não foi extraído.

O modelo `StudentAcademicRecord` também deve permitir informações indisponíveis sem obrigar a criação de valores fictícios.

Considere acrescentar metadados de origem e atualização, por exemplo:

- Origem da informação.
- Data e hora da sincronização.
- Páginas efetivamente consultadas.
- Campos disponíveis.
- Campos indisponíveis.
- Estado da sincronização.

---

# 8. Informações ainda não investigadas

Até o momento, NÃO foi confirmado onde o SIGAA UFPE disponibiliza os seguintes dados:

1. CRA.
2. Notas por unidade.
3. Média parcial.
4. Faltas por disciplina.
5. Frequência percentual.
6. Histórico acadêmico completo.
7. Situação de aprovação ou reprovação.
8. Dados de integralização curricular.
9. Horas complementares.
10. Informações detalhadas do perfil acadêmico.

Não invente rotas para obter esses dados.

Investigue o portal autenticado, os menus, formulários, links e requisições realizadas pelo navegador.

O objetivo é descobrir as páginas verdadeiras e os dados que cada uma fornece.

**Uma observação importante:** a página `/sigaa/portais/discente/perfil.jsf` foi investigada e apresentou o título "Editar Perfil". Ela contém dados pessoais e opções de edição/autodeclaração. Não a trate como página de perfil acadêmico e não extraia informações pessoais sensíveis desnecessárias.

---

# 9. Problemas identificados na implementação atual do Facul Mind

Analise especialmente estes arquivos:

- `server/services/sigaaScraper.js`
- `server/services/sigaaParser.js`
- `server/index.js`
- `src/services/api.ts`
- `src/components/academic/SigaaSyncModal.tsx`
- `src/types/index.ts`

## 9.1. Problemas em sigaaScraper.js

A implementação atual procura tabelas utilizando:

```js
$('table.listagem, table.tabelaRelatorio, table.tabelaTurmas')
```

Isso não é suficiente.

A tabela de disciplinas do Portal do Discente encontrada nos testes não possui essas classes.

Além disso, a página possui várias tabelas com finalidades diferentes.

A lógica atual também assume que:

- A primeira célula contém a disciplina.
- A penúltima célula contém faltas.
- A última célula contém notas.

Essas suposições não foram comprovadas e podem gerar resultados incorretos.

O scraper também utiliza valores fixos e dados demonstrativos como fallback após uma extração malsucedida.

Isso é inaceitável em uma sincronização real.

## 9.2. Problemas em sigaaParser.js

O parser tenta identificar disciplinas utilizando expressões genéricas e heurísticas.

Em alguns casos, ele:

- Cria códigos artificiais.
- Define horários fictícios.
- Define locais genéricos.
- Assume limite de faltas.
- Calcula presença sem conhecer o total real de aulas.
- Calcula médias sem confirmar os critérios de avaliação.
- Cria CRA padrão.
- Define o período acadêmico como `2026.1`.
- Retorna disciplinas de fallback mesmo sem encontrá-las no HTML.

Essas funcionalidades devem ser removidas do fluxo de dados reais.

O parser precisa interpretar a estrutura efetivamente observada, não tentar adivinhar o conteúdo.

## 9.3. Problemas em server/index.js

A rota `/api/sync-university/import` cria informações padrão quando recebe determinadas estruturas de dados.

Por exemplo, define valores para:

- CRA.
- Semestre.
- Situação acadêmica.
- Nome.
- Curso.
- Alertas.

Esses valores não podem ser tratados como dados oficiais se não vierem de uma fonte comprovada.

A rota deve validar o conteúdo recebido e preservar somente os campos efetivamente fornecidos.

## 9.4. Problemas no SigaaSyncModal.tsx

O componente atualmente oferece:

- Sincronização em duas abas.
- Importação de HTML ou texto.
- Modo demonstração.

O bookmarklet tenta extrair dados de tabelas genéricas e cria valores de faltas e notas que não foram necessariamente encontrados.

Também envia `document.documentElement.outerHTML`, que pode incluir informações pessoais desnecessárias.

Investigue se esse fluxo pode ser substituído por uma integração real no backend, preservando a experiência da interface.

Se o bookmarklet continuar existindo, limite a extração aos elementos necessários e nunca envie dados pessoais desnecessários.

---

# 10. Arquitetura e integração com o projeto

O Facul Mind já utiliza:

- React 18.
- TypeScript.
- Tailwind CSS.
- Node.js.
- Express.
- Cheerio.
- Puppeteer.
- Firebase.
- Google Gemini.

A rota de sincronização atual é:

`POST /api/sync-university`

Existe também:

`GET /api/sync-university/current`

E uma rota de importação:

`POST /api/sync-university/import`

O projeto utiliza `StudentAcademicRecord` como contrato principal dos dados acadêmicos.

**Não reescreva a interface do Facul Mind sem necessidade.**

Priorize a correção da camada de extração, dos serviços, dos modelos e da integração com as rotas existentes.

Você pode propor mudanças arquiteturais se houver justificativa técnica, mas explique primeiro o motivo.

A autenticação e o scraping precisam funcionar no backend, sem expor credenciais ao frontend, ao Firebase ou ao agente de IA.

---

# 11. Segurança e privacidade

As credenciais do SIGAA pertencem ao estudante.

Regras obrigatórias:

1. Nunca persistir a senha do SIGAA.
2. Nunca persistir cookies ou JSESSIONID.
3. Nunca registrar senha, cookies ou tokens nos logs.
4. Não enviar credenciais para o Gemini.
5. Não armazenar HTML completo quando somente alguns campos forem necessários.
6. Manter as credenciais apenas durante a autenticação e a extração.
7. Encerrar a sessão quando a sincronização terminar.
8. Não compartilhar informações acadêmicas entre usuários.
9. Não utilizar dados de demonstração como se fossem dados reais.
10. Não executar operações que modifiquem a situação acadêmica do estudante.

A integração deve ser prioritariamente de leitura.

Não automatize matrícula, cancelamento, trancamento ou qualquer outra operação que altere dados acadêmicos.

Também revise a exposição das rotas de sincronização antes de qualquer deploy. Um endpoint público que recebe credenciais institucionais precisa de proteção adequada.

---

# 12. Estratégia recomendada de investigação

Não tente implementar tudo de uma vez.

Siga esta ordem:

### Etapa 1 — Autenticação

- Reproduzir o login real.
- Preservar cookies.
- Verificar a sessão.
- Detectar autenticação inválida.
- Detectar sessão expirada.

### Etapa 2 — Disciplinas do período atual

- Acessar `discente.jsf`.
- Localizar a tabela pelo cabeçalho `Componente Curricular`.
- Extrair o período.
- Extrair nome, local e horário.
- Ignorar linhas vazias.
- Validar o resultado.

### Etapa 3 — Histórico de turmas

- Acessar `turmas.jsf`.
- Localizar a tabela pelos cabeçalhos.
- Extrair os períodos.
- Extrair código, nome, turma, carga horária e horário.
- Organizar os resultados por período.

### Etapa 4 — Enriquecimento

- Combinar as duas fontes.
- Associar os dados pelo período e nome da disciplina.
- Preservar a origem dos campos.
- Não preencher informações ausentes.

### Etapa 5 — Notas e faltas

Investigar as páginas reais em que o SIGAA disponibiliza essas informações.

Não implemente extração até encontrar evidências concretas da estrutura.

### Etapa 6 — CRA e histórico acadêmico

Investigar separadamente.

Não confundir histórico de turmas com histórico acadêmico oficial.

### Etapa 7 — Integração com a Agy

Somente depois de garantir que os dados estão corretos, disponibilize-os para a assistente.

A Agy deverá responder com base nos dados efetivamente sincronizados.

Se não houver dados suficientes, deverá informar que não conseguiu consultar aquela informação.

---

# 13. Testes obrigatórios

Implemente testes para os parsers utilizando HTML de exemplo baseado nas estruturas reais observadas.

Os testes devem cobrir:

- Identificação da tabela correta.
- Identificação do período.
- Extração das disciplinas.
- Extração de código e turma.
- Extração da carga horária.
- Extração do horário.
- Extração do local.
- Linhas vazias.
- Múltiplos períodos.
- Tabelas irrelevantes.
- HTML sem a tabela esperada.
- Campos ausentes.
- HTML de login retornado após expiração da sessão.
- Falha de autenticação.
- Erros HTTP.

Não use somente testes que passam porque o parser encontrou algum texto parecido com o esperado.

Os testes precisam verificar os valores exatos.

Quando possível, utilize fixtures HTML anonimizadas e sem cookies, tokens ou dados pessoais.

---

# 14. Critérios para considerar a integração concluída

A integração somente poderá ser considerada funcional quando:

- O login real funcionar.
- A sessão permanecer válida durante as consultas.
- O portal do discente for acessado.
- As seis disciplinas observadas no período 2026.2 forem extraídas corretamente no ambiente de teste correspondente.
- Os dados de `turmas.jsf` forem extraídos separadamente.
- A associação entre as páginas for consistente.
- Nenhum campo inexistente for inventado.
- Uma falha de extração não gerar dados fictícios.
- O frontend apresentar corretamente os campos indisponíveis.
- A Agy não afirmar que conhece notas, faltas ou CRA que não foram consultados.
- Os testes automatizados forem aprovados.

---

# 15. Instruções de trabalho para você, agente de IA

Antes de modificar qualquer arquivo:

1. Leia o código atual do repositório.
2. Entenda a arquitetura existente.
3. Identifique as dependências e os contratos de dados.
4. Compare a implementação atual com as descobertas documentadas neste briefing.
5. Apresente um diagnóstico dos problemas encontrados.

Depois, implemente em etapas pequenas.

A cada etapa:

- Informe quais arquivos serão modificados.
- Explique o motivo da alteração.
- Preserve funcionalidades existentes que não estejam relacionadas ao problema.
- Execute testes.
- Mostre os resultados.
- Informe o que está comprovado e o que ainda precisa ser investigado.

Não declare que o scraping está funcionando apenas porque a página retornou HTTP 200.

Não declare que o aluno está matriculado em uma disciplina apenas porque ela apareceu em uma listagem histórica.

Não declare que o CRA, as notas ou as faltas foram sincronizados se esses dados não foram realmente extraídos.

**Prefiro uma integração que informe honestamente que determinado dado ainda não está disponível a uma integração aparentemente completa que apresente informações falsas.**

O objetivo é transformar a integração SIGAA do Facul Mind em uma fonte confiável de informações acadêmicas reais da UFPE.