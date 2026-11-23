import { readFile } from "node:fs/promises";
import { parseHistoricoPendentes } from "../services/sigaaParser.js";

async function main() {
	const pdfPath = "/tmp/faculmind-historico-teste.pdf";
	const pdfBuffer = await readFile(pdfPath);

	console.log("[TESTE] Analisando histórico escolar...");

	const result = await parseHistoricoPendentes(pdfBuffer);

	console.log("\n[TESTE] Resumo:");
	console.log({
		totalSIGAA: result.totalObrigatoriasPendentes,
		disciplinas: result.totalDisciplinasObrigatoriasPendentes,
		matriculadas: result.totalDisciplinasMatriculadas,
		semMatricula: result.totalDisciplinasSemMatriculaAtual,
		exigencias: result.exigenciasPendentes.length,
	});

	console.log("\n[TESTE] Disciplinas:");
	console.table(result.disciplinasPendentes);

	console.log("\n[TESTE] Exigências:");
	console.table(result.exigenciasPendentes);
}

main().catch((error) => {
	console.error("[TESTE] Erro:", error.message);
	process.exitCode = 1;
});
