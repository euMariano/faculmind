import type {
	ClinicAppointment,
	CoffeeChatMessage,
	Opportunity,
	PostIt,
	StudentAcademicRecord,
	Ticket,
	UniversityNotice,
} from "../types";

const API_BASE = "/api";

// Helper para adicionar o token de autenticação garantindo compatibilidade com HeadersInit
const getAuthHeaders = async (
	getToken: () => Promise<string | null>,
): Promise<Record<string, string>> => {
	const token = await getToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createApi = (getToken: () => Promise<string | null>) => ({
	// Chat (Passo 3)
	async sendChatMessage(
		message: string,
		agentId?: string,
		history?: Array<{
			sender: "user" | "assistant";
			text: string;
		}>,
	) {
		const authHeaders = await getAuthHeaders(getToken);

		const res = await fetch(`${API_BASE}/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify({ message, agentId, history }),
		});

		if (!res.ok) throw new Error("Falha na resposta do assistente");
		return res.json();
	},
	// University Sync & Web Scraping (SIGAA UFPE - Dados Reais)
	async syncUniversity(options: {
		username?: string;
		password?: string;
	}): Promise<{
		success: boolean;
		mode: string;
		message: string;
		student?: StudentAcademicRecord;
		error?: string;
	}> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/sync-university`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(options),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(
				err.details || err.error || "Falha ao sincronizar com o SIGAA UFPE",
			);
		}
		return res.json();
	},

	async getCurrentUniversityData(): Promise<{
		success: boolean;
		student: StudentAcademicRecord | null;
	}> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/sync-university/current`, {
			headers: authHeaders,
		});
		if (!res.ok) throw new Error("Falha ao obter histórico acadêmico");
		return res.json();
	},

	// Importação por Código da Página do SIGAA
	async importUniversityData(payload: {
		html?: string;
		rawText?: string;
		studentName?: string;
		matricula?: string;
		course?: string;
	}): Promise<{
		success: boolean;
		message: string;
		student: StudentAcademicRecord;
	}> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/sync-university/import`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.error || "Falha ao importar dados do SIGAA");
		}
		return res.json();
	},

	// Dynamic Gemini API Key Config
	async getApiStatus() {
		const res = await fetch(`${API_BASE}/status`);
		if (!res.ok) throw new Error("Falha ao verificar status da API");
		return res.json();
	},

	async getUniversityNotices(): Promise<UniversityNotice[]> {
		const res = await fetch(`${API_BASE}/university/notices`);
		if (!res.ok) throw new Error("Falha ao obter notícias da universidade");
		return res.json();
	},

	async getPostIts(): Promise<PostIt[]> {
		const authHeaders = await getAuthHeaders(getToken);

		const res = await fetch(`${API_BASE}/room/postits`, {
			headers: authHeaders,
		});

		if (!res.ok) {
			throw new Error("Falha ao obter post-its");
		}

		return res.json();
	},

	async addPostIt(postIt: Partial<PostIt>): Promise<PostIt> {
		const authHeaders = await getAuthHeaders(getToken);

		const res = await fetch(`${API_BASE}/room/postits`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(postIt),
		});

		if (!res.ok) throw new Error("Falha ao publicar bilhete");
		return res.json();
	},
	async likePostIt(id: string | number): Promise<PostIt> {
		const authHeaders = await getAuthHeaders(getToken);

		const res = await fetch(`${API_BASE}/room/postits/${id}/like`, {
			method: "POST",
			headers: authHeaders,
		});

		if (!res.ok) throw new Error("Falha ao curtir bilhete");
		return res.json();
	},
	async getCoffeeChats(tableId: string): Promise<CoffeeChatMessage[]> {
		const res = await fetch(`${API_BASE}/room/coffee-chats/${tableId}`);
		if (!res.ok) throw new Error("Falha ao obter mensagens da mesa");
		return res.json();
	},

	async sendCoffeeMessage(
		tableId: string,
		message: { user: string; text: string; time?: string },
	): Promise<CoffeeChatMessage> {
		const authHeaders = await getAuthHeaders(getToken);

		const res = await fetch(`${API_BASE}/room/coffee-chats/${tableId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(message),
		});

		if (!res.ok) throw new Error("Falha ao enviar mensagem na mesa");
		return res.json();
	},

	// Opportunities
	async getOpportunities(
		category?: string,
		search?: string,
	): Promise<Opportunity[]> {
		const params = new URLSearchParams();
		if (category) params.set("category", category);
		if (search) params.set("search", search);

		const res = await fetch(
			`${API_BASE}/radar/opportunities?${params.toString()}`,
		);
		if (!res.ok) throw new Error("Falha ao obter oportunidades");
		return res.json();
	},

	async applyOpportunity(
		id: string,
		candidate: {
			studentName: string;
			studentCourse: string;
			studentEmail: string;
		},
	) {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/radar/opportunities/${id}/apply`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(candidate),
		});
		if (!res.ok) throw new Error("Falha ao enviar candidatura");
		return res.json();
	},

	// Tickets
	async getTickets(): Promise<Ticket[]> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/tickets`, { headers: authHeaders });
		if (!res.ok) throw new Error("Falha ao obter manifestações");
		return res.json();
	},

	async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/tickets`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(ticket),
		});
		if (!res.ok) throw new Error("Falha ao registrar manifestação");
		return res.json();
	},

	// Clinic
	async getClinicAppointments(): Promise<ClinicAppointment[]> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/clinic`, { headers: authHeaders });
		if (!res.ok) throw new Error("Falha ao obter agendamentos clínicos");
		return res.json();
	},

	async createClinicAppointment(
		appt: Partial<ClinicAppointment>,
	): Promise<ClinicAppointment> {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/clinic`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(appt),
		});
		if (!res.ok) throw new Error("Falha ao solicitar acolhimento");
		return res.json();
	},

	// Permanência Stats
	async submitPermanencia(survey: {
		mood: string;
		notes?: string;
		academicChallenge?: string;
		financialChallenge?: string;
	}) {
		const authHeaders = await getAuthHeaders(getToken);
		const res = await fetch(`${API_BASE}/permanencia`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders },
			body: JSON.stringify(survey),
		});
		if (!res.ok) throw new Error("Falha ao registrar diagnóstico");
		return res.json();
	},
});

export type ApiService = ReturnType<typeof createApi>;
