import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";

import {
	formatSigaaScrapedData,
	parseHistoricoPendentes,
	parseSigaaFrequencyReport,
	parseSigaaNotesReport,
} from "./sigaaParser.js";

const SIGAA_BASE_URL = "https://sigaa.ufpe.br";

function createSigaaSession() {
	const jar = new CookieJar();

	const client = wrapper(
		axios.create({
			jar,
			baseURL: SIGAA_BASE_URL,
			maxRedirects: 5,
			timeout: 30000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
				"Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
			},
		}),
	);

	return client;
}

function extractJsfCommand(onclick) {
	const match = onclick.match(
		/jsfcljs\s*\(\s*document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)\s*,\s*(\{[\s\S]*?\})\s*,/,
	);

	if (!match) {
		throw new Error("Comando JSF não encontrado no link.");
	}

	const params = [
		...match[2].matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]*)['"]/g),
	];

	if (params.length === 0) {
		throw new Error("Parâmetros do comando JSF não encontrados.");
	}

	return {
		formId: match[1],
		params: params.map((param) => [param[1], param[2]]),
	};
}

async function submitJsfLink(session, $, $link, referer) {
	const onclick = $link.attr("onclick");

	if (!onclick) {
		throw new Error("Link JSF sem atributo onclick.");
	}

	const command = extractJsfCommand(onclick);

	const $closestForm = $link.closest("form");

	const $form =
		$closestForm.length && $closestForm.attr("id") === command.formId
			? $closestForm
			: $(`#${command.formId}`);
	if (!$form.length) {
		throw new Error(`Formulário JSF não encontrado: ${command.formId}`);
	}

	const action = $form.attr("action");

	// Sincroniza o painel ativo do menu RichFaces com o item clicado.
	if (command.formId === "formMenu") {
		const $activePanel = $link.closest(".rich-panelbar-interior");
		const activePanelId = $activePanel.attr("id");

		const $panelInput = $form.find('input[id$="_panelBarInput"]');

		if (!activePanelId || !$panelInput.length) {
			throw new Error("Não foi possível identificar o painel ativo do menu.");
		}

		$panelInput.attr("value", activePanelId);

		console.log("[SIGAA JSF] Painel sincronizado:", {
			panel: activePanelId,
		});
	}

	if (!action) {
		throw new Error("Action do formulário JSF não encontrada.");
	}

	const payload = new URLSearchParams();

	// Preserva todos os campos hidden, inclusive ViewState e painel ativo.
	$form.find('input[type="hidden"][name]').each((_, element) => {
		const name = $(element).attr("name");
		const value = $(element).attr("value") || "";

		if (name) {
			payload.append(name, value);
		}
	});

	// Simula o parâmetro enviado pelo clique no link.
	for (const [name, value] of command.params) {
		payload.append(name, value);
	}

	const targetUrl = new URL(action, SIGAA_BASE_URL).toString();

	if (command.formId === "formMenu") {
		console.log("[SIGAA JSF] Envio do formulário do menu:", {
			action: targetUrl,
			command: command.params,
			viewStatePresente: Boolean(payload.get("javax.faces.ViewState")),
			fields: [...payload.entries()].map(([name, value]) => ({
				name,
				value:
					name === "javax.faces.ViewState" ? "[ViewState presente]" : value,
			})),
		});
	}

	return session.post(targetUrl, payload.toString(), {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: referer,
			Origin: SIGAA_BASE_URL,
		},
	});
}

function normalizeSigaaLabel(value) {
	return String(value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
}

function normalizeDisciplineName(value) {
	return normalizeSigaaLabel(value).replace(/^[a-z0-9]+\s*-\s*/i, "");
}

function findMenuLink($, labelText) {
	const normalizedTarget = normalizeSigaaLabel(labelText);

	return $("#formMenu a")
		.filter((_, element) => {
			const $el = $(element);
			const itemLabel = normalizeSigaaLabel($el.find(".itemMenu").text());
			const directLabel = normalizeSigaaLabel($el.text());

			return (
				itemLabel === normalizedTarget || directLabel === normalizedTarget
			);
		})
		.first();
}

function getPortalSemester($, link) {
	const $row = $(link).closest("tr");

	const $periodRow = $row
		.prevAll("tr")
		.filter((_, element) => {
			const value = $(element).find("td[colspan]").first().text().trim();

			return /^\d{4}\.\d$/.test(value);
		})
		.first();

	return $periodRow.find("td[colspan]").first().text().trim() || null;
}

async function openTurmaVirtual(session, turma) {
	const expectedCode = String(turma.codigo || "")
		.split("-")[0]
		.trim()
		.toUpperCase();

	const expectedName = normalizeDisciplineName(turma.disciplina);

	if (!expectedName) {
		throw new Error("Nome da disciplina não informado.");
	}

	// 1. Obtém uma versão atualizada do Portal do Discente.
	const portalResponse = await session.get(
		"/sigaa/portais/discente/discente.jsf",
	);

	const $portal = cheerio.load(portalResponse.data);

	// 2. Localiza a disciplina e confere seu período.
	const $courseCandidates = $portal(
		'form[id^="form_acessarTurmaVirtual"] a[onclick]',
	).filter((_, element) => {
		return normalizeDisciplineName($portal(element).text()) === expectedName;
	});

	const $periodCandidates = $courseCandidates.filter((_, element) => {
		const period = getPortalSemester($portal, element);
		return period === turma.periodo;
	});

	const $courseLink =
		$periodCandidates.length === 1
			? $periodCandidates.first()
			: $periodCandidates.length === 0 && $courseCandidates.length === 1
				? $courseCandidates.first()
				: null;

	if (!$courseLink || !$courseLink.length) {
		throw new Error(
			`Não foi possível identificar unicamente a disciplina ${turma.disciplina} (${turma.periodo}).`,
		);
	}

	const portalUrl = `${SIGAA_BASE_URL}/sigaa/portais/discente/discente.jsf`;

	// 3. Abre a seleção de turmas.
	const selectionResponse = await submitJsfLink(
		session,
		$portal,
		$courseLink,
		portalUrl,
	);

	const selectionUrl = selectionResponse.request?.res?.responseUrl || portalUrl;

	const $selection = cheerio.load(selectionResponse.data);
	const $turmaForm = $selection("#formTurma");

	if (!$turmaForm.length) {
		throw new Error("Formulário de seleção de turmas não encontrado.");
	}

	// 4. Escolhe a turma pelo código, disciplina e período.
	const $selectedTurmaLink = $turmaForm
		.find("a[onclick]")
		.filter((_, element) => {
			const label = $selection(element).text().replace(/\s+/g, " ").trim();

			const codeMatch = label.match(/^([A-Z0-9]+)\s*-/i);

			const codeMatches =
				!expectedCode || codeMatch?.[1]?.toUpperCase() === expectedCode;

			const nameMatches = normalizeDisciplineName(label).includes(expectedName);

			const periodMatches = !turma.periodo || label.includes(turma.periodo);

			return codeMatches && nameMatches && periodMatches;
		})
		.first();

	if (!$selectedTurmaLink.length) {
		throw new Error(
			`Turma ${expectedCode} não encontrada na seleção do SIGAA.`,
		);
	}

	// 5. Abre a Turma Virtual.
	const turmaResponse = await submitJsfLink(
		session,
		$selection,
		$selectedTurmaLink,
		selectionUrl,
	);

	const classHtml = turmaResponse.data;

	const classUrl =
		turmaResponse.request?.res?.responseUrl ||
		`${SIGAA_BASE_URL}/sigaa/ava/index.jsf`;

	const $class = cheerio.load(classHtml);

	// 6. Confirma que a turma aberta é a esperada.
	const actualCode = $class("#linkCodigoTurma")
		.text()
		.split("-")[0]
		.trim()
		.toUpperCase();

	const actualName = normalizeDisciplineName($class("#linkNomeTurma").text());

	if (
		(expectedCode && actualCode !== expectedCode) ||
		actualName !== expectedName
	) {
		throw new Error(
			`Turma incorreta. Esperada: ${expectedCode} ${expectedName}. Recebida: ${actualCode} ${actualName}.`,
		);
	}

	console.log("[SIGAA TURMA] Turma aberta:", {
		codigo: actualCode,
		disciplina: actualName,
		periodo: turma.periodo,
	});

	return {
		$class,
		classUrl,
		actualCode,
		actualName,
	};
}

async function scrapeNotesForTurma(session, turma, matricula) {
	// 1. Abre a Turma Virtual e valida a disciplina.
	const { $class, classUrl, actualCode, actualName } = await openTurmaVirtual(
		session,
		turma,
	);

	console.log("[SIGAA NOTAS] Turma aberta:", {
		codigo: actualCode,
		disciplina: actualName,
		periodo: turma.periodo,
	});

	// 2. Localiza o link Ver Notas.
	const $notesLink = findMenuLink($class, "ver notas");

	if (!$notesLink.length) {
		throw new Error("Link Ver Notas não encontrado.");
	}

	// 3. Executa o comando JSF.
	const notesResponse = await submitJsfLink(
		session,
		$class,
		$notesLink,
		classUrl,
	);

	const notesHtml = notesResponse.data;
	const $notes = cheerio.load(notesHtml);

	// 4. Verifica se o SIGAA ainda não lançou notas.
	const warningText = normalizeSigaaLabel(
		[$class("#painel-erros").text(), $notes("#painel-erros").text()].join(" "),
	);

	if (warningText.includes("ainda nao foram lancadas notas")) {
		return {
			status: "not_launched",
		};
	}

	// 5. Confirma que o relatório de notas foi retornado.
	if (
		!$notes("#relatorio").length ||
		!$notes("#relatorio table.tabelaRelatorio").length
	) {
		throw new Error("SIGAA não retornou o relatório de notas esperado.");
	}

	// 6. Extrai somente as notas do aluno autenticado.
	const notes = parseSigaaNotesReport(notesHtml, matricula);

	return {
		status: "available",
		notes,
	};
}

async function scrapeFrequencyForTurma(session, turma) {
	const { $class, classUrl, actualCode, actualName } = await openTurmaVirtual(
		session,
		turma,
	);

	// 1. Localiza o item Frequência pelo texto, não pelo ID dinâmico.
	const $frequencyLink = findMenuLink($class, "frequencia");

	if (!$frequencyLink.length) {
		throw new Error("Link Frequência não encontrado.");
	}

	console.log("[SIGAA FREQUÊNCIA] Acessando:", {
		codigo: actualCode,
		disciplina: actualName,
	});

	// 2. Executa o comando JSF.
	const frequencyResponse = await submitJsfLink(
		session,
		$class,
		$frequencyLink,
		classUrl,
	);

	const frequencyHtml = frequencyResponse.data;

	// 3. Confirma que recebeu o mapa de frequência.
	const $frequency = cheerio.load(frequencyHtml);

	// Verifica se o professor ainda não lançou a frequência.
	const warningText = normalizeSigaaLabel(
		[
			$frequency("#painel-erros").text(),
			$frequency(".mensagemStatus").text(),
			$frequency('form[action*="/FrequenciaAluno/mapa.jsf"]').text(),
		].join(" "),
	);

	const frequencyNotLaunched =
		/nao (?:foram|foi) lancad[oa]s? frequencias?/.test(warningText) ||
		/frequencia.{0,50}(nao foi|nao foram|nao esta|nao estao).{0,30}(lancad|registrad)/.test(
			warningText,
		) ||
		/nao ha registros de frequencia|nao existem registros de frequencia|nenhum registro de frequencia/.test(
			warningText,
		);

	if (frequencyNotLaunched) {
		return {
			status: "not_launched",
		};
	}

	if (!$frequency('form[action*="/FrequenciaAluno/mapa.jsf"]').length) {
		throw new Error(
			"SIGAA não retornou o formulário esperado do mapa de frequência.",
		);
	}

	// 4. Interpreta os registros e o resumo.
	const frequency = parseSigaaFrequencyReport(frequencyHtml);

	return {
		status: "available",
		frequency,
	};
}

async function scrapeAcademicDataForTurma(session, turma, matricula) {
	// 1. Abre a Turma Virtual uma única vez.
	const { $class, classUrl, actualCode, actualName } = await openTurmaVirtual(
		session,
		turma,
	);

	console.log("[SIGAA ACADÊMICO] Turma aberta:", {
		codigo: actualCode,
		disciplina: actualName,
		periodo: turma.periodo,
	});

	const result = {
		notas: {
			status: "failed",
			data: null,
			error: null,
		},
		frequencia: {
			status: "failed",
			data: null,
			error: null,
		},
	};

	let $notes = null;
	let notesUrl = classUrl;

	// 2. Consulta de Notas
	try {
		console.log(
			`[SIGAA NOTAS] Consultando ${actualCode}: ${actualName}`,
		);

		const $notesLink = findMenuLink($class, "ver notas");

		if (!$notesLink.length) {
			throw new Error("Link Ver Notas não encontrado.");
		}

		const notesResponse = await submitJsfLink(
			session,
			$class,
			$notesLink,
			classUrl,
		);

		const notesHtml = notesResponse.data;
		notesUrl = notesResponse.request?.res?.responseUrl || classUrl;
		$notes = cheerio.load(notesHtml);

		const warningText = normalizeSigaaLabel(
			[$class("#painel-erros").text(), $notes("#painel-erros").text()].join(" "),
		);

		if (warningText.includes("ainda nao foram lancadas notas")) {
			result.notas = {
				status: "not_launched",
				data: null,
				error: null,
			};
			console.log(`[SIGAA NOTAS] ${actualCode}: notas ainda não lançadas.`);
		} else if (
			!$notes("#relatorio").length ||
			!$notes("#relatorio table.tabelaRelatorio").length
		) {
			throw new Error("SIGAA não retornou o relatório de notas esperado.");
		} else {
			const parsedNotes = parseSigaaNotesReport(notesHtml, matricula);
			result.notas = {
				status: "available",
				data: parsedNotes,
				error: null,
			};
		}
	} catch (error) {
		result.notas = {
			status: "failed",
			data: null,
			error: error.message,
		};
		console.error(`[SIGAA NOTAS] Falha em ${actualCode}:`, error.message);
	}

	// 3. Consulta de Frequência
	try {
		console.log(
			`[SIGAA FREQUÊNCIA] Consultando ${actualCode}: ${actualName}`,
		);

		let $frequencyPage = null;
		let frequencyReferer = classUrl;

		if (
			$notes &&
			$notes("#formMenu").length &&
			findMenuLink($notes, "frequencia").length
		) {
			$frequencyPage = $notes;
			frequencyReferer = notesUrl;
			console.log(
				`[SIGAA FREQUÊNCIA] Utilizando menu e ViewState da resposta de notas para ${actualCode}.`,
			);
		} else {
			console.log(
				`[SIGAA FREQUÊNCIA] Obtendo página atualizada da Turma Virtual via GET para ${actualCode}...`,
			);
			const refreshResponse = await session.get(classUrl);
			const $refreshed = cheerio.load(refreshResponse.data);

			if (
				$refreshed("#formMenu").length &&
				findMenuLink($refreshed, "frequencia").length
			) {
				$frequencyPage = $refreshed;
				frequencyReferer =
					refreshResponse.request?.res?.responseUrl || classUrl;
			} else {
				throw new Error(
					"Menu da Turma Virtual ou link Frequência não encontrado.",
				);
			}
		}

		let frequencyResponse;
		try {
			const $frequencyLink = findMenuLink($frequencyPage, "frequencia");
			if (!$frequencyLink.length) {
				throw new Error("Link Frequência não encontrado.");
			}

			frequencyResponse = await submitJsfLink(
				session,
				$frequencyPage,
				$frequencyLink,
				frequencyReferer,
			);
		} catch (linkError) {
			if ($frequencyPage === $notes) {
				console.warn(
					`[SIGAA FREQUÊNCIA] Envio a partir da resposta de notas falhou (${linkError.message}). Tentando atualizar Turma Virtual via GET...`,
				);
				const refreshResponse = await session.get(classUrl);
				const $refreshed = cheerio.load(refreshResponse.data);
				const $frequencyLink = findMenuLink($refreshed, "frequencia");

				if (!$frequencyLink.length) {
					throw new Error(
						"Link Frequência não encontrado após recarga da Turma Virtual.",
					);
				}

				frequencyResponse = await submitJsfLink(
					session,
					$refreshed,
					$frequencyLink,
					refreshResponse.request?.res?.responseUrl || classUrl,
				);
			} else {
				throw linkError;
			}
		}

		const frequencyHtml = frequencyResponse.data;
		const $frequency = cheerio.load(frequencyHtml);

		const warningText = normalizeSigaaLabel(
			[
				$frequency("#painel-erros").text(),
				$frequency(".mensagemStatus").text(),
				$frequency('form[action*="/FrequenciaAluno/mapa.jsf"]').text(),
			].join(" "),
		);

		const frequencyNotLaunched =
			/nao (?:foram|foi) lancad[oa]s? frequencias?/.test(warningText) ||
			/frequencia.{0,50}(nao foi|nao foram|nao esta|nao estao).{0,30}(lancad|registrad)/.test(
				warningText,
			) ||
			/nao ha registros de frequencia|nao existem registros de frequencia|nenhum registro de frequencia/.test(
				warningText,
			);

		if (frequencyNotLaunched) {
			result.frequencia = {
				status: "not_launched",
				data: null,
				error: null,
			};
			console.log(
				`[SIGAA FREQUÊNCIA] ${actualCode}: frequência ainda não lançada.`,
			);
		} else if (
			!$frequency('form[action*="/FrequenciaAluno/mapa.jsf"]').length
		) {
			throw new Error(
				"SIGAA não retornou o formulário esperado do mapa de frequência.",
			);
		} else {
			const parsedFrequency = parseSigaaFrequencyReport(frequencyHtml);
			result.frequencia = {
				status: "available",
				data: parsedFrequency,
				error: null,
			};
		}
	} catch (error) {
		result.frequencia = {
			status: "failed",
			data: null,
			error: error.message,
		};
		console.error(
			`[SIGAA FREQUÊNCIA] Falha em ${actualCode}:`,
			error.message,
		);
	}

	return result;
}

async function fetchHistoricoPdfBuffer(session, htmlPortal) {
	const $portal = cheerio.load(htmlPortal);

	const $menuForm = $portal('form[id$="form_menu_discente"]').first();

	if (!$menuForm.length) {
		throw new Error("Formulário do menu do discente não encontrado.");
	}

	// Confirma que o item Emitir Histórico existe no menu.
	// const $historyItem = $portal(".ThemeOfficeMenuItemText")
	// 	.filter((_, element) => {
	// 		return (
	// 			normalizeSigaaLabel($portal(element).text()) === "emitir historico"
	// 		);
	// 	})
	// 	.first();
	//
	// if (!$historyItem.length) {
	// 	throw new Error("Item Emitir Histórico não encontrado no menu.");
	// }

	const action = $menuForm.attr("action");

	if (!action) {
		throw new Error("Action do menu do discente não encontrada.");
	}

	const payload = new URLSearchParams();

	// Reproduz os campos enviados pelo navegador.
	$menuForm
		.find("input[name], select[name], textarea[name]")
		.each((_, element) => {
			const $field = $portal(element);
			const name = $field.attr("name");

			if (!name || name === "jscook_action") {
				return;
			}

			const type = ($field.attr("type") || "").toLowerCase();

			if (["submit", "button", "reset", "image", "file"].includes(type)) {
				return;
			}

			if (["checkbox", "radio"].includes(type) && !$field.attr("checked")) {
				return;
			}

			const value = $field.val();

			if (value !== undefined && value !== null) {
				payload.append(name, String(value));
			}
		});

	// Ação observada na requisição real do navegador.
	payload.set(
		"jscook_action",
		"menu_form_menu_discente_discente_menu:A]#{ portalDiscente.historico }",
	);

	// Evita enviar uma requisição incompleta.
	const requiredFields = [
		"menu:form_menu_discente",
		"id",
		"javax.faces.ViewState",
		"jscook_action",
	];

	for (const field of requiredFields) {
		if (!payload.has(field)) {
			throw new Error(
				`Campo obrigatório ausente na requisição do histórico: ${field}`,
			);
		}
	}

	console.log("[SIGAA PDF] Campos da requisição:", {
		formId: $menuForm.attr("id"),
		action,
		fields: [...payload.keys()],
		viewState: payload.has("javax.faces.ViewState"),
		jscookAction: payload.get("jscook_action"),
	});

	const targetUrl = new URL(action, SIGAA_BASE_URL).toString();

	const referer = `${SIGAA_BASE_URL}/sigaa/portais/discente/discente.jsf`;

	console.log("[SIGAA PDF] Solicitando histórico escolar...");

	const pdfResponse = await session.post(targetUrl, payload.toString(), {
		responseType: "arraybuffer",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Referer: referer,
			Origin: SIGAA_BASE_URL,
		},
	});

	const contentType = String(
		pdfResponse.headers["content-type"] || "",
	).toLowerCase();

	if (!contentType.includes("application/pdf")) {
		throw new Error(
			`SIGAA não retornou um PDF (Content-Type: ${contentType}).`,
		);
	}

	const buffer = Buffer.from(pdfResponse.data);

	console.log("[SIGAA PDF] Histórico recebido:", {
		bytes: buffer.length,
		contentType,
	});

	return buffer;
}
export async function syncWithSigaa(username, password, options = {}) {
	const session = createSigaaSession();

	try {
		console.log("[SIGAA HTTP Scraper] Iniciando autenticação...");

		// 1. Acessa a tela de login e obtém os campos necessários.
		const loginPageResponse = await session.get("/sigaa/verTelaLogin.do");

		const $ = cheerio.load(loginPageResponse.data);

		const form = $('form[name="loginForm"]');

		if (!form.length) {
			throw new Error("Formulário de login não encontrado.");
		}

		const action = form.attr("action");

		if (!action) {
			throw new Error("Endpoint de autenticação não encontrado.");
		}

		// Preserva os campos hidden fornecidos pelo SIGAA.
		const payload = new URLSearchParams();

		form.find('input[type="hidden"]').each((_, element) => {
			const name = $(element).attr("name");
			const value = $(element).attr("value") || "";

			if (name) {
				payload.append(name, value);
			}
		});

		payload.append("user.login", username);
		payload.append("user.senha", password);

		// Resolve corretamente actions relativas ou absolutas.
		const loginUrl = new URL(action, SIGAA_BASE_URL).toString();

		console.log("[SIGAA HTTP Scraper] Submetendo credenciais...");

		const loginResponse = await session.post(loginUrl, payload.toString(), {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Referer: `${SIGAA_BASE_URL}/sigaa/verTelaLogin.do`,
				Origin: SIGAA_BASE_URL,
			},
		});

		// 2. Verifica se o SIGAA manteve o usuário na tela de login.
		const $loginResult = cheerio.load(loginResponse.data);

		const responseUrl = loginResponse.request?.res?.responseUrl || "";

		const loginFormStillVisible =
			$loginResult('form[name="loginForm"]').length > 0;

		const redirectedToLogin = responseUrl.includes("verTelaLogin.do");

		if (loginFormStillVisible || redirectedToLogin) {
			throw new Error("Credenciais inválidas ou sessão bloqueada pelo SIGAA.");
		}

		console.log(
			"[SIGAA HTTP Scraper] Autenticado. Acessando Portal do Discente...",
		);

		// 3. Obtém o Portal do Discente.
		// Fonte de dados: CRA, curso, matrícula e locais das salas.
		const portalResponse = await session.get(
			"/sigaa/portais/discente/discente.jsf",
		);

		const htmlPortal = portalResponse.data;
		const historicoBuffer = await fetchHistoricoPdfBuffer(session, htmlPortal);
		// Modo de teste: interrompe após receber o PDF.
		// Não executa o parser, a consulta de notas ou a persistência.
		if (options.onlyHistorico) {
			return {
				success: true,
				testOnly: true,
				historicoBuffer,
			};
		}

		const pendentes = await parseHistoricoPendentes(historicoBuffer);

		console.log("[SIGAA INTEGRALIZAÇÃO] Histórico processado:", {
			total: pendentes.totalObrigatoriasPendentes,
			disciplinas: pendentes.totalDisciplinasObrigatoriasPendentes,
			matriculadas: pendentes.totalDisciplinasMatriculadas,
			semMatricula: pendentes.totalDisciplinasSemMatriculaAtual,
			exigencias: pendentes.exigenciasPendentes.length,
		});

		// parsedData.integralizacao = pendentes;
		console.log("[SIGAA HTTP Scraper] Acessando histórico de turmas...");

		// 4. Obtém a página de turmas.
		// Fonte de dados: códigos, turmas, carga horária e horários.
		const turmasResponse = await session.get(
			"/sigaa/portais/discente/turmas.jsf",
		);

		const htmlTurmas = turmasResponse.data;

		console.log(
			"[SIGAA HTTP Scraper] Extraindo e combinando dados acadêmicos...",
		);

		// 5. Combina os dados extraídos das duas páginas.
		const parsedData = formatSigaaScrapedData({
			htmlPortal,
			htmlTurmas,
			username,
		});
		parsedData.integralizacao = pendentes;

		// Sincroniza notas e frequência de todas as disciplinas do semestre atual.
		const currentTurmas = parsedData.turmas.filter(
			(turma) => turma.periodo === parsedData.currentSemester,
		);

		if (!currentTurmas.length) {
			throw new Error("Nenhuma turma encontrada para o semestre atual.");
		}

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

		console.log(
			"[SIGAA ACADÊMICO] Iniciando consulta unificada de notas e frequência:",
			{
				semestre: parsedData.currentSemester,
				total: currentTurmas.length,
			},
		);

		for (const turma of currentTurmas) {
			const courseCode = turma.codigo || "Código desconhecido";

			try {
				console.log(
					`[SIGAA ACADÊMICO] Processando ${courseCode}: ${turma.disciplina}`,
				);

				const academicData = await scrapeAcademicDataForTurma(
					session,
					turma,
					parsedData.matricula,
				);

				// Processamento de Notas
				if (academicData.notas.status === "available") {
					const extractedNotes = academicData.notas.data;

					const getAssessmentGrade = (code) =>
						extractedNotes.avaliacoes.find(
							(assessment) => assessment.codigo === code,
						)?.nota ?? null;

					turma.notasDisponiveis = true;

					turma.notas = {
						...(turma.notas || {}),

						unidade1: getAssessmentGrade("AV1"),
						unidade2: getAssessmentGrade("AV2"),
						unidade3: getAssessmentGrade("AV3"),

						mediaParcial: extractedNotes.mediaParcial,
						avaliacoes: extractedNotes.avaliacoes,
						mediaAvaliacoes: extractedNotes.mediaAvaliacoes,
						provaFinal: extractedNotes.provaFinal,
						resultado: extractedNotes.resultado,
						situacao: extractedNotes.situacao,
					};

					if (extractedNotes.faltas !== null) {
						turma.faltas = extractedNotes.faltas;
					}

					notesSummary.updated++;

					console.log("[SIGAA NOTAS] Disciplina atualizada:", {
						codigo: courseCode,
						avaliacoes: extractedNotes.avaliacoes.length,
						mediaParcial: extractedNotes.mediaParcial,
						faltas: extractedNotes.faltas,
					});
				} else if (academicData.notas.status === "not_launched") {
					turma.notasDisponiveis = false;
					notesSummary.notLaunched++;
					console.log(`[SIGAA NOTAS] ${courseCode}: notas ainda não lançadas.`);
				} else {
					notesSummary.failed.push({
						codigo: courseCode,
						error:
							academicData.notas.error ||
							"Falha técnica na extração de notas",
					});
				}

				// Processamento de Frequência
				if (academicData.frequencia.status === "available") {
					const extractedFrequency = academicData.frequencia.data;

					turma.frequenciaDisponivel = true;
					turma.frequencia = extractedFrequency;

					// Mantém o campo resumido que já existe no objeto da turma.
					// Utiliza exclusivamente o percentual relativo à carga horária.
					const percentual =
						extractedFrequency.resumo?.percentualCargaHoraria ?? null;

					if (percentual !== null) {
						turma.presencaPercentual = percentual;
					}

					frequencySummary.updated++;

					console.log("[SIGAA FREQUÊNCIA] Disciplina atualizada:", {
						codigo: courseCode,
						registros: extractedFrequency.totalRegistros,
						presentes: extractedFrequency.contagem?.presentes,
						ausentes: extractedFrequency.contagem?.ausentes,
						naoRegistradas: extractedFrequency.contagem?.naoRegistradas,
						percentual: percentual,
					});
				} else if (academicData.frequencia.status === "not_launched") {
					turma.frequenciaDisponivel = false;
					turma.frequencia = null;
					frequencySummary.notLaunched++;
					console.log(
						`[SIGAA FREQUÊNCIA] ${courseCode}: frequência ainda não lançada.`,
					);
				} else {
					frequencySummary.failed.push({
						codigo: courseCode,
						error:
							academicData.frequencia.error ||
							"Falha técnica na extração de frequência",
					});
				}
			} catch (error) {
				notesSummary.failed.push({
					codigo: courseCode,
					error: error.message,
				});

				frequencySummary.failed.push({
					codigo: courseCode,
					error: error.message,
				});

				console.error(
					`[SIGAA ACADÊMICO] Falha geral em ${courseCode}:`,
					error.message,
				);
			}
		}

		console.log("[SIGAA NOTAS] Resumo da sincronização:", notesSummary);
		console.log(
			"[SIGAA FREQUÊNCIA] Resumo da sincronização:",
			frequencySummary,
		);

		console.log(
			`[SIGAA HTTP Scraper] Extração concluída. Turmas encontradas: ${parsedData.turmas.length}`,
		);

		return {
			success: true,
			message: "Dados extraídos via HTTP.",
			student: parsedData,
		};
	} catch (error) {
		console.error("[SIGAA HTTP Scraper] Erro:", error.message);

		throw new Error(error.message);
	}
}

/**
 * Avisos públicos da UFPE.
 *
 * Ainda não existe uma implementação de extração real nesta função.
 * Retorna uma lista vazia para evitar apresentar avisos fictícios
 * como se tivessem sido obtidos do portal oficial.
 */
export async function scrapePublicUniversityNotices() {
	return [];
}

export {
	openTurmaVirtual,
	scrapeAcademicDataForTurma,
	scrapeFrequencyForTurma,
	scrapeNotesForTurma,
};
