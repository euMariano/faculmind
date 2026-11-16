import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";

import {
	formatSigaaScrapedData,
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
		console.log("[SIGAA JSF] Envio do formulário Ver Notas:", {
			action: targetUrl,
			command: command.params,
			viewStateEnviado: payload.get("javax.faces.ViewState"),
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

async function scrapeNotesForTurma(session, turma, matricula) {
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

	// 2. Localiza o link da disciplina e confere seu período.
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

	console.log("[SIGAA NOTAS] Turma aberta:", {
		codigo: actualCode,
		disciplina: actualName,
		periodo: turma.periodo,
	});

	// 6. Acessa Ver Notas.
	const $notesLink = $class("#formMenu a")
		.filter((_, element) => {
			return (
				$class(element).find(".itemMenu").text().trim().toLowerCase() ===
				"ver notas"
			);
		})
		.first();

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
	const $notes = cheerio.load(notesHtml);

	// 7. Verifica se o SIGAA ainda não lançou notas.
	const warningText = normalizeSigaaLabel(
		[$class("#painel-erros").text(), $notes("#painel-erros").text()].join(" "),
	);

	if (warningText.includes("ainda nao foram lancadas notas")) {
		return {
			status: "not_launched",
		};
	}

	// 8. Extrai somente as notas do aluno autenticado.
	if (
		!$notes("#relatorio").length ||
		!$notes("#relatorio table.tabelaRelatorio").length
	) {
		throw new Error("SIGAA não retornou o relatório de notas esperado.");
	}

	const notes = parseSigaaNotesReport(notesHtml, matricula);

	return {
		status: "available",
		notes,
	};
}

export async function syncWithSigaa(username, password) {
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

		// Sincroniza as notas de todas as disciplinas do semestre atual.
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

		console.log("[SIGAA NOTAS] Iniciando sincronização:", {
			semestre: parsedData.currentSemester,
			total: currentTurmas.length,
		});

		for (const turma of currentTurmas) {
			const courseCode = turma.codigo || "Código desconhecido";

			try {
				console.log(
					`[SIGAA NOTAS] Consultando ${courseCode}: ${turma.disciplina}`,
				);

				const result = await scrapeNotesForTurma(
					session,
					turma,
					parsedData.matricula,
				);

				if (result.status === "not_launched") {
					turma.notasDisponiveis = false;

					notesSummary.notLaunched++;

					console.log(`[SIGAA NOTAS] ${courseCode}: notas ainda não lançadas.`);

					continue;
				}

				const extractedNotes = result.notes;

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
			} catch (error) {
				notesSummary.failed.push({
					codigo: courseCode,
					error: error.message,
				});

				console.error(`[SIGAA NOTAS] Falha em ${courseCode}:`, error.message);
			}
		}

		console.log("[SIGAA NOTAS] Resumo da sincronização:", notesSummary);

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
