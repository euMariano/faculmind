import { writeFile } from "node:fs/promises";
import { syncWithSigaa } from "../services/sigaaScraper.js";

const username = process.env.SIGAA_USERNAME?.trim();
const password = process.env.SIGAA_PASSWORD;

if (!username || !password) {
	console.error("Credenciais SIGAA não fornecidas.");
	process.exitCode = 1;
} else {
	try {
		console.log("[TESTE] Iniciando extração isolada do histórico...");

		const result = await syncWithSigaa(username, password, {
			onlyHistorico: true,
		});

		const buffer = result.historicoBuffer;

		if (
			!Buffer.isBuffer(buffer) ||
			buffer.subarray(0, 5).toString() !== "%PDF-"
		) {
			throw new Error("O conteúdo recebido não é um PDF válido.");
		}

		const outputPath = "/tmp/faculmind-historico-teste.pdf";

		await writeFile(outputPath, buffer);

		console.log("[TESTE] PDF recebido com sucesso!");
		console.log({
			tamanhoBytes: buffer.length,
			arquivo: outputPath,
		});
	} catch (error) {
		console.error("[TESTE] Falha:", error.message);
		process.exitCode = 1;
	}
}
