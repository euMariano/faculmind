import * as cheerio from "cheerio";

function normalizeDisciplineName(value) {
	return (value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/^[A-Z0-9]+\s*-\s*/i, "")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
}

function extractStudentCR($portal) {
	const acronym = $portal('acronym[title="Coeficiente de Rendimento"]').first();

	if (!acronym.length) {
		return null;
	}

	const valueCell = acronym.closest("td").next("td");

	if (!valueCell.length) {
		return null;
	}

	const value = valueCell.text().trim().replace(",", ".");

	if (!/^\d+(?:\.\d+)?$/.test(value)) {
		return null;
	}

	return value;
}

export function formatSigaaScrapedData(scrapedRawData = {}) {
	// Compatibilidade com o modo de importação manual.
	const htmlPortal = scrapedRawData.htmlPortal || scrapedRawData.html || "";
	const htmlTurmas = scrapedRawData.htmlTurmas || scrapedRawData.html || "";
	const username = scrapedRawData.username || null;

	const $portal = cheerio.load(htmlPortal);
	const $turmas = cheerio.load(htmlTurmas);

	const studentData = {
		name: username,
		matricula: username,
		course: "Graduação",
		cr: null,
		currentSemester: null,
		turmas: [],
	};

	// 1. DADOS INSTITUCIONAIS — PORTAL DO DISCENTE
	const portalText = $portal("body").text().replace(/\s+/g, " ");

	const matMatch = portalText.match(/Matrícula:\s*(\d+)/i);
	if (matMatch) {
		studentData.matricula = matMatch[1].trim();
	}

	const cursoMatch = portalText.match(
		/Curso:\s*(.+?)(?=\s+(?:Nível|Turno|Status):|$)/i,
	);
	if (cursoMatch) {
		studentData.course = cursoMatch[1].trim().replace(/\s+/g, " ");
	}

	// CR — COEFICIENTE DE RENDIMENTO
	studentData.cr = extractStudentCR($portal);
	console.log("[SIGAA PARSER] CR extraído:", studentData.cr);

	console.log(
		"[SIGAA PARSER] Elemento CR encontrado:",
		$portal('acronym[title="Coeficiente de Rendimento"]').length,
	);

	const semMatch =
		portalText.match(/Turmas do Semestre[\s\S]{0,30}?(20\d{2}\.\d)/i) ||
		portalText.match(/\b(20\d{2}\.\d)\b/);

	if (semMatch) {
		studentData.currentSemester = semMatch[1].trim();
	}

	// 2. LOCAIS — TABELA DO PORTAL DO DISCENTE
	const turmasLocais = {};

	$portal("table").each((_, table) => {
		const $table = $portal(table);

		const headerText = $table
			.find("th, td.titulo")
			.text()
			.replace(/\s+/g, " ")
			.trim()
			.toLowerCase();

		if (!headerText.includes("componente curricular")) {
			return;
		}

		$table.find("tr").each((_, row) => {
			const $row = $portal(row);

			const disciplineCell = $row.find("td.descricao").first();
			const infoCells = $row.find("td.info");

			if (!disciplineCell.length || !infoCells.length) {
				return;
			}

			const discipline = disciplineCell.text().trim();
			const local = infoCells.eq(0).text().trim();

			if (!discipline || !local) {
				return;
			}

			const normalizedName = normalizeDisciplineName(discipline);

			if (normalizedName) {
				turmasLocais[normalizedName] = local;
			}
		});
	});

	// 3. TURMAS COMPLETAS — TURMAS.JSF
	let currentPeriod = studentData.currentSemester || "Desconhecido";

	const turmasTable = $turmas("table.listagem").first();

	turmasTable.find("tr").each((index, row) => {
		const $row = $turmas(row);

		const periodCell = $row.find("td.periodo").first();

		if (periodCell.length) {
			currentPeriod = periodCell.text().trim();

			if (!studentData.currentSemester) {
				studentData.currentSemester = currentPeriod;
			}

			return;
		}

		if ($row.find("th").length) {
			return;
		}

		const cells = $row.find("td");

		if (cells.length < 4) {
			return;
		}

		const compText = $turmas(cells[0]).text().trim();
		const turmaId = $turmas(cells[1]).text().trim();
		const chRaw = $turmas(cells[2]).text().trim();
		const horario = $turmas(cells[3]).text().trim();

		if (!compText || compText.toLowerCase().includes("nenhum")) {
			return;
		}

		let code = null;
		let name = compText;

		const match = compText.match(/^([A-Z0-9]+)\s*-\s*(.+)$/i);

		if (match) {
			code = match[1].trim();
			name = match[2].trim();
		}

		const normalizedName = normalizeDisciplineName(name);
		const localExtraido = turmasLocais[normalizedName] || null;

		const chDigits = chRaw.replace(/\D/g, "");
		const chNumber = chDigits ? Number(chDigits) : null;

		const periodForId = currentPeriod.replace(/\s+/g, "-");
		const codeForId = code || "sem-codigo";
		const classForId = turmaId || `linha-${index}`;

		studentData.turmas.push({
			id: `${periodForId}-${codeForId}-${classForId}`,
			periodo: currentPeriod,
			codigo: code,
			disciplina: name,
			turmaId: turmaId || null,
			local: localExtraido,
			horario: horario || null,
			cargaHoraria: chNumber,

			faltas: null,
			maxFaltasPermitidas: null,
			presencaPercentual: null,
			docente: null,
			status: null,

			notas: {
				unidade1: null,
				unidade2: null,
				mediaParcial: null,
			},
		});
	});

	// 4. MANTÉM APENAS AS TURMAS DO PERÍODO MAIS RECENTE
	if (studentData.turmas.length > 0) {
		const latestPeriod = studentData.turmas[0].periodo;

		studentData.turmas = studentData.turmas.filter(
			(turma) => turma.periodo === latestPeriod,
		);

		if (!studentData.currentSemester) {
			studentData.currentSemester = latestPeriod;
		}
	}

	return studentData;
}

export function parseSigaaContent(html, meta = {}) {
	return formatSigaaScrapedData({
		htmlPortal: html,
		htmlTurmas: html,
		username: meta.studentName || null,
	});
}

/**
 * Extrai as notas de um aluno específico do relatório da Turma Virtual.
 * Não retorna dados de outros estudantes.
 */
export function parseSigaaNotesReport(html, matricula) {
	const $ = cheerio.load(html || "");

	const $report = $("#relatorio");
	const $table = $report.find("table.tabelaRelatorio").first();

	if (!$report.length || !$table.length) {
		throw new Error("Relatório de notas não encontrado.");
	}

	const targetMatricula = String(matricula || "").replace(/\D/g, "");

	if (!targetMatricula) {
		throw new Error("Matrícula do aluno não fornecida.");
	}

	const normalizeMatricula = (value) => String(value || "").replace(/\D/g, "");

	const cleanText = (value) => {
		const text = String(value || "")
			.replace(/\s+/g, " ")
			.trim();

		return !text || /^[-–—]+$/.test(text) ? null : text;
	};

	const parseNumber = (value) => {
		const text = cleanText(value);

		if (text === null) return null;

		const number = Number(text.replace(",", "."));

		return Number.isFinite(number) ? number : null;
	};

	// Localiza exclusivamente a linha correspondente à matrícula autenticada.
	const $studentRow = $table
		.find("tbody tr")
		.filter((_, element) => {
			const studentMatricula = $(element).children("td").first().text();

			return normalizeMatricula(studentMatricula) === targetMatricula;
		})
		.first();

	if (!$studentRow.length) {
		throw new Error("Aluno autenticado não encontrado no relatório de notas.");
	}

	const cells = $studentRow.children("td");

	const $headerRow = $table.find('tr[id="trAval"]').first();
	const $headers = $headerRow.children("th");

	if (!$headerRow.length || cells.length !== $headers.length) {
		throw new Error(
			"Não foi possível associar as colunas do relatório às notas.",
		);
	}

	const cellText = (index) => cells.eq(index).text().trim();

	const evaluations = [];

	// Identifica dinamicamente AV1, AV2 e outras avaliações.
	$headers.each((index, element) => {
		const $header = $(element);
		const headerId = $header.attr("id") || "";

		if (!headerId.startsWith("aval_")) return;

		const evaluationId = headerId.slice("aval_".length);

		const getHiddenValue = (prefix) =>
			$table.find(`[id="${prefix}_${evaluationId}"]`).attr("value") || null;

		evaluations.push({
			codigo: $header.text().trim(),
			denominacao: cleanText(getHiddenValue("denAval")),
			nota: parseNumber(cellText(index)),
			peso: parseNumber(getHiddenValue("pesoAval")),
		});
	});

	// As colunas com id "unid" representam a média das avaliações
	// e a nota da prova final, respectivamente.
	const unitIndexes = [];

	$headers.each((index, element) => {
		if ($(element).attr("id") === "unid") {
			unitIndexes.push(index);
		}
	});

	const mediaAvaliacoes =
		unitIndexes.length > 0 ? parseNumber(cellText(unitIndexes[0])) : null;

	const provaFinal =
		unitIndexes.length > 1 ? parseNumber(cellText(unitIndexes[1])) : null;

	// As quatro últimas colunas são:
	// Média Parcial, Resultado, Faltas e Situação.
	const lastIndex = cells.length;

	return {
		matricula: targetMatricula,
		avaliacoes: evaluations,
		mediaAvaliacoes,
		provaFinal,
		mediaParcial: parseNumber(cellText(lastIndex - 4)),
		resultado: cleanText(cellText(lastIndex - 3)),
		faltas: parseNumber(cellText(lastIndex - 2)),
		situacao: cleanText(cellText(lastIndex - 1)),
	};
}
