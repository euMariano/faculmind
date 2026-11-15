import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
	invalidateUserCache,
	processAgentMessage,
} from "./agents/orchestrator.js";
import { auth } from "./config/firebaseAdmin.js"; // Importa o auth do Firebase Admin SDK
import { dataStore } from "./data/store.js";
import { parseSigaaContent } from "./services/sigaaParser.js";
import {
	scrapePublicUniversityNotices,
	syncWithSigaa,
} from "./services/sigaaScraper.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

// Middleware para validar Firebase ID Token
const authenticateToken = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ error: "Unauthorized: No token provided or invalid format." });
	}

	const idToken = authHeader.split(" ")[1];

	try {
		const decodedToken = await auth.verifyIdToken(idToken);
		req.uid = decodedToken.uid; // Adiciona o UID do usuário à requisição
		next();
	} catch (error) {
		console.error("Error verifying Firebase ID token:", error.message);
		return res.status(401).json({ error: "Unauthorized: Invalid token." });
	}
};
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Public static files
app.use("/assets", express.static(path.join(__dirname, "../public")));

// -------------------------------------------------------------
// Status endpoint
// -------------------------------------------------------------
app.get("/api/status", (req, res) => {
	res.json({
		status: "online",
		system: "Facul Mind Multi-Agent AI & Platform",
		version: "1.0.0",
		timestamp: new Date().toISOString(),
		geminiConfigured: !!(
			process.env.GEMINI_API_KEY &&
			!process.env.GEMINI_API_KEY.includes("sua_chave")
		),
		sigaaIntegration: "active",
		agents: [
			{
				id: "agy-ufpe",
				name: "Agy (Assistente UFPE)",
				role: "Jornada Acadêmica & RAG",
			},
			{
				id: "facul-organiza",
				name: "FACUL ORGANIZA",
				role: "Estrutura & Organograma",
			},
			{
				id: "facul-fluxo",
				name: "FACUL FLUXO",
				role: "Mapeamento de Processos & BPMN",
			},
			{ id: "facul-estrategia", name: "FACUL ESTRATÉGIA", role: "SWOT & 5W2H" },
			{ id: "facul-docs", name: "FACUL DOCS", role: "Atas, SOPs e Manuais" },
		],
	});
});

// -------------------------------------------------------------
// AI Chat Endpoint
// -------------------------------------------------------------
app.post("/api/chat", authenticateToken, async (req, res) => {
	try {
		const { message, agentId, context, history } = req.body;

		if (typeof message !== "string" || !message.trim()) {
			return res.status(400).json({ error: "Mensagem obrigatória" });
		}

		// Limita o histórico para controlar o consumo de tokens.
		const safeHistory = Array.isArray(history)
			? history.slice(-6).flatMap((item) => {
					if (typeof item?.text !== "string") return [];

					const text = item.text.trim().slice(0, 1500);
					if (!text) return [];

					return [
						{
							sender: item.sender === "user" ? "user" : "assistant",
							text,
						},
					];
				})
			: [];

		const reply = await processAgentMessage({
			message: message.trim(),
			agentId,
			context:
				context && typeof context === "object" && !Array.isArray(context)
					? context
					: {},
			uid: req.uid,
			history: safeHistory,
		});

		res.json(reply);
	} catch (err) {
		console.error("Chat error:", err);

		res.status(500).json({
			error: "Erro ao processar mensagem do agente",
		});
	}
}); // -------------------------------------------------------------
// University Integration & Web Scraping (SIGAA UFPE)
// -------------------------------------------------------------
app.post("/api/sync-university", authenticateToken, async (req, res) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res
				.status(400)
				.json({ success: false, error: "Usuário e senha são obrigatórios." });
		}

		const result = await syncWithSigaa(username, password);
		if (result.success && result.student) {
			await dataStore.saveStudentAcademicRecord(req.uid, result.student); // AGUARDA O FIRESTORE
			invalidateUserCache(req.uid);
		}
		res.json(result);
	} catch (err) {
		console.error("Error syncing university data:", err);
		res.status(400).json({
			success: false,
			error: "Falha ao sincronizar com SIGAA UFPE",
			details: err.message,
		});
	}
});

app.get("/api/sync-university/current", authenticateToken, async (req, res) => {
	try {
		const current = await dataStore.getStudentAcademicRecord(req.uid); // AGUARDA O FIRESTORE
		res.json({ success: true, student: current });
	} catch (error) {
		res.status(500).json({
			success: false,
			error: "Erro ao buscar dados no banco de dados.",
		});
	}
});

app.post("/api/sync-university/import", authenticateToken, async (req, res) => {
	try {
		const { html, rawText, studentName, matricula, course } = req.body;
		let parsedStudent = null;

		if (html || rawText) {
			parsedStudent = parseSigaaContent(html || rawText, {
				studentName,
				matricula,
				course,
			});
		} else {
			return res
				.status(400)
				.json({ error: "Nenhum código HTML ou conteúdo foi enviado." });
		}

		if (!parsedStudent.turmas || parsedStudent.turmas.length === 0) {
			return res.status(400).json({
				error: "Conteúdo do SIGAA inválido ou sem turmas detectadas.",
			});
		}

		await dataStore.saveStudentAcademicRecord(req.uid, parsedStudent); // AGUARDA O FIRESTORE
		invalidateUserCache(req.uid);

		console.log(`[SIGAA Import] Sincronização concluída. [UID: ${req.uid}]`);
		res.json({
			success: true,
			message: "Dados sincronizados.",
			student: parsedStudent,
		});
	} catch (err) {
		console.error("Error importing SIGAA data:", err);
		res.status(500).json({
			success: false,
			error: "Falha ao processar dados: " + err.message,
		});
	}
});

app.get("/api/university/notices", async (req, res) => {
	try {
		const notices = await scrapePublicUniversityNotices();
		res.json(notices);
	} catch (err) {
		res.status(500).json({ error: "Erro ao obter notícias da universidade" });
	}
});

// -------------------------------------------------------------
// Real-time Virtual Room & Networking
// Post-Its: Firestore via Firebase Admin SDK
// Coffee Chats: implementação atual preservada
// -------------------------------------------------------------

app.get("/api/room/postits", authenticateToken, async (req, res) => {
	try {
		const postIts = await dataStore.getPostIts();
		res.json(postIts);
	} catch (error) {
		console.error("Erro ao buscar Post-Its:", error);
		res.status(500).json({
			error: "Erro ao buscar Post-Its.",
		});
	}
});

app.post("/api/room/postits", authenticateToken, async (req, res) => {
	try {
		const { author, avatar, text, tag, color } = req.body;

		if (typeof text !== "string" || !text.trim()) {
			return res.status(400).json({
				error: "Texto é obrigatório.",
			});
		}

		const item = await dataStore.addPostIt({
			authorUid: req.uid,
			author,
			avatar,
			text: text.trim(),
			tag,
			color,
		});

		res.status(201).json(item);
	} catch (error) {
		console.error("Erro ao criar Post-It:", error);
		res.status(500).json({
			error: "Erro ao criar Post-It.",
		});
	}
});

app.post("/api/room/postits/:id/like", authenticateToken, async (req, res) => {
	try {
		const updated = await dataStore.likePostIt(req.params.id);

		if (!updated) {
			return res.status(404).json({
				error: "Post-It não encontrado.",
			});
		}

		res.json(updated);
	} catch (error) {
		console.error("Erro ao curtir Post-It:", error);
		res.status(500).json({
			error: "Erro ao curtir Post-It.",
		});
	}
});

app.get("/api/room/coffee-chats/:tableId", (req, res) => {
	res.json(dataStore.getCoffeeChats(req.params.tableId));
});

app.post("/api/room/coffee-chats/:tableId", authenticateToken, (req, res) => {
	const { user, text } = req.body;
	if (!text) return res.status(400).json({ error: "Texto é obrigatório" });
	const msg = dataStore.addCoffeeMessage(req.params.tableId, { user, text });
	res.status(201).json(msg);
});

// -------------------------------------------------------------
// Academic Radar & Opportunities
// -------------------------------------------------------------
app.get("/api/radar/opportunities", (req, res) => {
	const { category, search } = req.query;
	let items = dataStore.getOpportunities();

	if (category && category !== "Todos") {
		items = items.filter(
			(i) => i.category.toLowerCase() === category.toLowerCase(),
		);
	}
	if (search) {
		const term = search.toLowerCase();
		items = items.filter(
			(i) =>
				i.title.toLowerCase().includes(term) ||
				i.company.toLowerCase().includes(term),
		);
	}
	res.json(items);
});

app.post(
	"/api/radar/opportunities/:id/apply",
	authenticateToken,
	(req, res) => {
		const { studentName, studentCourse, studentEmail } = req.body;
		const opp = dataStore.applyOpportunity(req.params.id, {
			studentName,
			studentCourse,
			studentEmail,
		});
		if (!opp)
			return res.status(404).json({ error: "Oportunidade não encontrada" });
		res.json({
			success: true,
			message: "Candidatura registrada!",
			opportunity: opp,
		});
	},
);

// -------------------------------------------------------------
// Student Support Tickets & Clinic (Totalmente Protegido)
// -------------------------------------------------------------
app.get("/api/tickets", authenticateToken, (req, res) => {
	res.json(dataStore.getTickets());
});

app.post("/api/tickets", authenticateToken, (req, res) => {
	const {
		studentNickname,
		course,
		subject,
		category,
		description,
		priority,
		department,
	} = req.body;
	if (!description || !subject)
		return res
			.status(400)
			.json({ error: "Título e descrição são obrigatórios" });

	const ticket = dataStore.createTicket({
		studentNickname,
		course,
		subject,
		category,
		description,
		priority,
		department,
	});
	res.status(201).json(ticket);
});

app.get("/api/clinic", authenticateToken, (req, res) => {
	res.json(dataStore.getClinicAppointments());
});

app.post("/api/clinic", authenticateToken, (req, res) => {
	const appt = dataStore.createClinicAppointment(req.body);
	res.status(201).json(appt);
});

app.get("/api/permanencia", authenticateToken, (req, res) => {
	res.json(dataStore.getPermanenciaStats());
});

app.post("/api/permanencia", authenticateToken, (req, res) => {
	const updated = dataStore.submitPermanenciaSurvey(req.body);
	res.json({ success: true, stats: updated });
});

// -------------------------------------------------------------
// Enterprise & Secretarial System
// -------------------------------------------------------------
app.get("/api/enterprise", authenticateToken, (req, res) => {
	res.json(dataStore.getEnterpriseData());
});

app.post("/api/enterprise/organization", authenticateToken, (req, res) => {
	const { organization } = req.body;
	if (!organization || !Array.isArray(organization)) {
		return res.status(400).json({ error: "Estrutura inválida de organograma" });
	}
	const updated = dataStore.updateOrgChart(organization);
	res.json(updated);
});

app.post("/api/enterprise/workflows", authenticateToken, (req, res) => {
	const newWf = dataStore.addWorkflow(req.body);
	res.status(201).json(newWf);
});

app.post("/api/enterprise/checklists", authenticateToken, (req, res) => {
	const item = dataStore.addChecklist(req.body);
	res.status(201).json(item);
});

app.put(
	"/api/enterprise/checklists/:id/toggle",
	authenticateToken,
	(req, res) => {
		const updated = dataStore.toggleChecklist(req.params.id);
		if (!updated) return res.status(404).json({ error: "Item não encontrado" });
		res.json(updated);
	},
);

app.post("/api/enterprise/swot", authenticateToken, (req, res) => {
	const updated = dataStore.updateSwot(req.body);
	res.json(updated);
});

app.post("/api/enterprise/documents", authenticateToken, (req, res) => {
	const newDoc = dataStore.addDocument(req.body);
	res.status(201).json(newDoc);
});

// Start Express Server
app.listen(PORT, () => {
	console.log(`🚀 Facul Mind Server rodando na porta ${PORT}`);
});
