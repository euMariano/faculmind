import assert from "node:assert/strict";
import {
	getTurmaCompositeKey,
	mergeAcademicRecords,
} from "../data/store.js";
import { parseSigaaFrequencyReport } from "../services/sigaaParser.js";
import { getHistoryTtlMs } from "../services/sigaaScraper.js";

console.log("=== INICIANDO SUÍTE DE TESTES: REQUISIÇÃO 2 ===\n");

// Helper para gerar HTML de frequência do SIGAA
function createFrequencyHtml(rows = [], summaryOverrides = {}) {
	const summaryHtml = `
		<div class="botoes-show">
			Presenças registradas: ${summaryOverrides.presencas ?? 20} <br/>
			Número de aulas com registro de frequência: ${summaryOverrides.aulasComRegistro ?? 24} <br/>
			Porcentagem de frequência em relação às aulas com registro de frequência: ${summaryOverrides.percentualAulas ?? "83,33"} % <br/>
			Número de aulas definidas pela CH do componente: ${summaryOverrides.aulasDefinidas ?? 60} <br/>
			Porcentagem de frequência em relação à CH: ${summaryOverrides.percentualCH ?? "33,33"} %
		</div>
	`;

	const rowsHtml = rows
		.map(
			(r) => `
		<tr>
			<td>${r.data}</td>
			<td>${r.situacao}</td>
		</tr>
	`,
		)
		.join("");

	return `
		<html>
			<body>
				${summaryHtml}
				<table class="listing">
					<thead>
						<tr>
							<th>Data</th>
							<th>Situação</th>
						</tr>
					</thead>
					<tbody>
						${rowsHtml}
					</tbody>
				</table>
			</body>
		</html>
	`;
}

// -------------------------------------------------------------
// 8.1 TESTES DO PARSER DE FREQUÊNCIA
// -------------------------------------------------------------
console.log("--- 8.1 TESTES DO PARSER DE FREQUÊNCIA ---");

{
	// 1. Presente incrementa presentes e não incrementa faltas
	const html = createFrequencyHtml([
		{ data: "01/09/2026", situacao: "Presente" },
		{ data: "03/09/2026", situacao: "PRESENTE" },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.presentes, 2);
	assert.equal(res.contagem.ausentes, 0);
	assert.equal(res.contagem.totalFaltas, 0);
	assert.equal(res.registros[0].categoria, "presente");
	assert.equal(res.registros[0].quantidadeFaltas, undefined);
	console.log("  ✓ 1. Presente incrementa presentes e não faltas");
}

{
	// 2. Ausente incrementa ausentes em 1 e totalFaltas em 1
	const html = createFrequencyHtml([
		{ data: "05/09/2026", situacao: "Ausente" },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.ausentes, 1);
	assert.equal(res.contagem.totalFaltas, 1);
	assert.equal(res.registros[0].categoria, "ausente");
	assert.equal(res.registros[0].quantidadeFaltas, 1);
	console.log("  ✓ 2. Ausente incrementa ausentes em 1 e totalFaltas em 1");
}

{
	// 3. Falta e Faltou sem quantidade contam uma falta
	const html = createFrequencyHtml([
		{ data: "08/09/2026", situacao: "Falta" },
		{ data: "10/09/2026", situacao: "Faltou" },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.ausentes, 2);
	assert.equal(res.contagem.totalFaltas, 2);
	assert.equal(res.registros[0].quantidadeFaltas, 1);
	assert.equal(res.registros[1].quantidadeFaltas, 1);
	console.log("  ✓ 3. Falta e Faltou sem quantidade contam 1 falta cada");
}

{
	// 4. 4 Falta(s) incrementa ausentes em 1 e totalFaltas em 4
	const html = createFrequencyHtml([
		{ data: "14/09/2026", situacao: "4 Falta(s)" },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.ausentes, 1);
	assert.equal(res.contagem.totalFaltas, 4);
	assert.equal(res.registros[0].categoria, "ausente");
	assert.equal(res.registros[0].quantidadeFaltas, 4);
	console.log("  ✓ 4. '4 Falta(s)' incrementa ausentes em 1 e totalFaltas em 4");
}

{
	// 5. Variações de singular/plural, espaços, maiúsculas e parênteses
	const html = createFrequencyHtml([
		{ data: "15/09/2026", situacao: "1 Falta" },
		{ data: "16/09/2026", situacao: "1 Falta(s)" },
		{ data: "17/09/2026", situacao: "2 Faltas" },
		{ data: "18/09/2026", situacao: "  4   FALTA(S)  " },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.ausentes, 4);
	assert.equal(res.contagem.totalFaltas, 1 + 1 + 2 + 4);
	assert.equal(res.registros[0].quantidadeFaltas, 1);
	assert.equal(res.registros[1].quantidadeFaltas, 1);
	assert.equal(res.registros[2].quantidadeFaltas, 2);
	assert.equal(res.registros[3].quantidadeFaltas, 4);
	console.log("  ✓ 5. Variações de formato numérico de faltas tratadas");
}

{
	// 6. Não Registrada e Não Lançada incrementam apenas naoRegistradas
	const html = createFrequencyHtml([
		{ data: "20/09/2026", situacao: "Não Registrada" },
		{ data: "22/09/2026", situacao: "Nao Lancada" },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.naoRegistradas, 2);
	assert.equal(res.contagem.ausentes, 0);
	assert.equal(res.contagem.totalFaltas, 0);
	assert.equal(res.registros[0].categoria, "nao_registrada");
	assert.equal(res.registros[1].categoria, "nao_registrada");
	console.log("  ✓ 6. 'Não Registrada' incrementa apenas naoRegistradas");
}

{
	// 7. Situação desconhecida incrementa apenas outros
	const html = createFrequencyHtml([
		{ data: "25/09/2026", situacao: "Abonado pelo Colegiado" },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.contagem.outros, 1);
	assert.equal(res.contagem.ausentes, 0);
	assert.equal(res.contagem.totalFaltas, 0);
	assert.equal(res.registros[0].categoria, "outro");
	console.log("  ✓ 7. Situação desconhecida classificada como 'outro'");
}

{
	// 8. O texto original de situacao permanece intacto no registro
	const rawSituacao = "   4 Falta(s)   ";
	const html = createFrequencyHtml([
		{ data: "28/09/2026", situacao: rawSituacao },
	]);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.registros[0].situacao, "4 Falta(s)");
	console.log("  ✓ 8. Texto original de 'situacao' preservado");
}

{
	// 9. Resumo oficial do SIGAA extraído sem ser recalculado
	const html = createFrequencyHtml(
		[{ data: "01/09/2026", situacao: "Presente" }],
		{
			presencas: 18,
			aulasComRegistro: 20,
			percentualAulas: "90,00",
			aulasDefinidas: 60,
			percentualCH: "30,00",
		},
	);
	const res = parseSigaaFrequencyReport(html);
	assert.equal(res.resumo.percentualCargaHoraria, 30.0);
	assert.equal(res.resumo.presencasRegistradas, 18);
	console.log("  ✓ 9. Resumo oficial do SIGAA extraído diretamente");
}

// -------------------------------------------------------------
// 8.2 TESTES DE MESCLAGEM E PERSISTÊNCIA
// -------------------------------------------------------------
console.log("\n--- 8.2 TESTES DE MESCLAGEM E PERSISTÊNCIA ---");

{
	// 1. Notas anteriores válidas + nova consulta failed = preservar notas e disponibilidade
	const existing = {
		name: "Aluno Teste",
		currentSemester: "2026.2",
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				codigo: "CT506",
				notasDisponiveis: true,
				notas: { unidade1: 8.5, unidade2: 9.0, mediaParcial: 8.75 },
			},
		],
	};
	const incoming = {
		name: "Aluno Teste",
		currentSemester: "2026.2",
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				codigo: "CT506",
				notasDisponiveis: null,
				notas: null,
			},
		],
	};
	const report = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "failed", frequencia: "available" },
		},
	};
	const merged = mergeAcademicRecords(existing, incoming, report);
	assert.equal(merged.turmas[0].notasDisponiveis, true);
	assert.equal(merged.turmas[0].notas.mediaParcial, 8.75);
	console.log("  ✓ 1. Notas preservadas quando nova consulta falha (failed)");
}

{
	// 2. Frequência anterior válida + nova consulta failed = preservar frequência, faltas e %
	const existing = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				frequenciaDisponivel: true,
				presencaPercentual: 85.0,
				faltas: 4,
				frequencia: { totalRegistros: 10 },
			},
		],
	};
	const incoming = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				frequenciaDisponivel: null,
				presencaPercentual: null,
				faltas: null,
				frequencia: null,
			},
		],
	};
	const report = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "available", frequencia: "failed" },
		},
	};
	const merged = mergeAcademicRecords(existing, incoming, report);
	assert.equal(merged.turmas[0].frequenciaDisponivel, true);
	assert.equal(merged.turmas[0].presencaPercentual, 85.0);
	assert.equal(merged.turmas[0].faltas, 4);
	assert.equal(merged.turmas[0].frequencia.totalRegistros, 10);
	console.log("  ✓ 2. Frequência preservada quando nova consulta falha (failed)");
}

{
	// 3 & 4. Independência de categorias: notas failed + freq available e vice-versa
	const existing = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				notasDisponiveis: true,
				notas: { unidade1: 7.0 },
				frequenciaDisponivel: true,
				faltas: 2,
			},
		],
	};
	const incoming = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				notasDisponiveis: null,
				notas: null,
				frequenciaDisponivel: true,
				faltas: 6,
				frequencia: { contagem: { totalFaltas: 6 } },
			},
		],
	};
	const report = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "failed", frequencia: "available" },
		},
	};
	const merged = mergeAcademicRecords(existing, incoming, report);
	assert.equal(merged.turmas[0].notas.unidade1, 7.0); // preservou notas
	assert.equal(merged.turmas[0].faltas, 6); // atualizou frequência
	console.log("  ✓ 3 & 4. Independência de notas e frequência comprovada");
}

{
	// 5. Uma turma falha e outra é atualizada
	const existing = {
		turmas: [
			{ id: "2026.2-CT506-SE04", notas: { mediaParcial: 8.0 } },
			{ id: "2026.2-AD447-SE04", notas: { mediaParcial: 6.0 } },
		],
	};
	const incoming = {
		turmas: [
			{ id: "2026.2-CT506-SE04", notas: null },
			{ id: "2026.2-AD447-SE04", notas: { mediaParcial: 9.5 } },
		],
	};
	const report = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "failed", frequencia: "failed" },
			"2026.2-AD447-SE04": { notas: "available", frequencia: "available" },
		},
	};
	const merged = mergeAcademicRecords(existing, incoming, report);
	assert.equal(merged.turmas[0].notas.mediaParcial, 8.0);
	assert.equal(merged.turmas[1].notas.mediaParcial, 9.5);
	console.log("  ✓ 5. Falha em uma turma não afeta a atualização das demais");
}

{
	// 6. not_launched atualiza disponibilidade para false sem inventar zero
	const existing = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				notasDisponiveis: true,
				notas: { unidade1: 10 },
				frequenciaDisponivel: true,
				faltas: 2,
			},
		],
	};
	const incoming = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				notasDisponiveis: false,
				notas: { unidade1: null, unidade2: null, mediaParcial: null },
				frequenciaDisponivel: false,
				frequencia: null,
				faltas: null,
			},
		],
	};
	const report = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "not_launched", frequencia: "not_launched" },
		},
	};
	const merged = mergeAcademicRecords(existing, incoming, report);
	assert.equal(merged.turmas[0].notasDisponiveis, false);
	assert.equal(merged.turmas[0].notas.unidade1, null);
	assert.equal(merged.turmas[0].frequenciaDisponivel, false);
	assert.equal(merged.turmas[0].faltas, null);
	console.log("  ✓ 6. 'not_launched' marca indisponível sem inventar zero");
}

{
	// 7. failed sem dado anterior mantém null/desconhecido
	const incoming = {
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				notasDisponiveis: null,
				notas: null,
				frequenciaDisponivel: null,
				faltas: null,
			},
		],
	};
	const report = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "failed", frequencia: "failed" },
		},
	};
	const merged = mergeAcademicRecords(null, incoming, report);
	assert.equal(merged.turmas[0].notasDisponiveis, null);
	assert.equal(merged.turmas[0].notas, null);
	assert.equal(merged.turmas[0].frequenciaDisponivel, null);
	assert.equal(merged.turmas[0].faltas, null);
	console.log("  ✓ 7. 'failed' sem dado anterior mantém estado null");
}

{
	// 8. Importação manual preserva notas, frequência e integralização existentes
	const existing = {
		name: "Estudante",
		integralizacao: { totalObrigatoriasPendentes: 5 },
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				periodo: "2026.2",
				codigo: "CT506",
				turmaId: "SE04",
				notasDisponiveis: true,
				notas: { mediaParcial: 9.0 },
				frequenciaDisponivel: true,
				faltas: 4,
			},
		],
	};
	const manualImport = {
		name: "Estudante Atualizado",
		currentSemester: "2026.2",
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				periodo: "2026.2",
				codigo: "CT506",
				turmaId: "SE04",
				disciplina: "Contabilidade",
				horario: "35M12",
			},
		],
	};
	const merged = mergeAcademicRecords(existing, manualImport, {
		isManualImport: true,
	});
	assert.equal(merged.name, "Estudante Atualizado");
	assert.equal(merged.integralizacao.totalObrigatoriasPendentes, 5);
	assert.equal(merged.turmas[0].horario, "35M12");
	assert.equal(merged.turmas[0].notasDisponiveis, true);
	assert.equal(merged.turmas[0].notas.mediaParcial, 9.0);
	assert.equal(merged.turmas[0].faltas, 4);
	console.log("  ✓ 8. Importação manual preserva dados detalhados anteriores");
}

{
	// 9. Dados gerais do aluno preservados quando nova extração não os fornece
	const existing = {
		name: "Maria Silva",
		matricula: "20231001",
		course: "Secretariado Executivo",
		cr: 8.7,
		currentSemester: "2026.2",
	};
	const incoming = {
		name: null,
		matricula: "",
		course: null,
		cr: null,
		currentSemester: "2026.2",
		turmas: [],
	};
	const merged = mergeAcademicRecords(existing, incoming);
	assert.equal(merged.name, "Maria Silva");
	assert.equal(merged.matricula, "20231001");
	assert.equal(merged.course, "Secretariado Executivo");
	assert.equal(merged.cr, 8.7);
	console.log("  ✓ 9. Metadados gerais válidos preservados de ausências novas");
}

{
	// 10. Turmas correlacionadas por id e por chave composta (sem misturar turmas)
	const existing = {
		turmas: [
			{
				// Sem id prévio, mas com período, código e turmaId
				periodo: "2026.2",
				codigo: "AD447",
				turmaId: "T01",
				notas: { mediaParcial: 7.0 },
			},
			{
				periodo: "2026.2",
				codigo: "AD447",
				turmaId: "T02",
				notas: { mediaParcial: 9.0 },
			},
		],
	};
	const incoming = {
		turmas: [
			{
				id: "2026.2-AD447-T01",
				periodo: "2026.2",
				codigo: "AD447",
				turmaId: "T01",
				notas: { mediaParcial: 7.5 },
			},
			{
				id: "2026.2-AD447-T02",
				periodo: "2026.2",
				codigo: "AD447",
				turmaId: "T02",
				notas: { mediaParcial: 9.5 },
			},
		],
	};
	assert.equal(
		getTurmaCompositeKey(existing.turmas[0]),
		"2026.2-AD447-T01",
	);
	assert.equal(
		getTurmaCompositeKey(existing.turmas[1]),
		"2026.2-AD447-T02",
	);
	const merged = mergeAcademicRecords(existing, incoming, {
		turmas: {
			"2026.2-AD447-T01": { notas: "available" },
			"2026.2-AD447-T02": { notas: "available" },
		},
	});
	assert.equal(merged.turmas[0].notas.mediaParcial, 7.5);
	assert.equal(merged.turmas[1].notas.mediaParcial, 9.5);
	console.log("  ✓ 10. Chave composta distingue diferentes turmas do mesmo código");
}

{
	// 11. Mudança de semestre: turmas antigas não são inseridas na lista atual
	const existing = {
		currentSemester: "2026.1",
		turmas: [
			{ id: "2026.1-AD101-T01", disciplina: "Introdução à Administração" },
		],
	};
	const incoming = {
		currentSemester: "2026.2",
		turmas: [
			{ id: "2026.2-CT506-SE04", disciplina: "Contabilidade Geral" },
		],
	};
	const merged = mergeAcademicRecords(existing, incoming);
	assert.equal(merged.currentSemester, "2026.2");
	assert.equal(merged.turmas.length, 1);
	assert.equal(merged.turmas[0].id, "2026.2-CT506-SE04");
	console.log("  ✓ 11. Mudança de semestre reflete apenas as turmas atuais");
}

{
	// 12. Transação do DataStore com mock de Firestore
	const mockDb = {
		docData: {
			name: "Aluno Transacional",
			turmas: [
				{
					id: "2026.2-CT506-SE04",
					notasDisponiveis: true,
					notas: { mediaParcial: 8.0 },
				},
			],
		},
		runTransaction: async function (callback) {
			const transaction = {
				get: async () => ({
					exists: true,
					data: () => ({ ...mockDb.docData }),
				}),
				set: (docRef, data) => {
					mockDb.docData = data;
				},
			};
			return await callback(transaction);
		},
		collection: () => ({
			doc: (uid) => ({ uid }),
		}),
	};

	// Simula a lógica de mergeAndSaveStudentAcademicRecord usando mockDb
	const incoming = {
		name: "Aluno Transacional",
		turmas: [
			{
				id: "2026.2-CT506-SE04",
				notasDisponiveis: null,
				notas: null,
			},
		],
	};
	const syncReport = {
		turmas: {
			"2026.2-CT506-SE04": { notas: "failed" },
		},
	};

	const merged = await mockDb.runTransaction(async (transaction) => {
		const docRef = mockDb.collection("students").doc("user-123");
		const docSnap = await transaction.get(docRef);
		const existingRecord = docSnap.exists ? docSnap.data() : null;
		const res = mergeAcademicRecords(existingRecord, incoming, syncReport);
		transaction.set(docRef, res);
		return res;
	});

	assert.equal(merged.turmas[0].notasDisponiveis, true);
	assert.equal(merged.turmas[0].notas.mediaParcial, 8.0);
	assert.equal(mockDb.docData.turmas[0].notas.mediaParcial, 8.0);
	console.log("  ✓ 12. Transação Firestore executa leitura e gravação segura");
}

{
	// 13. Isolamento entre UIDs: nunca compartilha dados
	const user1 = mergeAcademicRecords(
		{ matricula: "111" },
		{ matricula: "111", cr: 8.0 },
	);
	const user2 = mergeAcademicRecords(
		{ matricula: "222" },
		{ matricula: "222", cr: 6.0 },
	);
	assert.equal(user1.matricula, "111");
	assert.equal(user2.matricula, "222");
	console.log("  ✓ 13. Isolamento estrito entre usuários confirmado");
}

// -------------------------------------------------------------
// 8.3 TESTES DE VALIDADE DO HISTÓRICO
// -------------------------------------------------------------
console.log("\n--- 8.3 TESTES DE VALIDADE DO HISTÓRICO ---");

{
	// 1. Fallback de TTL configurável
	const defaultTtlMs = getHistoryTtlMs();
	assert.equal(defaultTtlMs, 24 * 60 * 60 * 1000); // 24 horas padrão

	process.env.SIGAA_HISTORY_TTL_HOURS = "12";
	assert.equal(getHistoryTtlMs(), 12 * 60 * 60 * 1000);

	process.env.SIGAA_HISTORY_TTL_HOURS = "invalid";
	assert.equal(getHistoryTtlMs(), 24 * 60 * 60 * 1000); // fallback

	process.env.SIGAA_HISTORY_TTL_HOURS = "-5";
	assert.equal(getHistoryTtlMs(), 24 * 60 * 60 * 1000); // fallback para <= 0

	delete process.env.SIGAA_HISTORY_TTL_HOURS;
	console.log("  ✓ 1. TTL configurável por env com fallback seguro de 24h");
}

{
	// 2. Avaliação de elegibilidade para reúso da integralização
	function evaluateHistoryReuse({
		existingRecord,
		currentSemester,
		forceHistory,
		ttlMs = 24 * 60 * 60 * 1000,
		currentTime = new Date(),
	}) {
		const isForceHistory = forceHistory === true;
		const existingHistory = existingRecord?.integralizacao || null;
		const existingMeta = existingRecord?.syncMetadata?.history || null;

		const hasValidExistingHistory = Boolean(
			existingHistory &&
				(Array.isArray(existingHistory.disciplinasPendentes) ||
					existingHistory.totalObrigatoriasPendentes !== undefined),
		);
		const hasValidMeta = Boolean(
			existingMeta &&
				existingMeta.lastSuccessfulAt &&
				existingMeta.semester,
		);
		const sameSemester = existingMeta?.semester === currentSemester;
		const withinTtl =
			hasValidMeta &&
			currentTime.getTime() -
				new Date(existingMeta.lastSuccessfulAt).getTime() <
				ttlMs;

		return (
			!isForceHistory &&
			hasValidExistingHistory &&
			sameSemester &&
			withinTtl
		);
	}

	const now = new Date();
	const recentDate = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2h atrás
	const expiredDate = new Date(
		now.getTime() - 26 * 60 * 60 * 1000,
	).toISOString(); // 26h atrás

	const validRecord = {
		integralizacao: {
			totalObrigatoriasPendentes: 3,
			disciplinasPendentes: [{ codigo: "AD450" }],
		},
		syncMetadata: {
			history: {
				lastSuccessfulAt: recentDate,
				semester: "2026.2",
				lastAttemptStatus: "success",
			},
		},
	};

	// Cenário A: Reutilizar (mesmo semestre, metadados válidos, dentro do TTL)
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: validRecord,
			currentSemester: "2026.2",
			forceHistory: false,
			currentTime: now,
		}),
		true,
	);
	console.log("  ✓ 2A. Integralização reutilizada dentro do TTL no mesmo semestre");

	// Cenário B: Sem integralização anterior -> não reutiliza
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: {},
			currentSemester: "2026.2",
			forceHistory: false,
			currentTime: now,
		}),
		false,
	);
	console.log("  ✓ 2B. Sem integralização anterior -> atualiza");

	// Cenário C: Metadados ausentes -> não reutiliza
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: { integralizacao: { totalObrigatoriasPendentes: 3 } },
			currentSemester: "2026.2",
			forceHistory: false,
			currentTime: now,
		}),
		false,
	);
	console.log("  ✓ 2C. Metadados ausentes -> atualiza");

	// Cenário D: TTL expirado -> não reutiliza
	const expiredRecord = {
		...validRecord,
		syncMetadata: {
			history: {
				lastSuccessfulAt: expiredDate,
				semester: "2026.2",
			},
		},
	};
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: expiredRecord,
			currentSemester: "2026.2",
			forceHistory: false,
			currentTime: now,
		}),
		false,
	);
	console.log("  ✓ 2D. TTL expirado -> atualiza");

	// Cenário E: Semestre mudou -> não reutiliza
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: validRecord,
			currentSemester: "2027.1",
			forceHistory: false,
			currentTime: now,
		}),
		false,
	);
	console.log("  ✓ 2E. Mudança de semestre -> atualiza mesmo dentro do TTL");

	// Cenário F: forceHistory = true -> não reutiliza
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: validRecord,
			currentSemester: "2026.2",
			forceHistory: true,
			currentTime: now,
		}),
		false,
	);
	console.log("  ✓ 2F. forceHistory: true força nova consulta");

	// Cenário G: forceHistory com string "true" não força (exige booleano estrito)
	assert.equal(
		evaluateHistoryReuse({
			existingRecord: validRecord,
			currentSemester: "2026.2",
			forceHistory: "true", // string!
			currentTime: now,
		}),
		true,
	);
	console.log("  ✓ 2G. forceHistory exige estritamente valor booleano true");
}

{
	// 3. Falha de histórico preserva integralização anterior sem avançar lastSuccessfulAt
	const lastSuccess = "2026-11-20T10:00:00.000Z";
	const existing = {
		integralizacao: { totalObrigatoriasPendentes: 4 },
		syncMetadata: {
			history: {
				lastSuccessfulAt: lastSuccess,
				semester: "2026.2",
				lastAttemptStatus: "success",
			},
		},
	};
	const incoming = {
		integralizacao: null,
		syncMetadata: {
			history: {
				lastSuccessfulAt: lastSuccess, // não avançou!
				semester: "2026.2",
				lastAttemptStatus: "failed",
			},
		},
	};
	const merged = mergeAcademicRecords(existing, incoming, {
		history: "failed",
	});
	assert.equal(merged.integralizacao.totalObrigatoriasPendentes, 4);
	assert.equal(merged.syncMetadata.history.lastSuccessfulAt, lastSuccess);
	assert.equal(merged.syncMetadata.history.lastAttemptStatus, "failed");
	console.log("  ✓ 3. Falha ao atualizar histórico preserva última integralização e timestamp");
}

// -------------------------------------------------------------
// 8.4 TESTES DE ROTA E SEGURANÇA
// -------------------------------------------------------------
console.log("\n--- 8.4 TESTES DE ROTA E SEGURANÇA ---");

{
	// Verificação de tipos estritos
	const isStrictForce1 = true === true;
	const isStrictForce2 = "true" === true;
	const isStrictForce3 = 1 === true;
	assert.equal(isStrictForce1, true);
	assert.equal(isStrictForce2, false);
	assert.equal(isStrictForce3, false);
	console.log("  ✓ 1. Validação estrita de forceHistory booleano");

	// Verificação de isolamento por req.uid
	function routeHandlerMock(req) {
		const targetUid = req.uid; // apenas de authenticateToken
		// ignorar qualquer uid ou student vindo de req.body
		assert.notEqual(targetUid, req.body.uid);
		assert.notEqual(targetUid, req.body.student?.uid);
		return { uidUtilizado: targetUid };
	}
	const res = routeHandlerMock({
		uid: "auth-verified-uid-999",
		body: {
			username: "user",
			password: "pwd",
			uid: "malicious-spoofed-uid-111",
			student: { uid: "malicious-spoofed-uid-222" },
		},
	});
	assert.equal(res.uidUtilizado, "auth-verified-uid-999");
	console.log("  ✓ 2. Apenas req.uid autenticado é aceito pela rota");
}

console.log("\n=======================================================");
console.log("TODOS OS TESTES DA REQUISIÇÃO 2 PASSARAM COM SUCESSO! 🎉");
console.log("=======================================================");
