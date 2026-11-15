import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";

import { formatSigaaScrapedData } from "./sigaaParser.js";

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
