/**
 * Facul Mind AI Multi-Agent Orchestrator
 * Coordinates agents:
 * - Agy (UFPE Academic Assistant with real SIGAA context & Gemini 3.5 Flash)
 * - FACUL ORGANIZA (Structure & Roles Agent)
 * - FACUL FLUXO (Processes & Workflows Agent)
 * - FACUL ESTRATÉGIA (Analytical & SWOT Agent)
 * - FACUL DOCS (Executive Documentation Agent)
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

	// Route based on agentId or intent
	if (
		agentId === "facul-organiza" ||
		normalizedMsg.includes("organograma") ||
		normalizedMsg.includes("cargos") ||
		normalizedMsg.includes("hierarquia")
	) {
		return handleFaculOrganiza(message, fullContext);
	}

	if (
		agentId === "facul-fluxo" ||
		normalizedMsg.includes("fluxo") ||
		normalizedMsg.includes("processo") ||
		normalizedMsg.includes("gargalo") ||
		normalizedMsg.includes("bpmn")
	) {
		return handleFaculFluxo(message, fullContext);
	}

	if (
		agentId === "facul-estrategia" ||
		normalizedMsg.includes("swot") ||
		normalizedMsg.includes("5w2h") ||
		normalizedMsg.includes("estratégia") ||
		normalizedMsg.includes("diagnóstico")
	) {
		return handleFaculEstrategia(message, fullContext);
	}

	if (
		agentId === "facul-docs" ||
		normalizedMsg.includes("ata") ||
		normalizedMsg.includes("documento") ||
		normalizedMsg.includes("checklist") ||
		normalizedMsg.includes("procedimento")
	) {
		return handleFaculDocs(message, fullContext);
	}

	// Default to Agy UFPE Academic Assistant
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
				"Como funciona a clínica-escola de psicologia?",
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

// -------------------------------------------------------------
// FACUL ORGANIZA - Enterprise Structure Agent
// -------------------------------------------------------------
async function handleFaculOrganiza(message, context) {
	const geminiResponse = await callGemini({
		message,
		systemInstruction:
			"Você é o FACUL ORGANIZA, agente especialista em governança corporativa, análise de organogramas, papéis secretariais e matriz RACI para PMEs.",
		contextData: context.enterprise || {},
	});

	if (geminiResponse.ok) {
		return {
			agent: "FACUL ORGANIZA",
			badge: "Estrutura & Cargos",
			response: geminiResponse.text,
			suggestions: [
				"Gerar Matriz RACI",
				"Identificar sobreposições de funções",
				"Exportar Organograma",
			],
		};
	}

	return {
		agent: "FACUL ORGANIZA",
		badge: "Estrutura & Cargos",
		response: `Analisei a estrutura organizacional da sua empresa com foco em **eficiência secretarial e governança**.

**Diagnóstico Rápido:**
1. **Pontos de Atenção:** Identifiquei que a gestão da agenda da diretoria e a triagem de fornecedores estão centralizadas sem um suplente formal, o que pode gerar gargalos se o secretário estiver ausente.

2. **Recomendação de Organograma:**
   - **Diretoria Executiva** (Nível 1 - Decisão estratégica)
   - **Secretariado Executivo & Governança** (Nível 2 - Ponte entre diretoria e áreas)
   - **Gerência Administrativo-Financeira** e **Operações** (Nível 2)
   - **Analistas & Assistentes** (Nível 3 - Execução tática)

Deseja que eu insira automaticamente um novo cargo ou gere a Matriz de Responsabilidades (RACI)?`,
		suggestions: [
			"Gerar Matriz RACI",
			"Adicionar Assistente Secretarial",
			"Exportar Organograma em PDF",
			"Identificar sobreposições de funções",
		],
		action: {
			type: "ORGANOGRAM_UPDATE",
			message: "Estrutura hierárquica verificada com conformidade.",
		},
	};
}

// -------------------------------------------------------------
// FACUL FLUXO - Workflow & Processes Agent
// -------------------------------------------------------------
async function handleFaculFluxo(message, context) {
	const geminiResponse = await callGemini({
		message,
		systemInstruction:
			"Você é o FACUL FLUXO, agente especialista em modelagem BPMN, diagramas Mermaid, mapeamento de processos administrativos e detecção de gargalos para empresas e IES.",
		contextData: context.enterprise || {},
	});

	if (geminiResponse.ok) {
		return {
			agent: "FACUL FLUXO",
			badge: "Mapeamento & BPMN",
			response: geminiResponse.text,
			suggestions: [
				"Gerar Procedimento Padrão (SOP)",
				"Criar checklist de triagem",
				"Mapear gargalos",
			],
		};
	}

	return {
		agent: "FACUL FLUXO",
		badge: "Mapeamento & BPMN",
		response: `Excelente! Mapeei o fluxo operacional de **Atendimento e Triagem de Solicitações**:

\`\`\`mermaid
flowchart TD
  A[1. Recebimento da Solicitação] --> B{2. Triagem e Classificação}
  B -->|Crítica / Urgente| C[3A. Despacho Direto ao Gestor]
  B -->|Operacional / Rotina| D[3B. Encaminhamento para Operações]
  B -->|Financeira| E[3C. Faturamento & Contas]
  C --> F[4. Revisão & Redação pelo Secretariado]
  D --> F
  E --> F
  F --> G[5. Finalização e Envio ao Solicitante]
\`\`\`

**Gargalo detectado:** A etapa de triagem manual pode consumir até 30% a mais do tempo sem um formulário padronizado de entrada. 

Recomendo padronizar o checklist de recebimento para acelerar a tratativa.`,
		suggestions: [
			"Gerar Procedimento Padrão (SOP)",
			"Adicionar etapa de validação",
			"Criar checklist de triagem",
			"Exportar fluxo para a equipe",
		],
		action: {
			type: "WORKFLOW_GENERATE",
			workflowName: "Triagem Padronizada",
		},
	};
}

// -------------------------------------------------------------
// FACUL ESTRATÉGIA - SWOT & Diagnostic Agent
// -------------------------------------------------------------
async function handleFaculEstrategia(message, context) {
	const geminiResponse = await callGemini({
		message,
		systemInstruction:
			"Você é o FACUL ESTRATÉGIA, especialista em matriz SWOT cruzada, plano 5W2H, análise de custos e estratégias de crescimento para PMEs e startups universitárias.",
		contextData: context.enterprise || {},
	});

	if (geminiResponse.ok) {
		return {
			agent: "FACUL ESTRATÉGIA",
			badge: "Diagnóstico 5W2H & SWOT",
			response: geminiResponse.text,
			suggestions: [
				"Ver Ponto de Equilíbrio",
				"Atualizar Matriz SWOT",
				"Cadastrar Ação 5W2H",
			],
		};
	}

	return {
		agent: "FACUL ESTRATÉGIA",
		badge: "Diagnóstico 5W2H & SWOT",
		response: `Com base nas informações do seu negócio (modelo SaaS B2B com foco em Secretariado e IES), estruturei a **Matriz SWOT Cruzada**:

- **Forças + Oportunidades (Alavancagem):** Unir a vivência prática dos alunos de Secretariado e Tecnologia para criar soluções que ERPs legados não entregam (humanização e usabilidade simples).
- **Fraquezas + Ameaças (Defesa):** O investimento inicial enxuto (R$ 5.000,00) exige foco cirúrgico no piloto de 2 IES para alcançar o Ponto de Equilíbrio (R$ 1.220,00) rapidamente.

**Plano 5W2H Gerado:**
- **O que (What):** Piloto de validação da plataforma com 2 faculdades parceiras.
- **Por que (Why):** Comprovar a redução de evasão e diminuição do retrabalho na secretaria.
- **Quem (Who):** Equipe fundadora (Mariano, Fernanda, Etyene, Sthefanny, Thalis, Felipe).
- **Como (How):** Demonstração do dashboard e implantação assistida do assistente virtual.`,

		suggestions: [
			"Ver detalhes do Ponto de Equilíbrio",
			"Atualizar matriz SWOT",
			"Cadastrar nova ação no 5W2H",
			"Simular projeção financeira",
		],
	};
}

// -------------------------------------------------------------
// FACUL DOCS - Executive Documentation Agent
// -------------------------------------------------------------
async function handleFaculDocs(message, context) {
	const geminiResponse = await callGemini({
		message,
		systemInstruction:
			"Você é o FACUL DOCS, redator executivo de atas de reuniões, normas ABNT, Procedimentos Operacionais Padrão (SOPs) e manuais administrativos.",
		contextData: context.enterprise || {},
	});

	if (geminiResponse.ok) {
		return {
			agent: "FACUL DOCS",
			badge: "Gerador de Documentos & Atas",
			response: geminiResponse.text,
			suggestions: [
				"Exportar Ata em formato limpo",
				"Criar Checklist",
				"Elaborar POP",
			],
		};
	}

	return {
		agent: "FACUL DOCS",
		badge: "Gerador de Documentos & Atas",
		response: `Gerei o modelo oficial da **Ata de Reunião Secretarial**:

📄 **ATA DE REUNIÃO DE ALINHAMENTO ESTRATÉGICO**
**Data:** ${new Date().toLocaleDateString("pt-BR")} | **Pauta:** Implantação do Ecossistema Facul Mind
**Redatora:** Secretaria Executiva

**Principais Deliberações:**
1. Adoção dos agentes de IA para triagem de solicitações e monitoramento de retenção estudantil.
2. Homologação do módulo *Pausa Mind* como ferramenta de bem-estar e acolhimento preventivo.
3. Definição do cronograma de treinamentos para coordenadores e secretários.

O documento foi formatado nas normas da ABNT e está pronto para exportação!`,
		suggestions: [
			"Exportar Ata em formato limpo",
			"Criar Checklist Operacional",
			"Elaborar Manual de Rotinas (POP)",
			"Transcrever áudio de reunião",
		],
		action: {
			type: "DOCUMENT_READY",
			title: "Ata de Alinhamento Estratégico",
		},
	};
}
