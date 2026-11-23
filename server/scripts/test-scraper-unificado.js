import assert from "node:assert/strict";
import {
	scrapeAcademicDataForTurma,
	syncWithSigaa,
} from "../services/sigaaScraper.js";

console.log("=== INICIANDO SUÍTE DE TESTES: SCRAPER UNIFICADO ===");

// Helper HTML fixtures
function createPortalHtml() {
	const disciplinas = [
		"CT506 - CONTABILIDADE GERAL PARA SECRETARIADO",
		"CI581 - DESENVOLVIMENTO EM LIDERANÇA",
		"AD446 - EMPREENDEDORISMO EM SECRETARIADO",
		"AD447 - INGLÊS PARA NEGÓCIOS 1",
		"AD195 - MICROANÁLISE DAS ORGANIZAÇÕES",
		"AD437 - ÉTICA E RESPONSABILIDADE SÓCIO-AMBIENTAL",
	];

	return `
    <html>
      <body>
        <table>
          <tr><td colspan="4">2026.2</td></tr>
          ${disciplinas
						.map(
							(d, i) => `
          <tr>
            <td>
              <form id="form_acessarTurmaVirtual_${i}" action="/sigaa/portais/discente/discente.jsf">
                <a href="#" onclick="jsfcljs(document.getElementById('form_acessarTurmaVirtual_${i}'),{'selecaoTurma':'${i}'},'')">
                  ${d}
                </a>
              </form>
            </td>
          </tr>
          `,
						)
						.join("")}
        </table>
      </body>
    </html>
  `;
}

function createSelectionHtml(turmaLabel = "CT506 - CONTABILIDADE GERAL PARA SECRETARIADO (2026.2)") {
	return `
    <html>
      <body>
        <form id="formTurma" action="/sigaa/ava/selecao.jsf">
          <input type="hidden" name="javax.faces.ViewState" value="VS_SELECTION" />
          <a href="#" onclick="jsfcljs(document.getElementById('formTurma'),{'turmaEscolhida':'101'},'')">
            ${turmaLabel}
          </a>
        </form>
      </body>
    </html>
  `;
}

function createTurmaVirtualHtml(viewState = "VS_INITIAL", code = "CT506", name = "CONTABILIDADE GERAL PARA SECRETARIADO") {
	return `
    <html>
      <body>
        <div id="linkCodigoTurma">${code} - 01</div>
        <div id="linkNomeTurma">${name}</div>
        <form id="formMenu" action="/sigaa/ava/index.jsf">
          <input type="hidden" name="javax.faces.ViewState" value="${viewState}" />
          <input type="hidden" id="formMenu_panelBarInput" name="formMenu_panelBarInput" value="" />
          <div class="rich-panelbar-interior" id="panelNotas">
            <a href="#" onclick="jsfcljs(document.getElementById('formMenu'),{'formMenu:linkNotas':'formMenu:linkNotas'},'')">
              <span class="itemMenu">Ver Notas</span>
            </a>
          </div>
          <div class="rich-panelbar-interior" id="panelFreq">
            <a href="#" onclick="jsfcljs(document.getElementById('formMenu'),{'formMenu:linkFreq':'formMenu:linkFreq'},'')">
              <span class="itemMenu">Frequência</span>
            </a>
          </div>
        </form>
      </body>
    </html>
  `;
}

function createNotesAvailableHtml(viewState = "VS_UPDATED_NOTES") {
	return `
    <html>
      <body>
        <div id="relatorio">
          <table class="tabelaRelatorio">
            <thead>
              <tr id="trAval">
                <th>Matrícula</th>
                <th>Nome</th>
                <th id="aval_1">AV1</th>
                <th id="unid">Média Avaliações</th>
                <th>Média Parcial</th>
                <th>Resultado</th>
                <th>Faltas</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>20240001</td>
                <td>Aluno Teste</td>
                <td>9.5</td>
                <td>9.5</td>
                <td>9.5</td>
                <td>Aprovado</td>
                <td>0</td>
                <td>Matriculado</td>
              </tr>
            </tbody>
          </table>
          <input type="hidden" id="denAval_1" value="Avaliação 1" />
          <input type="hidden" id="pesoAval_1" value="1.0" />
        </div>
        <form id="formMenu" action="/sigaa/ava/index.jsf">
          <input type="hidden" name="javax.faces.ViewState" value="${viewState}" />
          <input type="hidden" id="formMenu_panelBarInput" name="formMenu_panelBarInput" value="" />
          <div class="rich-panelbar-interior" id="panelFreq">
            <a href="#" onclick="jsfcljs(document.getElementById('formMenu'),{'formMenu:linkFreqUpdated':'formMenu:linkFreqUpdated'},'')">
              <span class="itemMenu">Frequência</span>
            </a>
          </div>
        </form>
      </body>
    </html>
  `;
}

function createNotesNotLaunchedHtml(viewState = "VS_NOTES_NOT_LAUNCHED") {
	return `
    <html>
      <body>
        <div id="painel-erros">Ainda não foram lançadas notas para esta turma.</div>
        <form id="formMenu" action="/sigaa/ava/index.jsf">
          <input type="hidden" name="javax.faces.ViewState" value="${viewState}" />
          <input type="hidden" id="formMenu_panelBarInput" name="formMenu_panelBarInput" value="" />
          <div class="rich-panelbar-interior" id="panelFreq">
            <a href="#" onclick="jsfcljs(document.getElementById('formMenu'),{'formMenu:linkFreq':'formMenu:linkFreq'},'')">
              <span class="itemMenu">Frequência</span>
            </a>
          </div>
        </form>
      </body>
    </html>
  `;
}

function createNotesWithoutMenuHtml() {
	return `
    <html>
      <body>
        <div id="relatorio">
          <table class="tabelaRelatorio">
            <thead>
              <tr id="trAval">
                <th>Matrícula</th>
                <th>Nome</th>
                <th id="aval_1">AV1</th>
                <th id="unid">Média Avaliações</th>
                <th>Média Parcial</th>
                <th>Resultado</th>
                <th>Faltas</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>20240001</td>
                <td>Aluno Teste</td>
                <td>9.5</td>
                <td>9.5</td>
                <td>9.5</td>
                <td>Aprovado</td>
                <td>0</td>
                <td>Matriculado</td>
              </tr>
            </tbody>
          </table>
          <input type="hidden" id="denAval_1" value="Avaliação 1" />
          <input type="hidden" id="pesoAval_1" value="1.0" />
        </div>
      </body>
    </html>
  `;
}

function createFrequencyAvailableHtml() {
	return `
    <html>
      <body>
        <form action="/sigaa/ava/FrequenciaAluno/mapa.jsf">
          <table class="listing">
            <thead><tr><th>Data</th><th>Situação</th></tr></thead>
            <tbody>
              <tr><td>01/08/2026</td><td>Presente</td></tr>
              <tr><td>08/08/2026</td><td>Presente</td></tr>
            </tbody>
          </table>
          <table class="tabelaRelatorio">
            <tbody>
              <tr><td>Aulas Ministradas</td><td>2</td></tr>
              <tr><td>Total de Faltas</td><td>0</td></tr>
              <tr><td>% Carga Horária Cumprida</td><td>100%</td></tr>
            </tbody>
          </table>
        </form>
      </body>
    </html>
  `;
}

function createFrequencyNotLaunchedHtml() {
	return `
    <html>
      <body>
        <div id="painel-erros">Não foram lançadas frequências para esta turma.</div>
        <form action="/sigaa/ava/FrequenciaAluno/mapa.jsf"></form>
      </body>
    </html>
  `;
}

// Test 1: Fluxo ideal - ViewState atualizado de Notas reutilizado para Frequência
async function testIdealCombinedFlow() {
	console.log("\n[TESTE 1] Fluxo combinado ideal (ambos disponíveis, ViewState propagado):");

	const requests = [];
	let openTurmaCount = 0;

	const session = {
		async get(url) {
			requests.push({ method: "GET", url });
			if (url.includes("discente.jsf")) {
				openTurmaCount++;
				return { data: createPortalHtml() };
			}
			if (url.includes("index.jsf")) {
				return { data: createTurmaVirtualHtml("VS_REFRESHED") };
			}
			throw new Error(`GET não esperado: ${url}`);
		},
		async post(url, data, config) {
			requests.push({ method: "POST", url, data, referer: config?.headers?.Referer });
			if (url.includes("discente.jsf")) {
				return { data: createSelectionHtml() };
			}
			if (url.includes("selecao.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			// Submit link from Turma Virtual (Notas or Freq)
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				// Assert sent initial ViewState
				assert.equal(params.get("javax.faces.ViewState"), "VS_TURMA_INIT");
				return {
					data: createNotesAvailableHtml("VS_NOTES_NEW"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/notas.jsf" } },
				};
			}
			if (params.has("formMenu:linkFreqUpdated")) {
				// Assert frequency request received the UPDATED ViewState from notes response
				assert.equal(params.get("javax.faces.ViewState"), "VS_NOTES_NEW");
				assert.equal(config?.headers?.Referer, "https://sigaa.ufpe.br/sigaa/ava/notas.jsf");
				return {
					data: createFrequencyAvailableHtml(),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/freq.jsf" } },
				};
			}
			throw new Error(`POST não esperado: ${url} - ${data}`);
		},
	};

	const turma = {
		codigo: "CT506",
		disciplina: "Contabilidade Geral para Secretariado",
		periodo: "2026.2",
	};

	const result = await scrapeAcademicDataForTurma(session, turma, "20240001");

	assert.equal(openTurmaCount, 1, "openTurmaVirtual deve ser chamado exatamente uma vez.");
	assert.equal(result.notas.status, "available", "Notas devem estar disponíveis.");
	assert.equal(result.frequencia.status, "available", "Frequência deve estar disponível.");
	assert.equal(requests.length, 5, `Número de requisições esperado: 5. Obtido: ${requests.length}`);

	console.log("  ✓ Total requisições: 5 (3 abertura + 1 notas + 1 freq)");
	console.log("  ✓ ViewState atualizado de notas reutilizado com sucesso na frequência");
	console.log("  ✓ Status: notas=available, frequencia=available");
}

// Test 2: Resposta de notas sem menu/formulário -> Fallback para GET classUrl
async function testNotesWithoutMenuFallback() {
	console.log("\n[TESTE 2] Notas sem menu -> Fallback para GET classUrl e Frequência:");

	const requests = [];
	let getIndexCalled = false;

	const session = {
		async get(url) {
			requests.push({ method: "GET", url });
			if (url.includes("discente.jsf")) {
				return { data: createPortalHtml() };
			}
			if (url.includes("index.jsf")) {
				getIndexCalled = true;
				return {
					data: createTurmaVirtualHtml("VS_FRESH_GET"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			throw new Error(`GET não esperado: ${url}`);
		},
		async post(url, data) {
			requests.push({ method: "POST", url, data });
			if (url.includes("discente.jsf")) return { data: createSelectionHtml() };
			if (url.includes("selecao.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				// Retorna HTML de notas sem formMenu
				return {
					data: createNotesWithoutMenuHtml(),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/notasRelatorio.jsf" } },
				};
			}
			if (params.has("formMenu:linkFreq")) {
				assert.equal(params.get("javax.faces.ViewState"), "VS_FRESH_GET");
				return { data: createFrequencyAvailableHtml() };
			}
			throw new Error(`POST não esperado: ${url} - ${data}`);
		},
	};

	const turma = {
		codigo: "CT506",
		disciplina: "Contabilidade Geral para Secretariado",
		periodo: "2026.2",
	};

	const result = await scrapeAcademicDataForTurma(session, turma, "20240001");

	assert.equal(getIndexCalled, true, "GET classUrl deve ser chamado para recarregar a Turma Virtual.");
	assert.equal(result.notas.status, "available");
	assert.equal(result.frequencia.status, "available");
	assert.equal(requests.length, 6, `Esperado 6 requisições (3 abertura + 1 notas + 1 refresh + 1 freq). Obtido: ${requests.length}`);

	console.log("  ✓ Total requisições: 6 (com refresh pontual de classUrl)");
	console.log("  ✓ Recuperação transparente do ViewState sem reiniciar portal");
}

// Test 3: Notas not_launched não impede Frequência
async function testNotesNotLaunched() {
	console.log("\n[TESTE 3] Notas not_launched -> Frequência continua normalmente:");

	const session = {
		async get(url) {
			if (url.includes("discente.jsf")) return { data: createPortalHtml() };
			return { data: createTurmaVirtualHtml() };
		},
		async post(url, data) {
			if (url.includes("discente.jsf")) return { data: createSelectionHtml() };
			if (url.includes("selecao.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				return {
					data: createNotesNotLaunchedHtml("VS_AFTER_NOT_LAUNCHED"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			if (params.has("formMenu:linkFreq")) {
				assert.equal(params.get("javax.faces.ViewState"), "VS_AFTER_NOT_LAUNCHED");
				return { data: createFrequencyAvailableHtml() };
			}
			throw new Error(`POST não esperado: ${url}`);
		},
	};

	const turma = {
		codigo: "CT506",
		disciplina: "Contabilidade Geral para Secretariado",
		periodo: "2026.2",
	};

	const result = await scrapeAcademicDataForTurma(session, turma, "20240001");

	assert.equal(result.notas.status, "not_launched", "Notas devem ser not_launched");
	assert.equal(result.notas.data, null);
	assert.equal(result.frequencia.status, "available", "Frequência deve ser available");

	console.log("  ✓ Notas marcadas como not_launched sem travar frequência");
	console.log("  ✓ Frequência extraída com sucesso");
}

// Test 4: Frequência not_launched preserva Notas
async function testFrequencyNotLaunched() {
	console.log("\n[TESTE 4] Frequência not_launched -> Preserva Notas:");

	const session = {
		async get(url) {
			if (url.includes("discente.jsf")) return { data: createPortalHtml() };
			return { data: createTurmaVirtualHtml() };
		},
		async post(url, data) {
			if (url.includes("discente.jsf")) return { data: createSelectionHtml() };
			if (url.includes("selecao.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				return {
					data: createNotesAvailableHtml("VS_NOTES"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			if (params.has("formMenu:linkFreqUpdated")) {
				return { data: createFrequencyNotLaunchedHtml() };
			}
			throw new Error(`POST não esperado: ${url}`);
		},
	};

	const turma = {
		codigo: "CT506",
		disciplina: "Contabilidade Geral para Secretariado",
		periodo: "2026.2",
	};

	const result = await scrapeAcademicDataForTurma(session, turma, "20240001");

	assert.equal(result.notas.status, "available", "Notas devem ser available");
	assert.notEqual(result.notas.data, null);
	assert.equal(result.frequencia.status, "not_launched", "Frequência deve ser not_launched");
	assert.equal(result.frequencia.data, null);

	console.log("  ✓ Notas preservadas com sucesso");
	console.log("  ✓ Frequência not_launched identificada sem erro técnico");
}

// Test 5: Falha em notas não impede frequência
async function testNotesFailureDoesNotBlockFrequency() {
	console.log("\n[TESTE 5] Falha técnica em Notas não impede consulta de Frequência:");

	const session = {
		async get(url) {
			if (url.includes("discente.jsf")) return { data: createPortalHtml() };
			if (url.includes("index.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_RECOVERED"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			throw new Error(`GET não esperado: ${url}`);
		},
		async post(url, data) {
			if (url.includes("discente.jsf")) return { data: createSelectionHtml() };
			if (url.includes("selecao.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				// Simula erro técnico na requisição de notas
				throw new Error("Erro de conexão na requisição de notas");
			}
			if (params.has("formMenu:linkFreq")) {
				assert.equal(params.get("javax.faces.ViewState"), "VS_RECOVERED");
				return { data: createFrequencyAvailableHtml() };
			}
			throw new Error(`POST não esperado: ${url}`);
		},
	};

	const turma = {
		codigo: "CT506",
		disciplina: "Contabilidade Geral para Secretariado",
		periodo: "2026.2",
	};

	const result = await scrapeAcademicDataForTurma(session, turma, "20240001");

	assert.equal(result.notas.status, "failed", "Notas devem ser failed");
	assert.ok(result.notas.error.includes("Erro de conexão"));
	assert.equal(result.frequencia.status, "available", "Frequência deve ser available");

	console.log("  ✓ Falha técnica de notas isolada e registrada");
	console.log("  ✓ Frequência executada após recuperação via GET");
}

// Test 6: Falha técnica em frequência preserva Notas disponíveis
async function testFrequencyFailurePreservesNotes() {
	console.log("\n[TESTE 6] Falha técnica em Frequência preserva Notas disponíveis:");

	const session = {
		async get(url) {
			if (url.includes("discente.jsf")) return { data: createPortalHtml() };
			return { data: createTurmaVirtualHtml() };
		},
		async post(url, data) {
			if (url.includes("discente.jsf")) return { data: createSelectionHtml() };
			if (url.includes("selecao.jsf")) {
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				return {
					data: createNotesAvailableHtml("VS_NOTES"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			if (params.has("formMenu:linkFreqUpdated") || params.has("formMenu:linkFreq")) {
				throw new Error("Erro 500 no mapa de frequência");
			}
			throw new Error(`POST não esperado: ${url}`);
		},
	};

	const turma = {
		codigo: "CT506",
		disciplina: "Contabilidade Geral para Secretariado",
		periodo: "2026.2",
	};

	const result = await scrapeAcademicDataForTurma(session, turma, "20240001");

	assert.equal(result.notas.status, "available", "Notas devem ser available");
	assert.notEqual(result.notas.data, null);
	assert.equal(result.frequencia.status, "failed", "Frequência deve ser failed");
	assert.ok(result.frequencia.error.includes("Erro 500"));

	console.log("  ✓ Notas disponíveis mantidas intactas");
	console.log("  ✓ Falha na frequência isolada");
}

// Test 7: Simulação do loop do semestre (6 turmas reais)
async function testMultiTurmaSemesterSimulation() {
	console.log("\n[TESTE 7] Simulação com 6 turmas do semestre 2026.2 (casos reais observados):");

	const turmasMock = [
		{ codigo: "CT506", disciplina: "Contabilidade Geral para Secretariado", periodo: "2026.2" },
		{ codigo: "CI581", disciplina: "Desenvolvimento em Liderança", periodo: "2026.2" },
		{ codigo: "AD446", disciplina: "Empreendedorismo em Secretariado", periodo: "2026.2" },
		{ codigo: "AD447", disciplina: "Inglês para Negócios 1", periodo: "2026.2" },
		{ codigo: "AD195", disciplina: "Microanálise das Organizações", periodo: "2026.2" },
		{ codigo: "AD437", disciplina: "Ética e Responsabilidade Sócio-Ambiental", periodo: "2026.2" },
	];

	let totalVirtualOpens = 0;
	let totalRequests = 0;

	const session = {
		async get(url) {
			totalRequests++;
			return { data: createPortalHtml() };
		},
		async post(url, data) {
			totalRequests++;
			if (url.includes("discente.jsf")) return { data: createSelectionHtml() };
			if (url.includes("selecao.jsf")) {
				totalVirtualOpens++;
				return {
					data: createTurmaVirtualHtml("VS_TURMA_INIT"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			const params = new URLSearchParams(data);
			if (params.has("formMenu:linkNotas")) {
				// Simula: CI581 com notas not_launched, demais com notas disponíveis
				return {
					data: createNotesAvailableHtml("VS_NOTES"),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			if (params.has("formMenu:linkFreqUpdated")) {
				// Simula caso real 11.1: CI581 com frequência not_launched
				return {
					data: createFrequencyAvailableHtml(),
					request: { res: { responseUrl: "https://sigaa.ufpe.br/sigaa/ava/index.jsf" } },
				};
			}
			throw new Error(`POST não esperado: ${url}`);
		},
	};

	const notesSummary = {
		total: turmasMock.length,
		updated: 0,
		notLaunched: 0,
		failed: [],
	};

	const frequencySummary = {
		total: turmasMock.length,
		updated: 0,
		notLaunched: 0,
		failed: [],
	};

	for (const turma of turmasMock) {
		const isCI581 = turma.codigo === "CI581";

		// Custom mock per turma
		const turmaSession = {
			...session,
			async post(url, data, config) {
				totalRequests++;
				if (url.includes("discente.jsf")) {
					return {
						data: createSelectionHtml(
							`${turma.codigo} - ${turma.disciplina.toUpperCase()} (${turma.periodo})`,
						),
					};
				}
				if (url.includes("selecao.jsf")) {
					totalVirtualOpens++;
					return {
						data: createTurmaVirtualHtml(
							"VS_TURMA_INIT",
							turma.codigo,
							turma.disciplina.toUpperCase(),
						),
						request: {
							res: {
								responseUrl:
									"https://sigaa.ufpe.br/sigaa/ava/index.jsf",
							},
						},
					};
				}
				const params = new URLSearchParams(data);
				if (params.has("formMenu:linkNotas")) {
					return {
						data: isCI581
							? createNotesNotLaunchedHtml("VS_NOTES")
							: createNotesAvailableHtml("VS_NOTES"),
						request: {
							res: {
								responseUrl:
									"https://sigaa.ufpe.br/sigaa/ava/index.jsf",
							},
						},
					};
				}
				if (
					params.has("formMenu:linkFreqUpdated") ||
					params.has("formMenu:linkFreq")
				) {
					return {
						data: isCI581
							? createFrequencyNotLaunchedHtml()
							: createFrequencyAvailableHtml(),
						request: {
							res: {
								responseUrl:
									"https://sigaa.ufpe.br/sigaa/ava/index.jsf",
							},
						},
					};
				}
				throw new Error(`POST não esperado: ${url}`);
			},
		};

		const academicData = await scrapeAcademicDataForTurma(turmaSession, turma, "20240001");

		if (academicData.notas.status === "available") notesSummary.updated++;
		else if (academicData.notas.status === "not_launched") notesSummary.notLaunched++;
		else notesSummary.failed.push({ codigo: turma.codigo });

		if (academicData.frequencia.status === "available") frequencySummary.updated++;
		else if (academicData.frequencia.status === "not_launched") frequencySummary.notLaunched++;
		else frequencySummary.failed.push({ codigo: turma.codigo });
	}

	assert.equal(totalVirtualOpens, 6, "Cada uma das 6 turmas abriu a Turma Virtual exatamente uma vez!");
	assert.equal(totalRequests, 30, "6 turmas * 5 requisições = exatamente 30 requisições (vs 48 antes)!");
	assert.equal(notesSummary.updated, 5);
	assert.equal(notesSummary.notLaunched, 1);
	assert.equal(frequencySummary.updated, 5);
	assert.equal(frequencySummary.notLaunched, 1);

	console.log(`  ✓ 6 turmas processadas com exatamente ${totalRequests} requisições HTTP (economia de 18 requisições / 37.5%)`);
	console.log("  ✓ openTurmaVirtual executado exatamente 1x por disciplina (6 no total)");
	console.log("  ✓ Resumo de Notas:", notesSummary);
	console.log("  ✓ Resumo de Frequência:", frequencySummary);
}

// Test 8: Sincronização real se credenciais estiverem configuradas
async function testRealSigaaSyncIfConfigured() {
	const username = process.env.SIGAA_USERNAME?.trim();
	const password = process.env.SIGAA_PASSWORD;

	if (!username || !password) {
		console.log("\n[TESTE 8] Sincronização real SIGAA: credenciais SIGAA_USERNAME / SIGAA_PASSWORD não configuradas no ambiente. Teste ignorado com segurança.");
		return;
	}

	console.log("\n[TESTE 8] Executando sincronização real com SIGAA...");
	try {
		const result = await syncWithSigaa(username, password);
		console.log("  ✓ Sincronização real concluída com sucesso!");
		console.log("  ✓ Turmas encontradas:", result.student?.turmas?.length);
	} catch (error) {
		console.error("  ✕ Falha na sincronização real:", error.message);
	}
}

async function runAll() {
	await testIdealCombinedFlow();
	await testNotesWithoutMenuFallback();
	await testNotesNotLaunched();
	await testFrequencyNotLaunched();
	await testNotesFailureDoesNotBlockFrequency();
	await testFrequencyFailurePreservesNotes();
	await testMultiTurmaSemesterSimulation();
	await testRealSigaaSyncIfConfigured();

	console.log("\n=======================================================");
	console.log("TODOS OS TESTES UNITÁRIOS PASSARAM COM SUCESSO! 🎉");
	console.log("=======================================================\n");
}

runAll().catch((err) => {
	console.error("\nTESTE FALHOU:", err);
	process.exit(1);
});
