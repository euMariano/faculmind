/**
 * Facul Mind AI Agent Orchestrator
 * - Agy (UFPE Academic Assistant with real SIGAA context & Gemini 3.5 Flash)
 */

import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import { dataStore } from "../data/store.js";

// -------------------------------------------------------------
// In-memory response cache (no Redis, no external deps)
// Two separate stores: global (institutional) and per-UID (academic)
// -------------------------------------------------------------
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** @type {Map<string, {response: object, expiresAt: number}>} */
const globalCache = new Map();

/** @type {Map<string, Map<string, {response: object, expiresAt: number}>>} */
const userCacheMap = new Map();

function hashKey(parts) {
	return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

function getCachedGlobal(key) {
	const entry = globalCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		globalCache.delete(key);
		return null;
	}
	return entry.response;
}

function setCachedGlobal(key, response) {
	globalCache.set(key, { response, expiresAt: Date.now() + CACHE_TTL_MS });
}

function getCachedUser(uid, key) {
	const userCache = userCacheMap.get(uid);
	if (!userCache) return null;
	const entry = userCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		userCache.delete(key);
		return null;
	}
	return entry.response;
}

function setCachedUser(uid, key, response) {
	if (!userCacheMap.has(uid)) {
		userCacheMap.set(uid, new Map());
	}
	userCacheMap
		.get(uid)
		.set(key, { response, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Invalidate all cached responses for a specific user.
 * Called after successful SIGAA sync.
 */
export function invalidateUserCache(uid) {
	if (uid && userCacheMap.has(uid)) {
		userCacheMap.delete(uid);
		console.log(`[Cache] Invalidated cache for UID ${uid}`);
	}
}

// -------------------------------------------------------------
// Gemini caller
// -------------------------------------------------------------

async function callGemini({
	message,
	systemInstruction,
	contextData = {},
	history = [],
}) {
	const apiKey = process.env.GEMINI_API_KEY?.trim();

	if (!apiKey || apiKey.includes("sua_chave")) {
		return { ok: false, reason: "not_configured" };
	}

	try {
		const genAI = new GoogleGenAI({ apiKey });

		const promptParts = [];

		if (Object.keys(contextData).length > 0) {
			promptParts.push(`Contexto:\n${JSON.stringify(contextData)}`);
		}

		if (history.length > 0) {
			const historyText = history
				.map((h) => `${h.sender === "user" ? "Aluno" : "Agý"}: ${h.text}`)
				.join("\n");

			promptParts.push(`Histórico recente:\n${historyText}`);
		}

		promptParts.push(`Mensagem atual:\n${message}`);

		const result = await genAI.models.generateContent({
			model: "gemini-3.5-flash-lite",
			contents: promptParts.join("\n\n"),
			config: {
				systemInstruction,
				maxOutputTokens: 1024,
				temperature: 0.5,
			},
		});

		const text = result.text?.trim();

		if (!text) {
			return { ok: false, reason: "empty_response" };
		}

		return { ok: true, text };
	} catch (err) {
		const status = Number(err?.status || err?.statusCode);
		const errorMessage = err?.message || "";

		console.error("[Gemini Error]:", errorMessage);

		const invalidKey =
			status === 401 ||
			status === 403 ||
			/API_KEY_INVALID|API key not valid|invalid api key/i.test(errorMessage);

		return {
			ok: false,
			reason: invalidKey ? "invalid_key" : "unavailable",
		};
	}
}

// -------------------------------------------------------------
// Detect if a question is personal (needs student data) or institutional
// -------------------------------------------------------------
function isPersonalQuery(message) {
	const text = message.toLowerCase();

	const personalKeywords = [
		"minha",
		"minhas",
		"meu",
		"meus",
		"como estou",
		"nota",
		"notas",
		"falta",
		"faltas",
		"disciplina",
		"disciplinas",
		"desempenho",
		"cra",
		"turma",
		"turmas",
		"matéria",
		"matérias",
		"boletim",
		"frequência",
		"frequencia",
		"presença",
		"presenca",
		"meu curso",
		"curso que estou",
		"matrícula",
		"matricula",
		"histórico acadêmico",
		"historico academico",
		"situação acadêmica",
		"situacao academica",
	];

	return (
		personalKeywords.some((keyword) => text.includes(keyword)) ||
		/\bcr\b/i.test(text)
	);
}
// -------------------------------------------------------------
// Main orchestrator entry point
// -------------------------------------------------------------
export async function processAgentMessage({
	message,
	agentId = "agy-ufpe",
	context = {},
	uid,
	history = [],
}) {
	const normalizedMsg = message.toLowerCase().trim();

	// Fetch student data from Firestore via UID only (ignore context.student from frontend body)
	const studentRecord = uid
		? await dataStore.getStudentAcademicRecord(uid)
		: null;

	const fullContext = {
		...context,
		student: studentRecord,
		opportunities: dataStore.getOpportunities().slice(0, 3),
	};
	// Remove any student data that came from the frontend body
	delete fullContext.student;
	fullContext.student = studentRecord;

	// Agy UFPE Academic Assistant
	return handleAgyUfpe(message, fullContext, uid, history);
}

// -------------------------------------------------------------
// AGY UFPE - Academic Assistant
// -------------------------------------------------------------
async function handleAgyUfpe(message, context, uid, history = []) {
	const student = context.student;
	const personal = isPersonalQuery(message);
	const hasHistory = Array.isArray(history) && history.length > 0;

	// Histórico faz parte do contexto pessoal da conversa.
	const historyHash = hasHistory
		? hashKey(history.map((h) => `${h.sender}:${h.text}`))
		: "no-history";

	const cacheKey = hashKey([message.toLowerCase().trim(), historyHash]);

	// Perguntas pessoais ou com histórico: cache isolado por UID.
	// Perguntas gerais sem histórico: cache global.
	const useUserCache = personal || hasHistory;

	let cachedResponse = null;

	if (uid && useUserCache) {
		cachedResponse = getCachedUser(uid, cacheKey);
	} else if (uid && !useUserCache) {
		cachedResponse = getCachedGlobal(cacheKey);
	}

	if (cachedResponse) {
		return cachedResponse;
	}

	// Contexto mínimo. Dados do aluno só entram em perguntas pessoais.
	const filteredContext = {
		instituicao: "Universidade Federal de Pernambuco (UFPE)",
	};

	if (personal) {
		filteredContext.perfilAluno = student
			? {
					nome: student.name,
					curso: student.course,
					cra: student.cra ?? student.cr ?? null,
					turmas: student.turmas ?? [],
				}
			: "Aluno sem sincronização ativa do SIGAA";
	}

	const systemInstruction = `Você é a "Agy", a assistente virtual inteligente e acolhedora da Universidade Federal de Pernambuco (UFPE) no projeto "Facul Mind".
Sua missão é combater a evasão universitária, orientar sobre SIGAA, matrícula, trancamento, auxílio permanência (PROAES), Restaurante Universitário (RU) e acolhimento psicológico.

REGRAS OBRIGATÓRIAS:
- Quando o contexto do aluno tiver turmas, notas e faltas sincronizadas do SIGAA, utilize esses dados EXATOS para responder.
- NUNCA invente dados acadêmicos. Se o contexto não contiver a informação solicitada, diga claramente: "Não encontrei essa informação nos seus dados sincronizados. Tente sincronizar novamente pelo SIGAA."
- NUNCA afirme ter consultado o banco de dados ou o SIGAA em tempo real. Você trabalha com os dados que foram previamente sincronizados.
- NUNCA fabrique consultas SQL, queries ao banco, ou afirme que fez uma busca no sistema.
- Responda em Markdown estruturado com tópicos, negrito e emojis acolhedores.
- Seja empática, objetiva, e incentive o bem-estar mental do estudante.
- Considere o histórico da conversa para manter coerência.`;

	const geminiResult = await callGemini({
		message,
		systemInstruction,
		contextData: filteredContext,
		history,
	});

	if (geminiResult.ok) {
		const result = {
			agent: "Agy (Assistente UFPE)",
			avatar: "/mascot.jpeg",
			response: geminiResult.text,
			suggestions: [
				"Como estão minhas notas gerais?",
				"Ver limite de faltas por disciplina",
				"Prazos do calendário acadêmico",
				"Como funciona a ouvidoria acadêmica?",
			],
		};

		// Cache the successful response
		// Nunca armazenar respostas sem UID autenticado.
		if (uid && useUserCache) {
			setCachedUser(uid, cacheKey, result);
		} else if (uid && !useUserCache) {
			setCachedGlobal(cacheKey, result);
		}
		return result;
	}

	// Gemini not configured — return clear message instead of keyword fallback
	const errorMessages = {
		not_configured:
			"A chave da IA não está configurada. Solicite ao administrador que configure o serviço.",

		invalid_key:
			"A chave de acesso ao Gemini é inválida. O administrador precisa verificar a configuração.",

		unavailable:
			"O serviço de IA está temporariamente indisponível. Tente novamente em instantes.",

		empty_response:
			"O Gemini não retornou uma resposta. Tente reformular sua pergunta.",
	};

	return {
		agent: "Agy (Assistente UFPE)",
		avatar: "/mascot.jpeg",
		response:
			errorMessages[geminiResult.reason] ||
			"Não foi possível obter uma resposta neste momento.",
		suggestions: [
			"Acessar portal SIGAA",
			"Sincronizar meus dados",
			"Consultar calendário acadêmico",
		],
	};
}
